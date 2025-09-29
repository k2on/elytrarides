use actix::Handler;
use diesel::QueryResult;
use diesel::prelude::*;
use log::error;

use crate::db_util::DBActor;
use crate::market::util::now;
use crate::schema::reservations::dsl::*;
use crate::schema::users::is_opted_in_sms;

use super::messages::ReservationAssignDriver;
use super::messages::ReservationCancel;
use super::messages::ReservationConfirmArrival;
use super::messages::ReservationConfirmDropoff;
use super::messages::ReservationConfirmPickup;
use super::messages::ReservationGiveCancelReason;
use super::messages::ReservationRate;
use super::messages::ReservationRemoveDriver;
use super::messages::ReservationReserve;
use super::messages::ReservationsClear;
use super::messages::ReservationsInPool;
use super::messages::ReservationsListByReserver;
use super::model::DBReservation;
use super::messages::{ReservationsList, ReservationGet, ReservationGetByReserver};
use super::stops::model::ReservationStop;
use super::stops::model::ReservationStops;

impl Handler<ReservationsList> for DBActor {
    type Result = QueryResult<Vec<DBReservation>>;
    
    fn handle(&mut self, msg: ReservationsList, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        reservations
            .filter(id_event.eq(msg.id_event))
            .get_results::<DBReservation>(&mut conn)
    }
}

impl Handler<ReservationsInPool> for DBActor {
    type Result = QueryResult<Vec<DBReservation>>;
    
    fn handle(&mut self, msg: ReservationsInPool, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        reservations
            .filter(id_event.eq(msg.id_event))
            .filter(is_cancelled.eq(false))
            .filter(is_complete.eq(false))
            .filter(id_driver.is_null())
            .order(made_at.asc())
            .get_results::<DBReservation>(&mut conn)
    }
}

impl Handler<ReservationGet> for DBActor {
    type Result = QueryResult<DBReservation>;
    
    fn handle(&mut self, msg: ReservationGet, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        reservations
            .filter(id.eq(msg.id))
            .first::<DBReservation>(&mut conn)
    }
}


impl Handler<ReservationGetByReserver> for DBActor {
    type Result = QueryResult<DBReservation>;
    
    fn handle(&mut self, msg: ReservationGetByReserver, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        reservations
            .filter(reserver.eq(msg.phone))
            .filter(id_event.eq(msg.id_event))
            .filter(is_cancelled.eq(false))
            .filter(is_complete.eq(false))
            .first(&mut conn)
    }
}

impl Handler<ReservationsListByReserver> for DBActor {
    type Result = QueryResult<Vec<DBReservation>>;
    
    fn handle(&mut self, msg: ReservationsListByReserver, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        reservations
            .filter(reserver.eq(msg.phone))
            .get_results::<DBReservation>(&mut conn)
    }
}

impl Handler<ReservationReserve> for DBActor {
    type Result = QueryResult<DBReservation>;
    
    fn handle(&mut self, msg: ReservationReserve, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        let reservation = DBReservation {
            made_at: now(),
            reserver: msg.phone.to_string(),
            passenger_count: msg.form.passenger_count,
            is_cancelled: false,
            cancelled_at: None,
            id_driver: None,
            is_complete: false,
            complete_at: None,
            stops: ReservationStops::new(msg.form.stops),
            is_dropoff: msg.form.is_dropoff,
            id: msg.id,
            id_event: msg.id_event,
            is_driver_arrived: false,
            driver_arrived_at: None,
            est_pickup: msg.est_pickup,
            est_dropoff: msg.est_dropoff,
            rating: None,
            feedback: None,
            rated_at: None,
            cancel_reason: None,
            cancel_reason_at: None,
        };


        diesel::insert_into(reservations)
            .values(&reservation)
            .on_conflict(id)
            .do_update()
            .set(&reservation)
            .execute(&mut conn)?;

        Ok(reservation)
    }
}

impl Handler<ReservationCancel> for DBActor {
    type Result = QueryResult<DBReservation>;
    
    fn handle(&mut self, msg: ReservationCancel, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        diesel::update(reservations.find(msg.id))
            .set((is_cancelled.eq(true), cancelled_at.eq(now() as i32)))
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
            .filter(is_cancelled.eq(false))
            .filter(is_complete.eq(false))
            .first::<DBReservation>(&mut conn)
            .unwrap();

        let is_pickup = !reservation.is_dropoff;
        if is_pickup {
            let stops_incomplete: Vec<(usize, &ReservationStop)> = reservation.stops.get_stops().iter().enumerate().filter(|(_, res_stop)| !res_stop.is_complete).collect();
            // let is_final_stop = stops_incomplete.len() == 1; // maybe use when you can have
            // mulitple stops for a pickup res
            let (idx, stop_not_complete) = stops_incomplete.first().expect("No more incomplete stops").clone();
            let mut stop_complete = stop_not_complete.clone();
            stop_complete.is_complete = true;
            stop_complete.complete_at = Some(now().try_into().unwrap());

            let mut stops_new = reservation.stops.clone().get_stops_mut().clone();
            stops_new.remove(idx);
            stops_new.insert(idx, stop_complete);

            diesel::update(reservations.find(msg.id))
                .set(stops.eq(ReservationStops(stops_new)))
                .get_result::<DBReservation>(&mut conn)
        } else {
            Ok(reservation)
        }
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


        if reservation.is_dropoff {
            let stops_incomplete: Vec<(usize, &ReservationStop)> = reservation.stops.get_stops().iter().enumerate().filter(|(_, res_stop)| !res_stop.is_complete).collect();
            let is_final_stop = stops_incomplete.len() == 1;
            let (idx, stop_not_complete) = stops_incomplete.first().expect("No more incomplete stops").clone();
            let mut stop_complete = stop_not_complete.clone();
            stop_complete.is_complete = true;
            stop_complete.complete_at = Some(now().try_into().unwrap());

            let mut stops_new = reservation.stops.clone().get_stops_mut().clone();
            stops_new.remove(idx);
            stops_new.insert(idx, stop_complete);

            diesel::update(reservations.find(msg.id))
                .set((stops.eq(ReservationStops(stops_new)), is_complete.eq(is_final_stop), complete_at.eq(if is_final_stop { Some(now()) } else { None })))
                .get_result::<DBReservation>(&mut conn)
        } else {
            diesel::update(reservations.find(msg.id))
                .set((is_complete.eq(true), complete_at.eq(Some(now()))))
                .get_result::<DBReservation>(&mut conn)
        }

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
                        .set(id_driver.eq(msg.id_driver))
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

        diesel::delete(reservations.filter(id_event.eq(msg.id_event)))
            .execute(&mut conn)
    }

}

impl Handler<ReservationConfirmArrival> for DBActor {
    type Result = QueryResult<DBReservation>;

    fn handle(&mut self, msg: ReservationConfirmArrival, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Unable to establish connection");
            diesel::update(reservations.find(msg.id))
                .set((is_driver_arrived.eq(true), driver_arrived_at.eq(Some(now()))))
                .get_result::<DBReservation>(&mut conn)
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

