use actix::Message;
use uuid::Uuid;
use crate::types::phone::Phone;

use super::model::{DBGroup, DBGroupMembership, DBGroupInsertable, DBGroupMembershipInsertable};
use diesel::QueryResult;

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBGroup>>")]
pub struct OrgGroupList {
    pub id_org: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBGroup>")]
pub struct OrgGroupGet {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBGroupInsertable>")]
pub struct OrgGroupUpdate {
    pub group: DBGroupInsertable,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBGroupMembershipInsertable>")]
pub struct OrgGroupMemberUpdate {
    pub membership: DBGroupMembershipInsertable,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBGroupMembership>>")]
pub struct OrgUserGroupMembershipsList {
    pub id_org: Uuid,
    pub phone: Phone,
}
