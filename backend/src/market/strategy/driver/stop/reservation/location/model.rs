use juniper::GraphQLObject;
use serde::{Serialize, Deserialize};

use crate::graphql::geo::model::LatLng;

#[derive(Debug, Serialize, Deserialize, Clone, GraphQLObject)]
pub struct DriverStopLocation {
    pub coords: LatLng,
    pub address: Address,
    pub place_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, GraphQLObject, PartialEq)]
pub struct Address {
    pub main: String,
    pub sub: String,
}

impl Address {
    pub fn new(main: String, sub: String) -> Self {
        Self {
            main,
            sub
        }
    }
}



