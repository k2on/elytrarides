use actix::Message;
use uuid::Uuid;
use crate::types::phone::Phone;

use super::model::{DBDriver, DBDriverInsertable, FormEventDriver};
use diesel::QueryResult;

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBDriver>>")]
pub struct EventDriversList {
    pub id_event: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBDriver>>")]
pub struct DriverEventsList {
    pub phone: Phone,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBDriverInsertable>")]
pub struct EventDriverUpdate {
    pub phone: Phone,
    pub id_event: Uuid,
    pub form: FormEventDriver,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBDriver>")]
pub struct EventDriverGet {
    pub id: i32,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBDriver>")]
pub struct EventDriverFind {
    pub phone: Phone,
    pub id_event: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBDriver>")]
pub struct EventDriverRecentForUser {
    pub phone: Phone,
    pub id_org: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<i64>")]
pub struct EventDriverTotalForUser {
    pub phone: Phone,
    pub id_org: Uuid,
}

