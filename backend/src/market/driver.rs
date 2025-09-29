use actix::Addr;
use kv::Store;
use log::warn;
use uuid::Uuid;

use crate::{db_util::DBActor, graphql::{drivers::{Driver, messages::{EventDriverGet, EventDriverFind}, DriverWithVehicle}, geo::model::LatLng, reservations::{Reservation, messages::{ReservationAssignDriver, ReservationConfirmPickup, ReservationConfirmDropoff, ReservationGet, ReservationConfirmArrival}}, users::{messages::UserGet, User}}, types::phone::Phone, market::{error::ErrorMarket, estimate::driver::stop::model::DriverStopEstimation}};

use super::{types::MarketResult, event::MarketEvent, messanger::Messanger, strategy::{model::IdEventDriver, driver::model::DriverStrategy}, estimate::driver::model::DriverStrategyEstimations, pusher::Pushers};

pub struct MarketDriver {
    db: Addr<DBActor>,
    kv: Store,
    event: MarketEvent,
    messanger: Box<dyn Messanger>,
    push: Pushers,
}

impl Clone for MarketDriver {
    fn clone(&self) -> Self {
        Self {
            db: self.db.clone(),
            kv: self.kv.clone(),
            event: self.event.clone(),
            messanger: self.messanger.box_clone(),
            push: self.push.clone()
        }
    }
}

impl MarketDriver {
    pub fn new(db: Addr<DBActor>, kv: Store, messanger: Box<dyn Messanger>, event: MarketEvent, push: Pushers) -> Self {
        Self {
            db,
            kv,
            messanger,
            event,
            push,
        }
    }

    #[doc = "Get a driver with their id"]
    pub async fn get_with_vehicle(&self, id_driver: &IdEventDriver) -> MarketResult<DriverWithVehicle> {
        let result: Driver = self.db.send(EventDriverGet { id: id_driver.to_owned() }).await??.into();
        if let Some(id) = result.id_vehicle {
            Ok(DriverWithVehicle {
                id: result.id,
                id_event: result.id_event,
                phone: result.phone,
                id_vehicle: id,
                obsolete_at: result.obsolete_at,
            })
        } else {
            Err(ErrorMarket::NoDest)
        }
    }

    #[doc = "Get a driver from the event id and their phone number"]
    pub async fn find(&self, id_event: &Uuid, phone: &Phone) -> MarketResult<Driver> {
        let result = self.db.send(EventDriverFind { id_event: *id_event, phone: phone.to_owned() }).await??.into();
        Ok(result)
    }

    #[doc = "Tells the server where the driver is and gets the strategy"]
    pub async fn ping(&self, id_event: &Uuid, id_driver: &IdEventDriver, location: &LatLng) -> MarketResult<DriverStrategyEstimations> {
        if !self.event.is_driver_online(&id_driver).await? {
            let driver = self.get_with_vehicle(&id_driver).await?;
            self.event.add_driver(&id_event, &driver).await?;
        }
        self.event.update_driver_location(id_event, id_driver, location).await?;
        self.get_driver(id_event, id_driver).await
    }

    #[doc = "Accepts a reservation"]
    pub async fn accept(&self, id_driver: &IdEventDriver, id_reservation: &Uuid) -> MarketResult<DriverStrategyEstimations> {
        let reservation = self.db.send(ReservationGet { id: id_reservation.to_owned() }).await??;
        if reservation.id_driver.is_some() { return Err(ErrorMarket::HasDriver); }

        let reservation: Reservation = self.db.send(ReservationAssignDriver { id: id_reservation.to_owned(), id_driver: id_driver.to_owned() }).await??.into();
        self.messanger.send_reservation_update(reservation.clone()).await?;
        let pusher = self.push.get(&reservation);
        match self.db.send(UserGet { phone: reservation.reserver.clone() }).await {
            Ok(Ok(user)) => {
                if let Err(err) = pusher.send_driver_accepted(&reservation, &user.into()).await {
                    warn!("Could not send text, got error: {}", err)
                }
            },
            _ => warn!("Could not find user")
        }

        let id_event = reservation.id_event;
        
        let driver_strategy = self.event.update_driver_strategy(&id_event, id_driver, Box::new(move |driver: DriverStrategy| {
            if let Some(_) = driver.dest { return Err(ErrorMarket::HasDest) }
            let driver_new = driver.add_reservation(reservation);
            Ok(driver_new)
        })).await?;

        Ok(driver_strategy)
    }

