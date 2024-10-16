use crate::graphql::reservations::stops::model::FormLatLng;

use super::model::College;

impl College {
    pub fn latlng_form(&self) -> FormLatLng {
        FormLatLng {
            lat: self.location_lat,
            lng: self.location_lng,
        }
    }
}
