use crate::market::strategy::driver::stop::util::normalize_stops;

use super::{model::DriverStop, event::model::DriverStopEvent};

impl DriverStop {
    pub fn new_event() -> Self {
        DriverStop::Event(DriverStopEvent::new())
    }

    pub fn key_with(&self, to_stop: &DriverStop) -> String {
        let (from, to) = normalize_stops(self.clone(), to_stop.clone());
        format!("{}-{}", from.key(), to.key())
    }

    pub fn key(&self) -> String {
        match self {
            DriverStop::Reservation(stop) => format!("{}:{}", stop.id_reservation, stop.order),
            DriverStop::Event(_) => String::from("E"),
        }
    }
}


