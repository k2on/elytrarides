use crate::market::strategy::driver::stop::{reservation::model::DriverStopReservation, model::DriverStop};

use super::{model::DriverStopEstimation, event::model::DriverStopEstimationEvent, reservation::model::DriverStopEstimationReservation};

impl DriverStopEstimation {
    pub fn new(stop: DriverStop, eta: i32) -> Self {
        Self {
            stop,
            eta
        }
    }

    pub fn strip_estimate(&self) -> DriverStop {
        self.stop.clone()
    }
}


