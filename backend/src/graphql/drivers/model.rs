use diesel::{Queryable, Insertable};
use juniper::{GraphQLInputObject, GraphQLObject};
use serde::Serialize;
use uuid::Uuid;
use crate::{schema::event_drivers, types::phone::Phone};

#[derive(Debug, Serialize, Clone)]
pub struct Driver {
    pub id: i32,
    pub id_event: Uuid,
    pub phone: Phone,
    pub id_vehicle: Option<Uuid>,
    pub obsolete_at: Option<i32>,
}

#[derive(Debug, Serialize, Clone)]
pub struct DriverWithVehicle {
    pub id: i32,
    pub id_event: Uuid,
    pub phone: Phone,
    pub id_vehicle: Uuid,
    pub obsolete_at: Option<i32>,
}

#[derive(Debug, Serialize, Queryable, Clone)]
pub struct DBDriver {
    pub id: i32,
    pub phone: String,
    pub id_event: Uuid,
    pub obsolete_at: Option<i32>,
    pub id_vehicle: Option<Uuid>,
}

#[derive(Debug, Serialize, Insertable, GraphQLObject)]
#[diesel(table_name=event_drivers)]
pub struct DBDriverInsertable {
    pub phone: String,
    pub id_event: Uuid,
    pub id_vehicle: Option<Uuid>,
    pub obsolete_at: Option<i32>,
}

#[derive(Debug, Clone, GraphQLInputObject)]
pub struct FormEventDriver {
    pub id_vehicle: Option<Uuid>,
    pub obsolete_at: Option<i32>,
}


impl From<DBDriver> for Driver {
    fn from(db_driver: DBDriver) -> Self {
        Self {
            id: db_driver.id,
            phone: Phone::new(&db_driver.phone).expect("Invalid phone number format"),
            id_event: db_driver.id_event,
            id_vehicle: db_driver.id_vehicle,
            obsolete_at: db_driver.obsolete_at,
        }
    }
}
