use actix::Handler;
use diesel::QueryResult;
use diesel::expression::SqlLiteral;
use diesel::prelude::*;
use diesel::result::Error::NotFound;
use diesel::sql_types::{Integer, Uuid as DieselUuid, Timestamp, Varchar}; // Import types if needed for `.aliased`
use log::error;
use reservation_stops::{stop_order, id_reservation};
use uuid::Uuid;

use crate::db_util::DBActor;
use crate::graphql::reservations::DBReservationJoinable;
use crate::market::util::now;
use crate::schema::reservations::dsl::*;
use crate::schema::reservation_stops::dsl as reservation_stops;
use crate::schema::users::is_opted_in_sms;
use crate::types::phone::Phone;

use super::{Reservation, ReservationWithoutStops};
use super::ReservationStatus;
use super::feedback::model::Feedback;
use super::messages::{ReservationAssignDriver, ReservationCompleteStop, ReservationComplete, ReservationsListWithoutStops, ReservationStopConfirmArrival, ReservationGetWithoutStops};
use super::messages::ReservationCancel;
use super::messages::ReservationConfirmDropoff;
use super::messages::ReservationConfirmPickup;
use super::messages::ReservationGetStops;
use super::messages::ReservationGiveCancelReason;
use super::messages::ReservationRate;
use super::messages::ReservationRemoveDriver;
use super::messages::ReservationReserve;
use super::messages::ReservationStopsListByReserver;
use super::messages::ReservationsClear;
use super::messages::ReservationsInPool;
use super::model::DBReservation;
use super::messages::{ReservationsList, ReservationGet, ReservationGetByReserver};
use super::stops::model::DBReservationStop;
use super::stops::model::ReservationStop;
use super::stops::model::ReservationStops;

use itertools::Itertools; // For group_by and other utilities

fn get_reservation_select() -> (
    made_at,
    reserver,
    passenger_count,
    cancelled_at,
    id_driver,
    id,
    id_event,
    rating,
    feedback,
    rated_at,
    cancel_reason,
    cancel_reason_at,
    status,
    driver_assigned_at,
    initial_passenger_count,
    actual_passenger_count_given_at,
    SqlLiteral<DieselUuid>,
    reservation_stops::id_reservation,
    reservation_stops::stop_order,
    reservation_stops::eta,
    reservation_stops::created_at,
    reservation_stops::updated_at,
    reservation_stops::complete_at,
    reservation_stops::driver_arrived_at,
    reservation_stops::is_event_location,
    reservation_stops::lat,
    reservation_stops::lng,
    reservation_stops::lat_address,
    reservation_stops::lng_address,
    reservation_stops::address_main,
    reservation_stops::address_sub,
    reservation_stops::place_id,
    ) {
    (
        made_at,
        reserver,
        passenger_count,
        cancelled_at,
        id_driver,
        id,
        id_event,
        rating,
        feedback,
        rated_at,
        cancel_reason,
        cancel_reason_at,
        status,
        driver_assigned_at,
        initial_passenger_count,
        actual_passenger_count_given_at,

        diesel::dsl::sql::<DieselUuid>("reservation_stops.id AS id_stop"),
        reservation_stops::id_reservation,
        reservation_stops::stop_order,
        reservation_stops::eta,
        reservation_stops::created_at,
        reservation_stops::updated_at,
        reservation_stops::complete_at,
        reservation_stops::driver_arrived_at,
        reservation_stops::is_event_location,
        reservation_stops::lat,
        reservation_stops::lng,
        reservation_stops::lat_address,
        reservation_stops::lng_address,
        reservation_stops::address_main,
        reservation_stops::address_sub,
        reservation_stops::place_id,
    )
}


