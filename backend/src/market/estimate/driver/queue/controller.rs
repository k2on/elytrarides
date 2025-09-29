use std::slice::Iter;

use uuid::Uuid;

use crate::market::{strategy::driver::stop::model::DriverStop, estimate::driver::stop::{model::DriverStopEstimation, event::model::DriverStopEstimationEvent, reservation::model::DriverStopEstimationReservation}};

use super::model::Queue;

impl Queue {
    pub fn new() -> Self {
        Self(Vec::new())
    }

    pub fn strip_estimates(&self) -> Vec<DriverStop> {
        self.0.clone().iter().map(|stop| stop.strip_estimate()).collect()
    }

    pub fn iter(&self) -> Iter<DriverStopEstimation> {
        self.0.iter()
    }

    #[doc = "Get the index of a reservation. If not found, it will be None"]
    pub fn idx_of_reservation(&self, id_reservation: &Uuid) -> Option<usize> {
        self.iter().enumerate()
            .find_map(|(idx, stop)| match stop {
                DriverStopEstimation::Reservation(res) if res.id_reservation.eq(id_reservation) => Some(idx),
                _ => None
            })
    }

    #[doc = "Get the stop before n, if n = 0, it will return None"]
    pub fn get_stop_before(&self, n: usize) -> Option<DriverStopEstimation> {
        if n == 0 { return None }
        self.0.get(n - 1).cloned()
    }

    #[doc = "Get the next event stop after queue position n"]
    fn next_event_after(&self, n: usize) -> Option<DriverStopEstimationEvent> {
        self.iter().enumerate()
            .find_map(|(idx, stop)| match stop {
                DriverStopEstimation::Event(event) if idx >= n => Some(event.clone()),
                _ => None
            })
    }

    #[doc = "Get the next event after a reservation with an id"]
    pub fn get_next_event_after_reservation(&self, id_reservation: &Uuid) -> Option<DriverStopEstimationEvent> {
        let idx = self.idx_of_reservation(id_reservation).expect("Reservation not found in queue");
        self.next_event_after(idx)
    }

    #[doc = "Get the next event from position 0"]
    pub fn next_event(&self) -> Option<DriverStopEstimationEvent> {
        self.next_event_after(0)
    }

    #[doc = "Get a reservation stop"]
    pub fn get_reservation(&self, id_reservation: &Uuid) -> Option<DriverStopEstimationReservation> {
        self.iter().find_map(|stop| match stop {
            DriverStopEstimation::Reservation(res) if res.id_reservation.eq(&id_reservation) => Some(res.clone()),
            _ => None
        })
    }


    #[doc = "Get the last stop in the queue"]
    pub fn last(&self) -> Option<DriverStopEstimation> {
        self.iter().last().cloned()
    }

    #[doc = "Get the first stop in the queue"]
    pub fn first(&self) -> Option<DriverStopEstimation> {
        self.0.first().cloned()
    }

    #[doc = "Get the nth stop in the queue"]
    pub fn get(&self, n: usize) -> Option<DriverStopEstimation> {
        self.0.get(n).cloned()
    }

    #[doc = "Get the length of the queue"]
    pub fn len(&self) -> usize {
        self.0.len()
    }

    #[doc = "Is empty"]
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    #[doc = "Get the reservations to get picked up from an event"]
    pub fn get_pickup_reservations_from_event(&self) -> Vec<Uuid> {
        let mut reservations = Vec::new();
        for stop in self.iter() {
            match stop {
                DriverStopEstimation::Reservation(res) if res.is_dropoff => reservations.push(res.id_reservation),
                DriverStopEstimation::Event(_) => break,
                _ => (),
            }
        }
        reservations
    }
}
