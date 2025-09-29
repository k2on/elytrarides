use chrono::Duration;

use async_trait::async_trait;

use crate::graphql::{reservations::{FormReservation, FormReservationGeocoded}, geo::model::LatLng};

use super::types::MarketResult;
pub mod google;
pub mod mock;
pub mod mock_location;



#[async_trait]
pub trait Geocoder: Send + Sync + std::fmt::Debug {
    fn box_clone(&self) -> Box<dyn Geocoder>;

    async fn geocode_form(&self, form: &FormReservation) -> MarketResult<FormReservationGeocoded>;

    async fn estimate(&self, from: LatLng, to: LatLng) -> MarketResult<Duration>;
}

