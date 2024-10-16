use diesel::{Queryable, Insertable};
use serde::Serialize;
use uuid::Uuid;
use crate::schema::members;

use crate::graphql::{orgs::model::Organization, users::User};
use crate::types::phone::Phone;

#[derive(Debug, Serialize, Queryable)]
pub struct DBMembership {
    pub id: i32,
    pub phone: String,
    pub flags: i32,
    pub id_org: Uuid,
}

#[derive(Debug, Serialize, Insertable)]
#[diesel(table_name=members)]
pub struct DBMembershipInsertable {
    pub phone: String,
    pub flags: i32,
    pub id_org: Uuid,
}

#[derive(Debug, Serialize)]
pub struct Membership {
    pub org: Option<Organization>,
    pub user: Option<User>,
    pub id: i32,
    pub id_org: Uuid,
    pub phone: Phone,
    pub is_member: bool,
    pub is_driver: bool,
    pub is_admin: bool,
    pub is_new_member: bool,
}

impl From<DBMembership> for Membership {
    fn from(db_membership: DBMembership) -> Self {
        Self {
            id: db_membership.id,
            id_org: db_membership.id_org,
            is_member: db_membership.flags & 1 != 0,
            is_driver: db_membership.flags & 2 != 0,
            is_admin: db_membership.flags & 4 != 0,
            is_new_member: db_membership.flags & 8 != 0,
            phone: Phone::new(&db_membership.phone).expect("Invalid phone number format"),
            org: None,
            user: None,
        }
    }
}

