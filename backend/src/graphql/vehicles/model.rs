use diesel::{Queryable, Insertable, AsChangeset};
use juniper::{GraphQLObject, GraphQLInputObject};
use serde::Serialize;
use uuid::Uuid;
use crate::{schema::vehicles, types::phone::Phone};


#[derive(Debug, Serialize, GraphQLObject)]
pub struct Vehicle {
    pub id: Uuid,
    pub id_org: Uuid,
    pub year: i32,
    pub make: String,
    pub model: String,
    pub color: String,
    pub image_url: String,
    pub license: String,
    pub capacity: i32,
    pub obsolete_at: Option<i32>,
    pub owner_phone: Option<Phone>,
}

#[derive(Debug, Clone, Serialize, Queryable)]
pub struct DBVehicle {
    pub year: i32,
    pub make: String,
    pub model: String,
    pub color: String,
    pub image_url: String,
    pub license: String,
    pub capacity: i32,
    pub id: Uuid,
    pub id_org: Uuid,
    pub obsolete_at: Option<i32>,
    pub owner: Option<Phone>,
}


#[derive(Debug, Serialize, Insertable, AsChangeset)]
#[diesel(table_name=vehicles)]
pub struct DBVehicleInsertable {
    pub id: Uuid,
    pub id_org: Uuid,
    pub year: Option<i32>,
    pub make: Option<String>,
    pub model: Option<String>,
    pub color: Option<String>,
    pub image_url: Option<String>,
    pub license: Option<String>,
    pub capacity: Option<i32>,
    pub obsolete_at: Option<i32>,
    pub owner: Option<Phone>,
}


#[derive(Debug, Serialize, GraphQLInputObject)]
pub struct FormVehicle {
    pub year: Option<i32>,
    pub make: Option<String>,
    pub model: Option<String>,
    pub color: Option<String>,
    pub image_url: Option<String>,
    pub license: Option<String>,
    pub capacity: Option<i32>,
    pub obsolete_at: Option<i32>,
    pub owner: Option<Phone>,
}


impl From<DBVehicle> for Vehicle {
    fn from(db_vehicle: DBVehicle) -> Self {
        Self {
            id: db_vehicle.id,
            id_org: db_vehicle.id_org,
            year: db_vehicle.year,
            make: db_vehicle.make,
            model: db_vehicle.model,
            color: db_vehicle.color,
            image_url: db_vehicle.image_url,
            license: db_vehicle.license,
            capacity: db_vehicle.capacity,
            obsolete_at: db_vehicle.obsolete_at,
            owner_phone: db_vehicle.owner,
        }
    }
}
