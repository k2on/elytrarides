use crate::{market::{strategy::driver::stop::util::normalize_stops, estimate::driver::stop::model::DriverStopEstimation}, graphql::geo::model::LatLng};

use super::model::DriverStop;

impl DriverStop {
    pub fn latlng(&self) -> LatLng {
        LatLng {
            lat: self.lat,
            lng: self.lng,
        }
    }

    pub fn key_with(&self, to_stop: &DriverStop) -> String {
        let (from, to) = normalize_stops(self.clone(), to_stop.clone());
        format!("{}-{}", from.id_stop, to.id_stop)
    }

    pub fn to_est(&self, eta: i32) -> DriverStopEstimation {
        DriverStopEstimation::new(self.clone(), eta)
    }
}


