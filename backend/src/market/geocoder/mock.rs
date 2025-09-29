use chrono::Duration;

use crate::{graphql::{reservations::{FormReservation, FormReservationGeocoded, stops::model::FormReservationStop, FormReservationStopGeocoded}, geo::model::LatLng}, market::types::MarketResult};

use super::{Geocoder, mock_location};
use async_trait::async_trait;


#[derive(Debug, Clone)]
pub struct GeocoderMock;

impl GeocoderMock {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl Geocoder for GeocoderMock {
    fn box_clone(&self) -> Box<dyn Geocoder> {
        Box::new(self.clone())
    }

    async fn geocode_form(&self, form: &FormReservation) -> MarketResult<FormReservationGeocoded> {
        let stops = form.stops.iter()
            .map(|stop| self.geocode_stop(stop.clone()))
            .collect();

        let geocoded = FormReservationGeocoded {
            passenger_count: form.passenger_count,
            is_dropoff: form.is_dropoff,
            stops,
        };
        Ok(geocoded)
    }

    async fn estimate(&self, from: LatLng, to: LatLng) -> MarketResult<Duration> {
        let conditions = vec![
            (mock_location::TIGER_BLVD_LATLNG, mock_location::BENET_HALL_LATLNG, Duration::minutes(10)),
            (mock_location::TIGER_BLVD_LATLNG, mock_location::CSP_LATLNG, Duration::minutes(3)),
            (mock_location::CSP_LATLNG, mock_location::BENET_HALL_LATLNG, Duration::minutes(5)),
            (mock_location::BENET_HALL_LATLNG, mock_location::DOUTHIT_LATLNG, Duration::minutes(5)),
            (mock_location::CSP_LATLNG, mock_location::DOUTHIT_LATLNG, Duration::minutes(4)),
            (mock_location::TIGER_BLVD_LATLNG, mock_location::DOUTHIT_LATLNG, Duration::minutes(8)),
        ];

        for (condition_from, condition_to, duration) in conditions {
            if (from.is_close_to(&condition_from) && to.is_close_to(&condition_to)) || (from.is_close_to(&condition_to) && to.is_close_to(&condition_from)) {
                return Ok(duration);
            }
        }

        let from_name = self.get_location_name(&from).unwrap_or(format!("<Unknown location: ({from:?})>"));
        let to_name = self.get_location_name(&to).unwrap_or(format!("<Unknown location: ({to:?})>"));

        panic!("Invalid locations: '{from_name}' -> '{to_name}'")
    }
}

impl GeocoderMock {
    fn geocode_stop(&self, stop: FormReservationStop) -> FormReservationStopGeocoded {
        let id = stop.place_id;
        let location = mock_location::ALL_LOCATIONS.iter()
            .find(|location| location.id.eq(&id))
            .expect("{id} is not a valid mock place id");
        location.geocoded()
    }

    fn get_location_name(&self, latlng: &LatLng) -> Option<String> {
        let name = mock_location::ALL_LOCATIONS.iter()
            .find_map(|location| if location.latlng().latlng().is_close_to(latlng) { Some(location.address.to_owned()) } else { None });
        name
    }

}

