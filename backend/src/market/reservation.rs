use actix::Addr;
use uuid::Uuid;

use crate::{db_util::DBActor, graphql::reservations::{Reservation, messages::{ReservationReserve, ReservationCancel, ReservationGet, ReservationGetStops}, FormReservation, stops::model::ReservationStop}, types::phone::Phone};

use super::{types::{MarketResult, ReservationEstimate}, event::MarketEvent, geocoder::Geocoder, messanger::Messanger, strategy::driver::{model::DriverStrategy, stop::model::DriverStop}, error::ErrorMarket};

pub struct MarketReservation {
    db: Addr<DBActor>,
    geocoder: Box<dyn Geocoder>,
    messanger: Box<dyn Messanger>,
    event: MarketEvent,
}

impl Clone for MarketReservation {
    fn clone(&self) -> Self {
        Self {
            db: self.db.clone(),
            geocoder: self.geocoder.box_clone(),
            messanger: self.messanger.box_clone(),
            event: self.event.clone(),
        }
    }
}

impl MarketReservation {
    pub fn new(db: Addr<DBActor>, geocoder: Box<dyn Geocoder>, messanger: Box<dyn Messanger>, event: MarketEvent) -> Self {
        Self {
            db,
            geocoder,
            messanger,
            event,
        }
    }

    pub async fn get(&self, id_reservation: &Uuid) -> MarketResult<Reservation> {
        let reservation = self.db.send(ReservationGet { id: *id_reservation }).await??;
        Ok(reservation)
    }

    pub async fn create(&self, phone: &Phone, id: &Uuid, id_event: &Uuid, form: FormReservation) -> MarketResult<Reservation> {
        let input = self.event.process_reserveration_input(id_event, &form).await?;

        let ReservationEstimate { stop_etas, .. } = self.event.get_estimate_reservation_preinsert(id_event, id, &input).await?;

        let result = self.db
            .send(ReservationReserve {
                id: id.to_owned(),
                id_event: id_event.to_owned(),
                phone: phone.to_owned(),
                input,
                stop_etas,
            }).await??;

        self.messanger.send_reservation_update(result.clone()).await?;
        Ok(result)
    }

    pub async fn cancel(&self, id: &Uuid) -> MarketResult<Reservation> {
        let reservation: Reservation = self.db.send(ReservationGet { id: *id }).await??;
        if reservation.cancelled_at.is_some() { return Ok(reservation) }
        if reservation.stops.iter().any(|stop| stop.complete_at.is_some()) { return Err(ErrorMarket::HasPickup) }

        self.db.send(ReservationCancel { id: id.to_owned() }).await??;
        let reservation: Reservation = self.db.send(ReservationGet { id: *id }).await??;

        self.messanger.send_reservation_update(reservation.clone()).await?;

        match reservation.id_driver {
            None => Ok(reservation),
            Some(id_driver) => {
                let id_reservation = id.clone();
                self.event.update_driver_strategy(&reservation.id_event, &id_driver, Box::new(move |mut driver: DriverStrategy| {
                    if driver.picked_up.contains_key(&id_reservation) { return Err(ErrorMarket::ReservationIsPickedUp)}
                    match &driver.dest {
                        Some(dest) if dest.id_reservation.eq(&id_reservation) => {
                            driver.dest = None;
                        }
                        _ => (),
                    };

                    let new_queue: Vec<DriverStop> = driver.queue.iter()
                        .cloned()
                        .filter(|stop| !stop.id_reservation.eq(&id_reservation))
                        .collect();

                    driver.queue = new_queue;

                    Ok(driver)
                })).await?;
                Ok(reservation)
            }
        }
    }

    pub async fn estimate(&self, reservation: &Reservation) -> MarketResult<ReservationEstimate> {
        self.event.get_estimate_reservation(reservation).await
    }

    pub async fn is_picked_up(&self, reservation: &Reservation) -> MarketResult<bool> {
        let is_picked_up = self.event.get_estimates(&reservation.id_event).await?
            .drivers()
            .iter()
            .any(|driver| driver.is_picked_up(&reservation.id));
        Ok(is_picked_up)
    }

    pub async fn get_stops(&self, id: &Uuid) -> MarketResult<Vec<ReservationStop>> {
        let db_stops = self.db.send(ReservationGetStops { id: *id }).await??;
        let stops = db_stops.into_iter().map(ReservationStop::from).collect();
        Ok(stops)
    }
}
 