fn transform_to_reservations(db_res_entries: Vec<DBReservationJoinable>) -> Vec<Reservation> {
    db_res_entries
        .into_iter()
        .sorted_by(|a, b| a.id.cmp(&b.id))
        .group_by(|entry| entry.id)
        .into_iter()
        .map(|(reservation_id, group)| {
            let entries: Vec<_> = group.collect();

            // Assuming each group has at least one entry, use the first one to construct the reservation part
            let db_res = entries.first().expect("Should have at least one reservation").clone(); // Safe due to above assumption

            let stops = entries
                .into_iter()
                .map(|entry| ReservationStop {
                    id: entry.id_stop,
                    id_reservation: entry.id_reservation,
                    stop_order: entry.stop_order,
                    eta: entry.eta,
                    created_at: entry.created_at,
                    updated_at: entry.updated_at,
                    complete_at: entry.complete_at,
                    driver_arrived_at: entry.driver_arrived_at,
                    is_event_location: entry.is_event_location,
                    lat: entry.lat,
                    lng: entry.lng,
                    lat_address: entry.lat_address,
                    lng_address: entry.lng_address,
                    address_main: entry.address_main,
                    address_sub: entry.address_sub,
                    place_id: entry.place_id,
                })
                .sorted_by(|a, b| a.stop_order.cmp(&b.stop_order))
                .collect::<Vec<_>>();

            Reservation {
                id: reservation_id,
                id_event: db_res.id_event,
                made_at: db_res.made_at,
                reserver: Phone::new(&db_res.reserver).expect("Invalid phone number format"),
                passenger_count: db_res.passenger_count,
                cancelled_at: db_res.cancelled_at,
                id_driver: db_res.id_driver,
                rating: db_res.rating,
                feedback: db_res.feedback.map(|flags| Feedback {
                    is_long_wait: flags & 1 != 0,
                    is_eta_accuracy: flags & 2 != 0,
                    is_pickup_spot: flags & 4 != 0,
                    is_driver_never_arrived: flags & 8 != 0,
                }),
                rated_at: db_res.rated_at,
                cancel_reason: db_res.cancel_reason,
                cancel_reason_at: db_res.cancel_reason_at,
                status: ReservationStatus::new(db_res.status),
                driver_assigned_at: db_res.driver_assigned_at,
                initial_passenger_count: db_res.initial_passenger_count,
                actual_passenger_count_given_at: db_res.actual_passenger_count_given_at,
                stops, // Add the collected stops here
            }
        })
        .sorted_by(|a, b| a.made_at.cmp(&b.made_at))
        .collect::<Vec<_>>()
}

fn transform_to_reservation(joined: Vec<DBReservationJoinable>) -> QueryResult<Reservation> {
    let reservation_vec = transform_to_reservations(joined);
    reservation_vec.first().map(|r| r.clone()).ok_or(NotFound)
}

impl Handler<ReservationsList> for DBActor {
    type Result = QueryResult<Vec<Reservation>>;
    
    fn handle(&mut self, msg: ReservationsList, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        let joined: Vec<DBReservationJoinable> = reservations
            .inner_join(reservation_stops::reservation_stops.on(reservation_stops::id_reservation.eq(id)))
            .select(get_reservation_select())
            .filter(id_event.eq(msg.id_event))
            .get_results::<DBReservationJoinable>(&mut conn)?;
        Ok(transform_to_reservations(joined))
    }
}
impl Handler<ReservationsInPool> for DBActor {
    type Result = QueryResult<Vec<Reservation>>;
    
    fn handle(&mut self, msg: ReservationsInPool, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        let joined: Vec<DBReservationJoinable> = reservations
            .inner_join(reservation_stops::reservation_stops.on(reservation_stops::id_reservation.eq(id)))
            .select(get_reservation_select())
            .filter(id_event.eq(msg.id_event))
            .filter(status.eq(ReservationStatus::WAITING.int()))
            .load::<DBReservationJoinable>(&mut conn)?;
        let results = transform_to_reservations(joined);
        Ok(results)
    }
}

impl Handler<ReservationGet> for DBActor {
    type Result = QueryResult<Reservation>;
    
    fn handle(&mut self, msg: ReservationGet, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        let joined: Vec<DBReservationJoinable> = reservations
            .inner_join(reservation_stops::reservation_stops.on(reservation_stops::id_reservation.eq(id)))
            .select(get_reservation_select())
            .filter(id.eq(msg.id))
            .load::<DBReservationJoinable>(&mut conn)?;
        transform_to_reservation(joined)
    }
}

impl Handler<ReservationGetWithoutStops> for DBActor {
    type Result = QueryResult<ReservationWithoutStops>;
    
