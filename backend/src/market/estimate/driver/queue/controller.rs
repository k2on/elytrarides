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

    #[doc = "Get the stop before n, if n = 0, it will return None"]
    pub fn get_stop_before(&self, n: usize) -> Option<DriverStopEstimation> {
        if n == 0 { return None }
        self.0.get(n - 1).cloned()
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

}
