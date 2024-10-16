
use chrono::Duration;
use serde::{Serialize, Deserialize};
use uuid::Uuid;

use crate::market::strategy::driver::stop::reservation::location::model::DriverStopLocation;

#[serde_with::serde_as]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DriverStopEstimationReservation {
    pub location: DriverStopLocation,
    pub id_reservation: Uuid,
    pub is_dropoff: bool,
    pub order: i32,
    #[serde_as(as = "serde_with::DurationSeconds<i64>")]
    pub pickup: Duration,
    #[serde_as(as = "serde_with::DurationSeconds<i64>")]
    pub arrival: Duration,
    pub passengers: i32,
}