    fn handle(&mut self, msg: ReservationGetWithoutStops, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        Ok(reservations.find(msg.id)
            .get_result::<DBReservation>(&mut conn)?
            .into())
    }
}

impl Handler<ReservationGetByReserver> for DBActor {
    type Result = QueryResult<Reservation>;
    
    fn handle(&mut self, msg: ReservationGetByReserver, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        let joined: Vec<DBReservationJoinable> = reservations
            .inner_join(reservation_stops::reservation_stops.on(reservation_stops::id_reservation.eq(id)))
            .select(get_reservation_select())
            .filter(id_event.eq(msg.id_event))
            .filter(reserver.eq(msg.phone))
            .filter(status.le(ReservationStatus::ACTIVE.int()))
            .load::<DBReservationJoinable>(&mut conn)?;
        transform_to_reservation(joined)
    }
}

impl Handler<ReservationReserve> for DBActor {
    type Result = QueryResult<Reservation>;
    
    fn handle(&mut self, msg: ReservationReserve, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        let reservation = DBReservation {
            made_at: now(),
            reserver: msg.phone.to_string(),
            passenger_count: msg.input.passenger_count,
            cancelled_at: None,
            id_driver: None,
            id: msg.id,
            id_event: msg.id_event,
            rating: None,
            feedback: None,
            rated_at: None,
            cancel_reason: None,
            cancel_reason_at: None,
            status: ReservationStatus::WAITING.int(),
            driver_assigned_at: None,
            initial_passenger_count: msg.input.passenger_count,
            actual_passenger_count_given_at: None,
        };

        let stops: Vec<DBReservationStop> = msg.input.stops
            .iter()
            .map(|stop| DBReservationStop {
                id: stop.id,
                id_reservation: msg.id,
                stop_order: stop.stop_order,
                eta: msg.stop_etas
                    .get(stop.stop_order as usize)
                    .map(|est| est.eta)
                    .unwrap_or(-1),
                created_at: now(),
                updated_at: None,
                complete_at: None,
                driver_arrived_at: None,
                is_event_location: stop.is_event_location,
                lat: stop.lat,
                lng: stop.lng,
                lat_address: stop.lat,
                lng_address: stop.lng,
                address_main: stop.address_main.clone(),
                address_sub: stop.address_sub.clone(),
                place_id: stop.place_id.clone(),
            })
            .collect();

        diesel::insert_into(reservation_stops::reservation_stops)
            .values(&stops)
            .on_conflict(reservation_stops::id)
            .do_nothing()
            .execute(&mut conn)?;

        diesel::insert_into(reservations)
            .values(&reservation)
            .on_conflict(id)
            .do_update()
            .set(&reservation)
            .execute(&mut conn)?;

        let result = Reservation::new(reservation, stops.into_iter().map(ReservationStop::from).collect());

        Ok(result)
    }
}

impl Handler<ReservationCancel> for DBActor {
    type Result = QueryResult<DBReservation>;
    
    fn handle(&mut self, msg: ReservationCancel, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        diesel::update(reservations.find(msg.id))
            .set((status.eq(ReservationStatus::CANCELLED.int()), cancelled_at.eq(now() as i32)))
            .get_result::<DBReservation>(&mut conn)
    }
}

impl Handler<ReservationCompleteStop> for DBActor {
    type Result = QueryResult<DBReservationStop>;

    fn handle(&mut self, msg: ReservationCompleteStop, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("ReservationCompletStop: Unable to establish connection");

        diesel::update(reservation_stops::reservation_stops.find(msg.id_stop))
            .set((
                reservation_stops::complete_at.eq(Some(now())),
                reservation_stops::updated_at.eq(Some(now())),
            ))
            .get_result::<DBReservationStop>(&mut conn)
    }
}

impl Handler<ReservationComplete> for DBActor {
    type Result = QueryResult<DBReservation>;

    fn handle(&mut self, msg: ReservationComplete, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("ReservationCompletStop: Unable to establish connection");

        diesel::update(reservations.find(msg.id))
            .set(status.eq(ReservationStatus::COMPLETE.int()))
            .get_result::<DBReservation>(&mut conn)
    }
}