    #[doc = "Confirm the arrival of the driver to their destination"]
    pub async fn arrive(&self, id_event: &Uuid, id_driver: &IdEventDriver) -> MarketResult<DriverStrategyEstimations> {
        let driver = self.get_driver(id_event, id_driver).await?;
        match &driver.dest {
            Some(DriverStopEstimation::Reservation(stop)) => {
                let reservation = self.db.send(ReservationConfirmArrival { id: stop.id_reservation }).await??.into();
                let pusher = self.push.get(&reservation);
                match self.db.send(UserGet { phone: reservation.reserver.clone() }).await {
                    Ok(Ok(user)) => {
                        if let Err(err) = pusher.send_driver_arrival(&reservation, &user.into()).await {
                            warn!("Could not send text, got error: {}", err)
                        }
                    },
                    _ => warn!("Could not find user")
                }

                self.messanger.send_reservation_update(reservation).await?;
                Ok(driver)
            },
            Some(DriverStopEstimation::Event(_)) => {
                let driver = self.get_driver(&id_event, &id_driver).await?;
                let ids = driver.queue.get_pickup_reservations_from_event();
                for id in ids {
                    let reservation = self.db.send(ReservationConfirmArrival { id }).await??.into();
                    let pusher = self.push.get(&reservation);
                    match self.db.send(UserGet { phone: reservation.reserver.clone() }).await {
                        Ok(Ok(user)) => {
                            if let Err(err) = pusher.send_driver_arrival(&reservation, &user.into()).await {
                                warn!("Could not send text, got error: {}", err)
                            }
                        },
                        _ => warn!("Could not find user")
                    }
                    self.messanger.send_reservation_update(reservation).await?;
                }
                Ok(driver)
            },
            None => Err(ErrorMarket::NoDest),
        }
    }


    #[doc = "Get a driver for an event"]
    async fn get_driver(&self, id_event: &Uuid, id_driver: &IdEventDriver) -> MarketResult<DriverStrategyEstimations> {
        self.event.get_estimates(id_event).await?.driver(id_driver)
    }

    #[doc = "Confirm that a driver has picked up their passengers"]
    pub async fn pickup(&self, id_event: &Uuid, id_driver: &IdEventDriver) -> MarketResult<DriverStrategyEstimations> {
        let driver = self.get_driver(&id_event, id_driver).await?;
        let id_reservations = driver.get_pickup_reservations()?;
        let driver_strategy = self.event.update_driver_strategy(&id_event, id_driver, Box::new(move |driver: DriverStrategy| { driver.pickup() })).await?;
        for id in id_reservations {
            let reservation = self.db.send(ReservationConfirmPickup { id }).await??.into();
            self.messanger.send_reservation_update(reservation).await?;
        }
        Ok(driver_strategy)
    }

    #[doc = "Confirm that a driver has dropped off their passengers"]
    pub async fn dropoff(&self, id_event: &Uuid, id_driver: &IdEventDriver) -> MarketResult<DriverStrategyEstimations> {
        let driver = self.get_driver(&id_event, id_driver).await?;
        let id_reservations = driver.get_dropoff_reservations();
        let driver_strategy = self.event.update_driver_strategy(&id_event, id_driver, Box::new(move |driver: DriverStrategy| { driver.dropoff() })).await?;
        for id in id_reservations {
            let reservation = self.db.send(ReservationConfirmDropoff { id }).await??.into();
            self.messanger.send_reservation_update(reservation).await?;
        }
        Ok(driver_strategy)
    }
}
