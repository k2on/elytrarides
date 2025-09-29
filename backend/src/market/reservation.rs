use actix::Addr;
use uuid::Uuid;

use crate::{db_util::DBActor, graphql::reservations::{Reservation, messages::{ReservationReserve, ReservationCancel, ReservationGet}, FormReservation}, types::phone::Phone};

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
        let reservation: Reservation = self.db.send(ReservationGet { id: *id_reservation }).await??.into();
        Ok(reservation)
    }

    pub async fn create(&self, phone: &Phone, id: &Uuid, id_event: &Uuid, form: FormReservation) -> MarketResult<Reservation> {
        let form_geocoded = self.geocoder.geocode_form(&form).await?;
        let est = self.event.get_estimate_reservation_preinsert(id_event, id, &form_geocoded).await;
        let est_pickup = if let Ok(e) = &est { e.time_estimate.pickup.num_seconds() as i32 } else { 0 };
        let est_dropoff = if let Ok(e) = est { e.time_estimate.arrival.num_seconds() as i32 } else { 0 };
        let result: Reservation = self.db.send(ReservationReserve {
            id: id.to_owned(),
            id_event: id_event.to_owned(),
            phone: phone.to_owned(),
            form: form_geocoded,
            est_pickup,
            est_dropoff,
        }).await??.into();
        self.messanger.send_reservation_update(result.clone()).await?;
        Ok(result)
    }

    pub async fn cancel(&self, id: &Uuid) -> MarketResult<Reservation> {
        let reservation: Reservation = self.db.send(ReservationCancel { id: id.to_owned() }).await??.into();
        self.messanger.send_reservation_update(reservation.clone()).await?;
        if let Some(id_driver) = reservation.id_driver {
            let id_reservation = id.clone();
            self.event.update_driver_strategy(&reservation.id_event, &id_driver, Box::new(move |mut driver: DriverStrategy| {
                if driver.picked_up.contains_key(&id_reservation) { return Err(ErrorMarket::ReservationIsPickedUp)}
                match &driver.dest {
                    Some(DriverStop::Reservation(res)) if res.id_reservation.eq(&id_reservation) => {
                        driver.dest = None;
                        assert!(matches!(driver.queue.remove(0), DriverStop::Event(_)));
                    },
                    Some(DriverStop::Event(_)) => {
                        let new_queue: Vec<DriverStop> = driver.queue.iter()
                            .cloned()
                            .filter(|stop| match stop {
                                DriverStop::Reservation(res) if res.id_reservation.eq(&id_reservation) => false,
                                _ => true,
                            })
                            .collect();

                        if new_queue.is_empty() {
                            driver.dest = None;
                        }
                        driver.queue = new_queue;
                    }
                    _ => (),
                };
                Ok(driver)
            })).await?;
        }
        Ok(reservation)
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
}
 
