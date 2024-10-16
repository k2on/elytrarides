use chrono::Duration;
use serde::{Serialize, Deserialize};

#[serde_with::serde_as]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DriverStopEstimationEvent {
    #[serde_as(as = "serde_with::DurationSeconds<i64>")]
    pub arrival: Duration,
}

