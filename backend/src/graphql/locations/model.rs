use diesel::{Queryable, Insertable, AsChangeset};
use juniper::GraphQLInputObject;
use serde::Serialize;
use uuid::Uuid;
use crate::graphql::geo::model::LatLng;
use crate::schema::locations;

#[derive(Debug, Serialize, Queryable)]
pub struct DBLocation {
    pub label: String,
    pub location_lat: f64,
    pub location_lng: f64,
    pub image_url: String,
    pub id: Uuid,
    pub org_id: Uuid,
    pub obsolete_at: Option<i32>,
}

impl DBLocation {
    // pub fn mock(loc: (f64, f64)) -> Self {
    //     let (location_lat, location_lng) = loc;
    //     DBLocation {
    //         id: 0,
    //         org_id: 0,
    //         label: "Mock Location".to_owned(),
    //         location_lat,
    //         location_lng,
    //         image_url: String::new(),
    //     }
    // }
    pub fn latlng(&self) -> LatLng {
        LatLng {
            lat: self.location_lat,
            lng: self.location_lng,
        }
    }
}

#[derive(Debug, Serialize, Insertable, AsChangeset)]
#[diesel(table_name=locations)]
pub struct DBLocationInsertable {
    pub label: Option<String>,
    pub location_lat: Option<f64>,
    pub location_lng: Option<f64>,
    pub image_url: Option<String>,
    pub id: Uuid,
    pub id_org: Uuid,
    pub obsolete_at: Option<i32>,
}


#[derive(Debug, Serialize)]
pub struct OrgLocation {
    pub id: Uuid,
    pub id_org: Uuid,
    pub label: String,
    pub location_lat: f64,
    pub location_lng: f64,
    pub image_url: String,
}


#[derive(Debug, Serialize, Insertable, AsChangeset, GraphQLInputObject)]
#[diesel(table_name=locations)]
pub struct FormLocation {
    pub label: Option<String>,
    pub location_lat: Option<f64>,
    pub location_lng: Option<f64>,
    pub image_url: Option<String>,
    pub obsolete_at: Option<i32>,
}

impl From<DBLocation> for OrgLocation {
    fn from(db_loc: DBLocation) -> Self {
        Self {
            id: db_loc.id,
            id_org: db_loc.org_id,
            label: db_loc.label,
            location_lat: db_loc.location_lat,
            location_lng: db_loc.location_lng,
            image_url: db_loc.image_url,
        }
    }
}

impl OrgLocation {
    pub fn latlng(&self) -> LatLng {
        LatLng {
            lat: self.location_lat,
            lng: self.location_lng,
        }
    }
}
