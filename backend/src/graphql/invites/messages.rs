use actix::Message;
use uuid::Uuid;
use crate::types::phone::Phone;

use super::model::{DBInvite, DBInviteInsertable};
use diesel::QueryResult;

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBInvite>>")]
pub struct UserInvites {
    pub phone: Phone,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBInvite>")]
pub struct GetInvite {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBInvite>>")]
pub struct OrgInvites {
    pub id_org: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBInviteInsertable>")]
pub struct OrgInviteCreate {
    pub id: Uuid,
    pub id_org: Uuid,
    pub phone: Option<Phone>,
    pub actor: Phone,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBInvite>")]
pub struct OrgInviteRevoke {
    pub id: Uuid,
    pub actor: Phone,
}

