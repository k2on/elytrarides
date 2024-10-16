use actix::Message;
use uuid::Uuid;
use crate::graphql::locations::model::DBLocation;
use super::model::{DBEvent, FormEvent, DBEventInsertable};
use diesel::QueryResult;

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBEvent>>")]
pub struct EventsList {
    pub id_org: Uuid,
}


#[derive(Message)]
#[rtype(result = "QueryResult<DBEvent>")]
pub struct EventGet {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Option<DBLocation>>")]
pub struct EventLocationGet {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBEventInsertable>")]
pub struct EventUpdate {
    pub event: DBEventInsertable,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBEvent>>")]
pub struct GetActiveEvents;

