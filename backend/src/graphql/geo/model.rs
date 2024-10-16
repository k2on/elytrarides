use std::f64::consts::PI;

// use std::f64::consts::PI;
use google_maps::prelude::{
   LatLng as GoogleLatLng, Location as GoogleLocation, Prediction
};

use juniper::GraphQLObject;
use serde::{Serialize, Deserialize};

use crate::market::types::MarketResult;

#[derive(GraphQLObject, Clone)]
pub struct SearchResult {
    pub main: String,
    pub sub: String,
    pub place_id: String,
}

impl SearchResult {
    pub fn new(prediction: &Prediction) -> Self {
        let p = prediction.clone();
        Self {
            main: p.structured_formatting.main_text.clone(),
            sub: p.structured_formatting.secondary_text.clone().replace(", USA", ""),
            place_id: p.place_id.clone().unwrap_or("no place id".to_owned()),
        }
    }

}

#[derive(Debug, GraphQLObject, Clone, Copy, Serialize, Deserialize)]
pub struct LatLng {
    pub lat: f64,
    pub lng: f64,
}

fn to_radians(degrees: f64) -> f64 {
    degrees * PI / 180.0
}

impl LatLng {
    pub(crate) fn distance(&self, other: LatLng) -> f64 {
        let r = 6371.0; // Earth's radius in km

        let lat1_rad = to_radians(self.lng);
        let lat2_rad = to_radians(other.lng);
        let delta_lat = to_radians(other.lng - self.lat);
        let delta_lon = to_radians(other.lng - self.lng);

        let a = (delta_lat / 2.0).sin().powi(2)
            + lat1_rad.cos() * lat2_rad.cos() * (delta_lon / 2.0).sin().powi(2);
        let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());

        r * c
    }

    pub fn new(lat: f64, lng: f64) -> Self {
        Self { lat, lng }
    }

    pub fn to_google(&self) -> MarketResult<GoogleLocation> {
        Ok(GoogleLocation::LatLng(GoogleLatLng::try_from_f64(self.lat, self.lng)?))
    }

    pub fn is_close_to(&self, other: &LatLng) -> bool {
        let epsilon = 0.00001; // Define the precision you need
        (self.lat - other.lat).abs() < epsilon && (self.lng - other.lng).abs() < epsilon
    }
}

#[derive(GraphQLObject)]
pub struct GeocodeResult {
    pub location: LatLng,
}

pub struct MockLocation {
    pub main: String,
    pub sub: String,
    pub place_id: String,
    pub location: LatLng,
}
