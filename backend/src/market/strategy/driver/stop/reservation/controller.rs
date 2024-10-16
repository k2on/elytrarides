use crate::graphql::geo::model::LatLng;

use super::model::DriverStopReservation;

impl DriverStopReservation{
    pub fn latlng(&self) -> LatLng {
        LatLng {
            lat: self.location.coords.lat,
            lng: self.location.coords.lng,
        }
    }
}

