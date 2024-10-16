use actix::Message;
use uuid::Uuid;
use crate::types::phone::Phone;

use super::model::DBMembership;
use diesel::QueryResult;

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBMembership>>")]
pub struct UserMemberships {
    pub phone: Phone,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBMembership>")]
pub struct UserMembership {
    pub phone: Phone,
    pub id_org: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBMembership>>")]
pub struct OrgMemberships {
    pub id_org: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBMembership>")]
pub struct OrgMembershipUpdate {
    pub id_org: Uuid,
    pub phone: Phone,
    pub flags: i32,
}
