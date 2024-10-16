use chrono::Duration;

use async_trait::async_trait;

use crate::graphql::{reservations::stops::model::FormReservationStopLocation, geo::model::LatLng};

use super::{types::MarketResult, strategy::driver::stop::reservation::location::model::Address};
pub mod google;
pub mod mock;
pub mod mock_location;



#[async_trait]
pub trait Geocoder: Send + Sync + std::fmt::Debug {
    fn box_clone(&self) -> Box<dyn Geocoder>;

    async fn geocode_location(&self, stop: &FormReservationStopLocation) -> Address;

    async fn estimate(&self, from: LatLng, to: LatLng) -> MarketResult<Duration>;
}

