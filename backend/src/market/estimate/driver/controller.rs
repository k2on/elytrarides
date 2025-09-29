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
        let mut ids: Vec<Uuid> = self.picked_up.keys().cloned().collect();
        match &self.dest {
            Some(DriverStopEstimation::Reservation(dest)) => ids.push(dest.id_reservation),
            Some(DriverStopEstimation::Event(_)) => ids.append(&mut self.queue.get_pickup_reservations_from_event()),
            None => ()
        }
        ids
    }

    #[doc = "Get the duration of the driver"]
    pub fn duration(&self) -> Duration {
        match (&self.dest, self.queue.last()) {
            (_, Some(last)) => last.arrival(),
            (Some(dest), None) => dest.arrival(),
            (None, None) => Duration::seconds(0),
        }
    }

    #[doc = "Return a reservation estimate for a reservation"]
    pub fn estimate_reservation(&self, reservation: &Reservation) -> MarketResult<ReservationEstimate> {
        let est = if reservation.is_dropoff {
            let pickup = self.to_event_pickup(&reservation.id)?;
            let arrival = self.to_last_stop(&reservation.id);
            let queue_position = self.queue_position_dropoff(&reservation.id);

            ReservationEstimate {
                queue_position,
                time_estimate: TimeEstimate {
                    pickup,
                    arrival,
                }
            }
        } else {
            let pickup = self.to_stop(&reservation.id);
            let arrival = self.get_event_for_pickup_reservation(&reservation.id).arrival;
            let queue_position = self.queue_position_pickup(&reservation.id);

            ReservationEstimate {
                queue_position,
                time_estimate: TimeEstimate {
                    pickup,
                    arrival,
                }
            }
        };
        Ok(est)
    }

    #[doc = "Returns whether the current destination is a reservation with id"]
    fn is_dest_res(&self, id_reservation: &Uuid) -> bool {
        matches!(&self.dest, Some(DriverStopEstimation::Reservation(res)) if res.id_reservation.eq(id_reservation))
    }

    #[doc = "Get the time till the driver arrives at an event for a dropoff reservation"]
    fn to_event_pickup(&self, id_reservation: &Uuid) -> MarketResult<Duration> {
        if self.is_dest_res(id_reservation) { return Ok(Duration::seconds(0)) }
        let reservation_stop_idx = self.queue.idx_of_reservation(id_reservation);
        let stop_before_reservation = reservation_stop_idx.and_then(|idx| self.queue.get_stop_before(idx));
        match (reservation_stop_idx, &self.dest, stop_before_reservation) {
            (Some(0), Some(DriverStopEstimation::Event(event)), _) => Ok(event.arrival),
            (Some(0), _, _) => unreachable!("Reservation has queue idx 0, but dest is not event"),
            (_, _, Some(DriverStopEstimation::Event(event))) => Ok(event.arrival),
            (_, Some(DriverStopEstimation::Event(event)), _) => Ok(event.arrival),
            _ => Err(ErrorMarket::ReservationNotInStrategy)
        }
    }

    #[doc = "Get the event stop for a pickup reservation"]
    fn get_event_for_pickup_reservation(&self, id_reservation: &Uuid) -> DriverStopEstimationEvent {
        let is_picked_up = self.is_picked_up(id_reservation);
        match (is_picked_up, &self.dest) {
                (true, Some(DriverStopEstimation::Event(event))) => event.clone(),
                (true, _) => self.queue.next_event().expect("Event not found"),
                (false, Some(DriverStopEstimation::Reservation(res))) if res.id_reservation.eq(id_reservation) => self.queue.next_event().expect("Event not found"),
                (false, _) => self.queue.get_next_event_after_reservation(id_reservation).expect("Event not found"),
            }
    }

    #[doc = "Get the time till the driver arrives at the stop for a pickup reservation"]
    fn to_stop(&self, id_reservation: &Uuid) -> Duration {
        let stop_reservation = self.queue.get_reservation(id_reservation);
        match (&self.picked_up.contains_key(id_reservation), &self.dest, stop_reservation) {
            (true, _, _) => Duration::seconds(0),
            (_, Some(DriverStopEstimation::Reservation(res)), _) if res.id_reservation.eq(&id_reservation) => res.pickup,
            (_, _, Some(stop)) => stop.pickup,
            _ => panic!("Reservation not in queue")
        }
    }

    #[doc = "Get thet time till the driver arrives at the last stop for a dropoff reservation"]
    fn to_last_stop(&self, id_reservation: &Uuid) -> Duration {
        let mut reservation_stops = Vec::new();
        match &self.dest {
            Some(DriverStopEstimation::Reservation(res)) if res.id_reservation.eq(&id_reservation) => { reservation_stops.push(res.clone()) },
            _ => ()
        };
        self.queue.iter().for_each(|stop| match stop {
            DriverStopEstimation::Reservation(res) if res.id_reservation.eq(&id_reservation) => { reservation_stops.push(res.clone()); },
            _ => ()
        });
        let last = reservation_stops.last().expect("Reservation not found in queue or dest");
        last.pickup
    }

    #[doc = "Return how many reservations are in front of the pickup reservation"]
    fn queue_position_pickup(&self, id_reservation: &Uuid) -> i32 {
        if self.is_picked_up(id_reservation) { return 0 }
        let mut reservations: HashSet<Uuid> = self.picked_up.keys().cloned().collect();
        match &self.dest {
            Some(DriverStopEstimation::Reservation(res)) if res.id_reservation.eq(&id_reservation) => return 0,
            Some(DriverStopEstimation::Reservation(res)) => { reservations.insert(res.id_reservation); },
            _ => ()
        }

        for stop in self.queue.iter() {
            match stop {
                DriverStopEstimation::Reservation(res) if res.id_reservation.eq(&id_reservation) => return reservations.len() as i32,
                DriverStopEstimation::Reservation(res) => { reservations.insert(res.id_reservation); },
                _ => ()
            }
        }
        panic!("Reservation not found in queue of dest")
    }

    #[doc = "Return how many reservations are in front of the dropoff reservation"]
    fn queue_position_dropoff(&self, id_reservation: &Uuid) -> i32 {
        self.queue_position_pickup(id_reservation)
    }

    #[doc = "Get the reservations that are getting picked up"]
    pub fn get_pickup_reservations(&self) -> MarketResult<Vec<Uuid>> {
        match &self.dest {
            None => Err(ErrorMarket::NoDest),
            Some(DriverStopEstimation::Reservation(res)) => Ok(vec![res.id_reservation]),
            Some(DriverStopEstimation::Event(_)) => Ok(self.queue.get_pickup_reservations_from_event()),
            // Some(DriverStopEstimation::Event(_)) => Ok(Vec::new())
        }
    }

    #[doc = "Get the reservations that are getting dropped off"]
    pub fn get_dropoff_reservations(&self) -> Vec<Uuid> {
        self.picked_up.keys().cloned().collect()
    }

    #[doc = "Return whether or not the driver has reservations picked up, or in their queue or dest"]
    pub fn is_empty(&self) -> bool {
        self.picked_up.is_empty() && self.dest.is_none() && self.queue.is_empty()
    }
}



