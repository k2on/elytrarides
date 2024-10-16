use serde::{Serialize, Deserialize};
use uuid::Uuid;

use super::location::model::DriverStopLocation;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DriverStopReservation {
    pub location: DriverStopLocation,
    pub id_reservation: Uuid,
    pub is_dropoff: bool,
    pub order: i32,
    pub passengers: i32,
}

