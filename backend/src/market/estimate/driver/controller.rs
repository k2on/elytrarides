use std::collections::HashSet;

use chrono::Duration;
use uuid::Uuid;

use crate::{market::{strategy::driver::model::DriverStrategy, types::{ReservationEstimate, TimeEstimate, MarketResult}, error::ErrorMarket}, graphql::reservations::Reservation};

use super::{model::DriverStrategyEstimations, stop::{model::DriverStopEstimation, event::model::DriverStopEstimationEvent}, queue::model::Queue};

impl DriverStrategyEstimations {
    pub fn new(driver_strategy: DriverStrategy, dest: Option<DriverStopEstimation>, queue: Vec<DriverStopEstimation>) -> Self {
        Self {
            id: driver_strategy.id,
            id_event: driver_strategy.id_event,
            dest,
            queue: Queue(queue),
            picked_up: driver_strategy.picked_up,
            max_capacity: driver_strategy.max_capacity,
        }
    }

    pub fn from_driver_strategy(driver_strategy: DriverStrategy) -> Self {
        Self {
            id: driver_strategy.id,
            id_event: driver_strategy.id_event,
            dest: None,
            queue: Queue::new(),
            picked_up: driver_strategy.picked_up,
            max_capacity: driver_strategy.max_capacity,
        }
    }

    pub fn strip_estimates(&self) -> DriverStrategy {
        DriverStrategy {
            id: self.id,
            id_event: self.id_event,
            dest: self.dest.clone().map(|dest| dest.strip_estimate()),
            queue: self.queue.strip_estimates(),
            picked_up: self.picked_up.clone(),
            max_capacity: self.max_capacity,
        }

    }

    #[doc = "If a reservation id is picked up by the driver"]
    pub fn is_picked_up(&self, id_reservation: &Uuid) -> bool {
        self.picked_up.contains_key(id_reservation)
    }

    #[doc = "Get all the reservations that the driver is sharing locations with"]
    pub fn get_sharing_location_with(&self) -> Vec<Uuid> {
        let mut ids: HashSet<Uuid> = self.picked_up.keys().cloned().collect();
        if let Some(dest) = &self.dest {
            ids.insert(dest.stop.id_reservation);
        }
        ids.extend(self.queue.iter().map(|stop| stop.stop.id_reservation));
        ids.into_iter().collect()
    }

    #[doc = "Get the duration of the driver in seconds"]
    pub fn duration(&self) -> i32 {
        match (&self.dest, self.queue.last()) {
            (_, Some(last)) => last.eta,
            (Some(dest), None) => dest.eta,
            (None, None) => 0,
        }
    }

    #[doc = "Return a reservation estimate for a reservation"]
    pub fn estimate_reservation(&self, reservation: &Reservation) -> MarketResult<ReservationEstimate> {
        let queue_position = self.get_reservation_queue_position(&reservation.id);
        let stop_etas = self.get_reservation_stop_etas(&reservation);

        let est = ReservationEstimate {
            stop_etas,
            queue_position,
        };
        Ok(est)
    }

    #[doc = "Get the queue position for a reservation"]
    fn get_reservation_queue_position(&self, id_reservation: &Uuid) -> i32 {
        if self.is_picked_up(id_reservation) { return 0 }
        match &self.dest {
            Some(dest) if dest.stop.id_reservation.eq(&id_reservation) => return 0,
            _ => ()
        }
        let mut reservation_ids: HashSet<Uuid> = self.get_picked_up_ids().iter().cloned().collect();
        for stop in self.queue.iter() {
            if stop.stop.id_reservation.eq(&id_reservation) { return reservation_ids.len() as i32 }
            reservation_ids.insert(stop.stop.id_reservation);
        }
        panic!("Reservation not found in queue")
    }

    #[doc = "Get the arrival times of all the stops for a reservation"]
    fn get_reservation_stop_etas(&self, reservation: &Reservation) -> Vec<DriverStopEstimation> {
        reservation.stops
            .iter()
            .map(|stop| {
                let is_stop_in_queue = self.queue.iter().any(|driver_stop| driver_stop.stop.id_stop.eq(&stop.id));
                let eta = match &self.dest {
                    Some(dest) if !is_stop_in_queue && !dest.stop.id_stop.eq(&stop.id) => 0,
                    Some(dest) if dest.stop.id_stop.eq(&stop.id) => dest.eta,
                    _ => self.queue.iter().find_map(|driver_stop| if driver_stop.stop.id_stop.eq(&stop.id) { Some(driver_stop.eta) } else { None }).expect("Stop not found in queue")
                };

                DriverStopEstimation {
                    stop: stop.to_driver_stop(reservation.passenger_count),
                    eta,
                }
            })
            .collect()
    }

    #[doc = "Get the reservations that are getting dropped off"]
    pub fn get_picked_up_ids(&self) -> Vec<Uuid> {
        self.picked_up.keys().cloned().collect()
    }

    #[doc = "Return whether or not the driver has reservations picked up, or in their queue or dest"]
    pub fn is_empty(&self) -> bool {
        self.picked_up.is_empty() && self.dest.is_none() && self.queue.is_empty()
    }

    #[doc = "Return wheather or not the driver has picked up a stop for a reservation"]
    pub fn is_picked_up_stop_for_reservation(&self, id: Uuid) -> bool {
        self.get_picked_up_ids().contains(&id)
    }
}



