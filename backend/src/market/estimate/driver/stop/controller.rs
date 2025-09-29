use chrono::Duration;

use crate::market::strategy::driver::stop::{reservation::model::DriverStopReservation, model::DriverStop};

use super::{model::DriverStopEstimation, event::model::DriverStopEstimationEvent, reservation::model::DriverStopEstimationReservation};

impl DriverStopEstimation {
    pub fn new_event(arrival: Duration) -> Self {
        DriverStopEstimation::Event(DriverStopEstimationEvent {
            arrival
        })
    }

    pub fn new_res(res: DriverStopReservation, pickup: Duration) -> Self {
        DriverStopEstimation::Reservation(DriverStopEstimationReservation {
            location: res.location.clone(),
            id_reservation: res.id_reservation,
            is_dropoff: res.is_dropoff,
            order: res.order,
            pickup,
            arrival: Duration::seconds(0),
            passengers: res.passengers,
        })
    }

    pub fn arrival(&self) -> Duration {
        match self {
            DriverStopEstimation::Reservation(stop) => stop.arrival,
            DriverStopEstimation::Event(stop) => stop.arrival,
        }
    }

    pub fn strip_estimate(&self) -> DriverStop {
        match self {
            DriverStopEstimation::Reservation(res) => DriverStop::Reservation(DriverStopReservation {
                location: res.location.clone(),
                id_reservation: res.id_reservation,
                is_dropoff: res.is_dropoff,
                order: res.order,
                passengers: res.passengers,
            }),
            DriverStopEstimation::Event(_) => DriverStop::new_event(),
        }
    }
}


