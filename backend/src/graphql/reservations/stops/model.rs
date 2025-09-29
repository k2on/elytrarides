use std::io::Write;

use diesel::{
    deserialize::{FromSql, FromSqlRow},
    expression::AsExpression,
    pg::Pg,
    serialize::{IsNull, ToSql},
    sql_types::Text,
};
use juniper::{GraphQLInputObject, GraphQLObject};
use serde::{Deserialize, Serialize};

use crate::{graphql::{geo::model::LatLng, reservations::FormReservationStopGeocoded}, market::strategy::driver::stop::reservation::location::model::Address};

#[derive(Debug, Serialize, Deserialize, FromSqlRow, AsExpression, Clone)]
#[diesel(sql_type = Text)]
pub struct ReservationStops(pub Vec<ReservationStop>);

impl ReservationStops {
    pub fn new(stops: Vec<FormReservationStopGeocoded>) -> Self {
        let stops = 
            stops.iter()
                .map(|s| ReservationStop::new(s.clone()))
                .collect::<Vec<ReservationStop>>();
        Self(stops)
    }

    pub fn get_stops(&self) -> &Vec<ReservationStop> {
        &self.0
    }

    pub fn get_stops_mut(&mut self) -> &Vec<ReservationStop> {
        &self.0
    }
}

impl ToSql<Text, Pg> for ReservationStops {
    fn to_sql<'b>(
        &'b self,
        out: &mut diesel::serialize::Output<'b, '_, Pg>,
    ) -> diesel::serialize::Result {
        let s = serde_json::to_string(&self.0).unwrap();
        out.write_all(s.as_bytes())?;
        Ok(IsNull::No)
    }
}

impl FromSql<Text, Pg> for ReservationStops {
    fn from_sql(bytes: diesel::backend::RawValue<'_, Pg>) -> diesel::deserialize::Result<Self> {
        let s = std::str::from_utf8(bytes.as_bytes()).unwrap();
        let v = serde_json::from_str(s).unwrap();
        Ok(ReservationStops(v))
    }
}

#[derive(Debug, Serialize, Clone, Deserialize, PartialEq, GraphQLObject)]
pub struct ReservationStop {
    pub is_complete: bool,
    pub complete_at: Option<i32>,
    pub location_lat: f64,
    pub location_lng: f64,
    pub address: Address,
    pub place_id: String,
}

impl ReservationStop {
    pub fn new(stop: FormReservationStopGeocoded) -> Self {
        Self {
            is_complete: false,
            complete_at: None,
            location_lat: stop.location.lat,
            location_lng: stop.location.lng,
            address: stop.address,
            place_id: stop.place_id,
        }
    }

    pub fn latlng(&self) -> LatLng {
        LatLng {
            lat: self.location_lat,
            lng: self.location_lng,
        }
    }
}

#[derive(Debug, GraphQLInputObject, Clone)]
pub struct FormReservationStop {
    pub location: FormLatLng,
    pub place_id: String,
    pub address: String,
}


// We need a FormLatLng because IG you can't have a GraphQLObject and GraphQLInputObject on the
// same struct
#[derive(Debug, GraphQLInputObject, Clone)]
pub struct FormLatLng {
    pub lat: f64,
    pub lng: f64,
}


impl From<FormLatLng> for LatLng {
    fn from(latlng: FormLatLng) -> Self {
        latlng.latlng()
    }
}


impl FormLatLng {
    pub fn new(lat: f64, lng: f64) -> FormLatLng {
        Self {
            lat,
            lng
        }
    }

    pub fn latlng(&self) -> LatLng {
        LatLng {
            lat: self.lat,
            lng: self.lng,
        }
    }

}

impl FormReservationStop {
    pub fn latlng(&self) -> LatLng {
        LatLng {
            lat: self.location.lat,
            lng: self.location.lng,
        }
    }
}