impl Handler<ReservationConfirmPickup> for DBActor {
    type Result = QueryResult<DBReservation>;

    fn handle(&mut self, msg: ReservationConfirmPickup, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self
            .0
            .get()
            .expect("ReservationConfirmPickup: Unable to establish connection");

        let reservation: DBReservation = reservations.find(msg.id)
            .filter(status.le(ReservationStatus::ACTIVE.int()))
            .first::<DBReservation>(&mut conn)
            .unwrap();

        todo!()

        // let is_pickup = !reservation.is_dropoff;
        // if is_pickup {
        //     let stops_incomplete: Vec<(usize, &ReservationStop)> = reservation.stops.get_stops().iter().enumerate().filter(|(_, res_stop)| !res_stop.is_complete).collect();
        //     // let is_final_stop = stops_incomplete.len() == 1; // maybe use when you can have
        //     // mulitple stops for a pickup res
        //     let (idx, stop_not_complete) = stops_incomplete.first().expect("No more incomplete stops").clone();
        //     let mut stop_complete = stop_not_complete.clone();
        //     stop_complete.is_complete = true;
        //     stop_complete.complete_at = Some(now().try_into().unwrap());

        //     let mut stops_new = reservation.stops.clone().get_stops_mut().clone();
        //     stops_new.remove(idx);
        //     stops_new.insert(idx, stop_complete);

        //     diesel::update(reservations.find(msg.id))
        //         // .set(stops.eq(ReservationStops(stops_new)))
        //         .get_result::<DBReservation>(&mut conn)
        // } else {
        //     Ok(reservation)
        // }
    }
}

impl Handler<ReservationConfirmDropoff> for DBActor {
    type Result = QueryResult<DBReservation>;

    fn handle(&mut self, msg: ReservationConfirmDropoff, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self
            .0
            .get()
            .expect("ReservationConfirmDropoff: Unable to establish connection");

        let reservation: DBReservation = reservations.find(msg.id)
            // .filter(is_cancelled.eq(false))
            // .filter(is_complete.eq(false))
            .first::<DBReservation>(&mut conn)
            .unwrap();

        todo!()

        // if reservation.is_dropoff {
        //     let stops_incomplete: Vec<(usize, &ReservationStop)> = reservation.stops.get_stops().iter().enumerate().filter(|(_, res_stop)| !res_stop.is_complete).collect();
        //     let is_final_stop = stops_incomplete.len() == 1;
        //     let (idx, stop_not_complete) = stops_incomplete.first().expect("No more incomplete stops").clone();
        //     let mut stop_complete = stop_not_complete.clone();
        //     stop_complete.is_complete = true;
        //     stop_complete.complete_at = Some(now().try_into().unwrap());

        //     let mut stops_new = reservation.stops.clone().get_stops_mut().clone();
        //     stops_new.remove(idx);
        //     stops_new.insert(idx, stop_complete);

        //     diesel::update(reservations.find(msg.id))
        //         // .set((stops.eq(ReservationStops(stops_new)), is_complete.eq(is_final_stop), complete_at.eq(if is_final_stop { Some(now()) } else { None })))
        //         .get_result::<DBReservation>(&mut conn)
        // } else {
        //     diesel::update(reservations.find(msg.id))
        //         // .set((is_complete.eq(true), complete_at.eq(Some(now()))))
        //         .get_result::<DBReservation>(&mut conn)
        // }

    }
}


impl Handler<ReservationAssignDriver> for DBActor {
    type Result = QueryResult<DBReservation>;

    fn handle(&mut self, msg: ReservationAssignDriver, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Unable to establish connection");
        conn.transaction::<_, diesel::result::Error, _>(|c| {
            // Attempt to find the reservation that hasn't been assigned yet, and lock it
            let target_reservation = reservations
                .filter(id.eq(msg.id))
                .filter(id_driver.is_null())
                .for_update() // Lock the row for update
                .first::<DBReservation>(c);

            match target_reservation {
                Ok(_) => {
                    // Proceed to update if the reservation is found and not yet assigned
                    diesel::update(reservations.find(msg.id))
                        .set((id_driver.eq(msg.id_driver), status.eq(ReservationStatus::ACTIVE.int()), driver_assigned_at.eq(Some(now()))))
                        .get_result::<DBReservation>(c)
                },
                Err(_) => Err(diesel::result::Error::NotFound),
            }
        })
    }
}

