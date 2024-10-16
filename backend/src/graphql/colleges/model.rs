use diesel::{Queryable, Insertable, AsChangeset};
use juniper::{GraphQLInputObject, GraphQLObject};
use serde::Serialize;
use uuid::Uuid;
use crate::schema::colleges;


#[derive(Debug, Serialize, Queryable, AsChangeset, Insertable)]
#[diesel(table_name=colleges)]
pub struct DBCollege {
    pub id: Uuid,
    pub name: String,
    pub logo_url: String,
    pub location_lat: f64,
    pub location_lng: f64,
    pub created_at: i32,
    pub removed_at: Option<i32>,

}

#[derive(Debug, Serialize)]
pub struct College {
    pub id: Uuid,
    pub name: String,
    pub logo_url: String,
    pub location_lat: f64,
    pub location_lng: f64,
    pub created_at: i32,
    pub removed_at: Option<i32>,
}

impl From<DBCollege> for College {
    fn from(db_college: DBCollege) -> Self {
        Self {
            id: db_college.id,
            name: db_college.name,
            logo_url: db_college.logo_url,
            location_lat: db_college.location_lat,
            location_lng: db_college.location_lng,
            created_at: db_college.created_at,
            removed_at: db_college.removed_at,
        }
    }
}

#[derive(Serialize, Insertable, GraphQLInputObject, AsChangeset)]
#[diesel(table_name=colleges)]
pub struct FormCollege {
    pub id: Uuid,
    pub name: String,
    pub logo_url: String,
    pub location_lat: f64,
    pub location_lng: f64,
    pub created_at: i32,
    pub removed_at: Option<i32>,
}
