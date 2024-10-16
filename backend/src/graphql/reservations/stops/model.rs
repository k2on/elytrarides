use std::io::Write;

use diesel::{
    deserialize::{FromSql, FromSqlRow},
    expression::AsExpression,
    pg::Pg,
    serialize::{IsNull, ToSql},
    sql_types::Text, Queryable, Insertable, AsChangeset
};
use juniper::{GraphQLInputObject, GraphQLObject, GraphQLEnum, GraphQLUnion};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{graphql::geo::model::LatLng, market::{util::now, strategy::driver::stop::{reservation::location::model::Address, model::DriverStop}}, schema::reservation_stops};

#[derive(Debug, Serialize, Deserialize, FromSqlRow, AsExpression, Clone)]
#[diesel(sql_type = Text)]
pub struct ReservationStops(pub Vec<ReservationStop>);

#[derive(Queryable, Debug, Serialize, Insertable, AsChangeset)]
#[diesel(table_name=reservation_stops)]
pub struct DBReservationStop {
    pub id: Uuid,
    pub id_reservation: Uuid,
    pub stop_order: i32,
    pub eta: i32,
    pub created_at: i32,
    pub updated_at: Option<i32>,
    pub complete_at: Option<i32>,
    pub driver_arrived_at: Option<i32>,
    pub is_event_location: bool,
    pub lat: f64,
    pub lng: f64,
    pub lat_address: f64,
    pub lng_address: f64,
    pub address_main: String,
    pub address_sub: String,
    pub place_id: Option<String>,
}

impl From<DBReservationStop> for ReservationStop {
    fn from(db_stop: DBReservationStop) -> Self {
        Self {
            id: db_stop.id,
            id_reservation: db_stop.id_reservation,
            stop_order: db_stop.stop_order,
            eta: db_stop.eta,
            created_at: db_stop.created_at,
            updated_at: db_stop.updated_at,
            complete_at: db_stop.complete_at,
            driver_arrived_at: db_stop.driver_arrived_at,
            is_event_location: db_stop.is_event_location,
            lat: db_stop.lat,
            lng: db_stop.lng,
            lat_address: db_stop.lat_address,
            lng_address: db_stop.lng_address,
            address_main: db_stop.address_main,
            address_sub: db_stop.address_sub,
            place_id: db_stop.place_id,
        }
    }
}


#[derive(Debug, Serialize, Clone, Deserialize, PartialEq, GraphQLObject)]
pub struct ReservationStop {
    pub id: Uuid,
    pub id_reservation: Uuid,
    pub stop_order: i32,
    pub eta: i32,
    pub created_at: i32,
    pub updated_at: Option<i32>,
    pub complete_at: Option<i32>,
    pub driver_arrived_at: Option<i32>,
    pub is_event_location: bool,
    pub lat: f64,
    pub lng: f64,
    pub lat_address: f64,
    pub lng_address: f64,
    pub address_main: String,
    pub address_sub: String,
    pub place_id: Option<String>,
}

impl ReservationStop {
    pub fn new(id_reservation: Uuid, stop: ReservationInputStop) -> Self {
        Self {
            id: stop.id,
            id_reservation,
            stop_order: stop.stop_order,
            eta: 0,
            created_at: now(),
            updated_at: None,
            complete_at: None,
            driver_arrived_at: None,
            is_event_location: stop.is_event_location,
            lat: stop.lat,
            lng: stop.lng,
            lat_address: stop.lat_address,
            lng_address: stop.lng_address,
            address_main: stop.address_main,
            address_sub: stop.address_sub,
            place_id: stop.place_id,
        }
    }

    pub fn latlng(&self) -> LatLng {
        LatLng {
            lat: self.lat,
            lng: self.lng,
        }
    }

    pub fn to_driver_stop(&self, passengers: i32) -> DriverStop {
        DriverStop {
            id_stop: self.id,
            id_reservation: self.id_reservation,
            is_event_location: self.is_event_location,
            lat: self.lat,
            lng: self.lng,
            address_main: self.address_main.clone(),
            address_sub: self.address_sub.clone(),
            passengers,
        }
    }
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

#[derive(Debug, Clone)]
pub struct ReservationInputStop {
    pub id: Uuid,
    pub stop_order: i32,
    pub is_event_location: bool,
    pub lat: f64,
    pub lng: f64,
    pub lat_address: f64,
    pub lng_address: f64,
    pub address_main: String,
    pub address_sub: String,
    pub place_id: Option<String>,
}

#[derive(Debug, GraphQLInputObject, Clone)]
#[doc = "The input type for a stop of a reservation. If location is null, then it is treated as a event location"]
pub struct FormReservationStop {
    pub id: Uuid,
    pub stop_order: i32,
    pub location: Option<FormReservationStopLocation>,
}

#[derive(Debug, GraphQLInputObject, Clone)]
pub struct FormReservationStopLocation {
    pub location: FormLatLng,
    pub place_id: Option<String>,
    pub address: String,
}


pub enum InputReservationStopType {
    Location(InputReservationStopLocation),
    Event,
}

pub struct InputReservationStopLocation {
    pub latlng: LatLng,
}

