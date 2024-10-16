use diesel::{Queryable, Insertable, AsChangeset};
use serde::Serialize;
use uuid::Uuid;

use crate::{types::phone::Phone, schema::invites, graphql::{orgs::model::Organization, users::User}};

#[derive(Debug, Serialize, Queryable)]
pub struct DBInvite {
    pub id: Uuid,
    pub id_org: Uuid,
    pub phone: Option<String>,
    pub created_at: i32,
    pub revoked_at: Option<i32>,
    pub created_by: Phone,
    pub revoked_by: Option<Phone>,
}

#[derive(Debug, Serialize, Insertable, AsChangeset)]
#[diesel(table_name=invites)]
pub struct DBInviteInsertable {
    pub id: Uuid,
    pub phone: Option<String>,
    pub id_org: Uuid,
    pub created_at: i32,
    pub created_by: Phone,
}

#[derive(Debug, Serialize)]
pub struct Invite {
    pub org: Option<Organization>,
    pub user: Option<User>,
    pub id: Uuid,
    pub id_org: Uuid,
    pub phone: Option<Phone>,
    pub created_by: Option<User>,
    pub created_at: i32,
    pub revoked_by: Option<User>,
    pub revoked_at: Option<i32>,
}

impl From<DBInvite> for Invite {
    fn from(db_invite: DBInvite) -> Self {
        Self {
            id: db_invite.id,
            id_org: db_invite.id_org,
            phone: db_invite.phone.map(|phone| Phone::new(&phone).expect("Invalid phone number format")),
            org: None,
            user: None,
            created_at: db_invite.created_at,
            created_by: None,
            revoked_at: db_invite.revoked_at,
            revoked_by: None,
        }
    }
}

