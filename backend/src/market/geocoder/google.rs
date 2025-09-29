use chrono::Duration;
use google_maps::{prelude::{
    GoogleMapsClient, TravelMode,
}, PlaceType};

use crate::{graphql::{reservations::{FormReservation, FormReservationGeocoded, stops::model::FormReservationStop, FormReservationStopGeocoded}, geo::model::LatLng}, market::{error::ErrorMarket, types::MarketResult, strategy::driver::stop::reservation::location::model::Address}};


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

    async fn geocode_form(&self, form: &FormReservation) -> MarketResult<FormReservationGeocoded> {
        let tmp: Vec<_> = form.stops
            .iter()
            .map(|stop| async move {
                let address = if stop.place_id != "" {
                    match self.geocode_place(&stop.place_id).await {
                        Ok(address) => address,
                        Err(_err) => Address::new(stop.address.clone(), String::new()),
                    }
                } else {
                    Address::new(stop.address.clone(), String::new())
                };
                Ok((stop.clone(), address.clone()))
            })
            .collect();

        let results: Vec<MarketResult<(FormReservationStop, Address)>> = futures::future::join_all(tmp).await;

        let stops = results.iter().try_fold(Vec::new(), |mut acc, result| {
            match &result {
                Ok((stop, address)) => {
                    let stop_geocoded = FormReservationStopGeocoded {
                        address: address.clone(),
                        location: stop.latlng(),
                        place_id: stop.place_id.clone(),
                    };
                    acc.push(stop_geocoded);
                    Ok(acc)
                }
                Err(e) => Err(e.clone())
            }
        })?;

        let form_geocoded = FormReservationGeocoded {
            stops,
            passenger_count: form.passenger_count,
            is_dropoff: form.is_dropoff,
        };
        Ok(form_geocoded)

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