impl Handler<ReservationRemoveDriver> for DBActor {
    type Result = QueryResult<DBReservation>;

    fn handle(&mut self, msg: ReservationRemoveDriver, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Unable to establish connection");

        error!("Removing driver assignment to reservation with id: {}", msg.id);
        diesel::update(reservations.find(msg.id))
            .set(id_driver.eq(None::<i32>))
            .get_result::<DBReservation>(&mut conn)
    }
}


impl Handler<ReservationsClear> for DBActor {
    type Result = QueryResult<usize>;

    fn handle(&mut self, msg: ReservationsClear, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Unable to establish connection");

        let reservation_ids = reservations
            .filter(id_event.eq(msg.id_event))
            .select(id)
            .load::<Uuid>(&mut conn)?;

        diesel::delete(
            reservation_stops::reservation_stops
                .filter(reservation_stops::id_reservation.eq_any(reservation_ids))
        )
            .execute(&mut conn)?;

        diesel::delete(reservations.filter(id_event.eq(msg.id_event)))
            .execute(&mut conn)
    }

}

impl Handler<ReservationStopConfirmArrival> for DBActor {
    type Result = QueryResult<DBReservationStop>;

    fn handle(&mut self, msg: ReservationStopConfirmArrival, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Unable to establish connection");

        diesel::update(reservation_stops::reservation_stops.find(msg.id_stop))
            .set((reservation_stops::driver_arrived_at.eq(Some(now())), reservation_stops::updated_at.eq(Some(now()))))
            .get_result::<DBReservationStop>(&mut conn)

        // diesel::update(reservations.find(msg.id))
        //     .set(updated_at.eq(Some(now())))
        //     .execute(&mut conn)?;
    }

}

impl Handler<ReservationRate> for DBActor {
    type Result = QueryResult<DBReservation>;
    
    fn handle(&mut self, msg: ReservationRate, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        diesel::update(reservations.find(msg.id))
            .set((rating.eq(msg.rating), feedback.eq(msg.feedback), rated_at.eq(now() as i32)))
            .get_result::<DBReservation>(&mut conn)
    }
}


impl Handler<ReservationGiveCancelReason> for DBActor {
    type Result = QueryResult<DBReservation>;
    
    fn handle(&mut self, msg: ReservationGiveCancelReason, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        diesel::update(reservations.find(msg.id))
            .set((cancel_reason.eq(msg.reason), cancel_reason_at.eq(now() as i32)))
            .get_result::<DBReservation>(&mut conn)
    }
}

impl Handler<ReservationGetStops> for DBActor {
    type Result = QueryResult<Vec<DBReservationStop>>;
    
    fn handle(&mut self, msg: ReservationGetStops, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        reservation_stops::reservation_stops
            .filter(reservation_stops::id_reservation.eq(msg.id))
            .get_results::<DBReservationStop>(&mut conn)
    }
}

impl Handler<ReservationStopsListByReserver> for DBActor {
    type Result = QueryResult<Vec<DBReservationStop>>;
    
    fn handle(&mut self, msg: ReservationStopsListByReserver, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        reservation_stops::reservation_stops
            .inner_join(reservations.on(reservation_stops::id_reservation.eq(id)))
            .filter(reserver.eq(msg.phone))
            .filter(reservation_stops::place_id.is_not_null())
            .select(reservation_stops::reservation_stops::all_columns())
            .get_results::<DBReservationStop>(&mut conn)
    }
}

impl Handler<ReservationsListWithoutStops> for DBActor {
    type Result = QueryResult<Vec<ReservationWithoutStops>>;
    
    fn handle(&mut self, msg: ReservationsListWithoutStops, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        let res = reservations
            .filter(id.eq_any(msg.ids))
            .get_results::<DBReservation>(&mut conn)?;
        Ok(res.into_iter().map(ReservationWithoutStops::from).collect())
    }
}

