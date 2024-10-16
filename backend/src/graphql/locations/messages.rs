use actix::Message;
use uuid::Uuid;
use super::{model::{DBLocation, DBLocationInsertable}, FormLocation};
use diesel::QueryResult;

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBLocation>>")]
pub struct OrgLocations {
    pub id_org: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBLocation>")]
pub struct OrgLocationGet {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBLocationInsertable>")]
pub struct OrgLocationUpdate {
    pub id_org: Uuid,
    pub id_location: Uuid,
    pub form: FormLocation,
}

