use chrono::Duration;
use google_maps::{prelude::{
    GoogleMapsClient, TravelMode,
}};

use crate::{graphql::{reservations::{FormReservation, stops::model::{FormReservationStop, FormReservationStopLocation}}, geo::model::LatLng}, market::{error::ErrorMarket, types::MarketResult, strategy::driver::stop::reservation::location::model::Address}};


use async_trait::async_trait;

use super::Geocoder;

#[derive(Debug, Clone)]
pub struct GeocoderGoogle {
    maps: GoogleMapsClient
}

#[async_trait]
impl Geocoder for GeocoderGoogle {
    fn box_clone(&self) -> Box<dyn Geocoder> {
        Box::new(self.clone())
    }

    async fn geocode_location(&self, location: &FormReservationStopLocation) -> Address {
        match &location.place_id {
            Some(id) => match self.geocode_place(&id).await {
                Ok(address) => address,
                Err(_) => Address {
                    main: location.address.clone(),
                    sub: String::from("")
                }
            }
            None => Address {
                main: location.address.clone(),
                sub: String::from("")
            }
        }
    }

    async fn estimate(&self, from: LatLng, to: LatLng) -> MarketResult<Duration> {
        let origin = from.to_google()?;
        let destination = to.to_google()?;

        let response = self
            .maps
            .directions(origin, destination)
            .with_travel_mode(TravelMode::Driving)
            .execute()
            .await?;

        if let Some(route) = response.routes.first() {
            if let Some(leg) = route.legs.first() {
                Ok(leg.duration.value)
            } else {
                Err(ErrorMarket::NoRouteLegs)
            }
        } else {
            Err(ErrorMarket::NoRoutes)
        }
    }
}

fn get_nth(adr: String, n: usize) -> Option<String> {
    let mut parts = adr.split(", ");
    let part = parts.nth(n);
    Some(part?.split_once('>')?.1.split_once('<')?.0.to_owned())
}

impl GeocoderGoogle {
    pub fn new(maps: GoogleMapsClient) -> Self {
        Self { maps }
    }

    async fn geocode_place(&self, place_id: &str) -> MarketResult<Address> {
        match self
            .maps
            .place_details(place_id.to_owned())
            .execute()
            .await
        {
            Ok(response) => {
                let place = response.result;
                if let Some(adr) = place.adr_address {
                    // let main = get_nth(adr.to_owned(), 0);
                    let county = get_nth(adr.to_owned(), 1);
                    let state = get_nth(adr.to_owned(), 2);
                    match (place.name, county, state) {
                        (Some(name), Some(county), Some(state)) => Ok(Address::new(name, format!("{county}, {state}"))),
                        _ => Ok(Address::new("Pickup Location".to_owned(), String::from("")))
                    }
                } else {
                    Ok(Address::new("Pickup Location".to_owned(), String::from("")))
                }
            }
            Err(err) => {
                println!("{}", err);
                Err(ErrorMarket::GeocodingFailed)
            }
        }
    }
}

