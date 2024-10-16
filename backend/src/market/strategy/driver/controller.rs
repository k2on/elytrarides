use std::collections::HashMap;

use uuid::Uuid;

use crate::{market::{strategy::model::IdEventDriver, types::MarketResult, error::ErrorMarket}, graphql::reservations::Reservation};

use super::{model::DriverStrategy, stop::{event::model::DriverStopEvent, model::DriverStop, reservation::{location::model::DriverStopLocation, model::DriverStopReservation}}};

impl DriverStrategy {
    pub fn new(id: IdEventDriver, id_event: &Uuid, max_capacity: i32) -> Self {
        Self {
            id,
            id_event: *id_event,
            dest: None,
            queue: Vec::new(),
            picked_up: HashMap::new(),
            max_capacity,
        }
    }

    fn passengers(&self) -> i32 {
        self.picked_up.values().sum()
    }

    pub fn can_fit(&self, passengers: i32) -> bool {
        self.passengers() + passengers <= self.max_capacity
    }

    #[doc = "Add a reservation to the strategy."]
    pub fn add_reservation(&self, reservation: Reservation) -> DriverStrategy {
        let mut new_driver = self.clone();
        let mut stops = reservation.stops;
        if let None = new_driver.dest {
            let new_dest = stops.remove(0).to_driver_stop(reservation.passenger_count);
            new_driver.dest = Some(new_dest);
        }
        let driver_stops: Vec<DriverStop> = stops.iter().map(|stop| stop.to_driver_stop(reservation.passenger_count)).collect();
        new_driver.queue.append(&mut driver_stops.clone());

        new_driver
    }

    #[doc = "Completes the current destination"]
    pub fn next(&self) -> MarketResult<Self> { // TODO: make this idempotent
        println!("{:#?}", self);
        match (&self.dest, self.queue.first()) {
            (None, _) => Err(ErrorMarket::NoDest),
            (Some(dest), Some(_next)) => {
                let mut new_strategy = self.clone();
                if !new_strategy.picked_up.contains_key(&dest.id_reservation) {
                    new_strategy.picked_up.insert(dest.id_reservation, dest.passengers);
                }
                let new_dest = new_strategy.queue.remove(0);
                new_strategy.dest = Some(new_dest);
                Ok(new_strategy)
            },
            (Some(dest), None) => {
                let mut new_strategy = self.clone();
                new_strategy.reset_picked_up();
                new_strategy.dest = None;
                Ok(new_strategy)
            }
            _ => unreachable!("Invalid state")
        }
    }

    #[doc = "Reset the picked up reservations"]
    fn reset_picked_up(&mut self) {
        self.picked_up = HashMap::new()
    }
}
