use std::time::{SystemTime, UNIX_EPOCH};

use super::estimate::driver::stop::model::DriverStopEstimation;


pub fn now() -> i32 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        .try_into()
        .unwrap() // TODO: convert this, you need to write a resolver for i64, f64, etc
}

#[doc = "Add the reservation arrival times to a driver queue"]
pub fn add_reservation_arrivals_to_queue(queue: Vec<DriverStopEstimation>) -> Vec<DriverStopEstimation> {
    queue
}

