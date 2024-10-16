use diesel::{Queryable, Insertable, AsChangeset};
use juniper::{GraphQLObject, GraphQLInputObject};
use serde::Serialize;
use uuid::Uuid;
use crate::schema::{user_groups, user_group_memberships};

use crate::types::phone::Phone;


#[derive(Debug, Serialize, GraphQLInputObject)]
pub struct FormGroup {
    pub label: String,
    pub color: String,
}

#[derive(Debug, Serialize, Queryable)]
pub struct DBGroup {
    pub id: Uuid,
    pub id_org: Uuid,
    pub label: String,
    pub color: String,
    pub created_by: String,
    pub updated_by: Option<String>,
    pub created_at: i32,
    pub updated_at: Option<i32>,
    pub removed_at: Option<i32>,
}

#[derive(Debug, Serialize, Queryable)]
pub struct DBGroupMembership {
    pub id: i32,
    pub id_org: Uuid,
    pub id_group: Uuid,
    pub phone: String,
    pub created_at: i32,
    pub created_by: String,
    pub removed_at: Option<i32>,
    pub removed_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Insertable, AsChangeset)]
#[diesel(table_name=user_groups)]
pub struct DBGroupInsertable {
    pub id: Uuid,
    pub id_org: Uuid,
    pub label: String,
    pub color: String,
    pub created_by: String,
    pub updated_by: Option<String>,
    pub created_at: i32,
    pub updated_at: Option<i32>,
    pub removed_at: Option<i32>,
}

#[derive(Debug, Serialize, Insertable, GraphQLObject)]
#[diesel(table_name=user_group_memberships)]
pub struct DBGroupMembershipInsertable {
    pub id_group: Uuid,
    pub id_org: Uuid,
    pub phone: String,
    pub created_by: String,
    pub created_at: i32,
    pub removed_at: Option<i32>,
    pub removed_by: Option<String>,
}

#[derive(Debug, Serialize, GraphQLObject)]
pub struct Group {
    pub id: Uuid,
    pub id_org: Uuid,
    pub label: String,
    pub color: String,
    pub created_by: Phone,
    pub updated_by: Option<Phone>,
    pub created_at: i32,
    pub updated_at: Option<i32>,
    pub removed_at: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct GroupMembership {
    pub id: i32,
    pub id_org: Uuid,
    pub id_group: Uuid,
    pub phone: Phone,
    pub created_by: Phone,
    pub created_at: i32,
    pub removed_at: Option<i32>,
    pub removed_by: Option<Phone>,
}

impl From<DBGroup> for Group {
    fn from(db_group: DBGroup) -> Self {
        Self {
            id: db_group.id,
            id_org: db_group.id_org,
            label: db_group.label,
            color: db_group.color,
            created_by: Phone::new(&db_group.created_by).expect("Invalid phone number"),
            updated_by: db_group.updated_by.map(|phone| Phone::new(&phone).expect("Invalid phone number")),
            created_at: db_group.created_at,
            updated_at: db_group.updated_at,
            removed_at: db_group.removed_at,
        }
    }
}


impl From<DBGroupMembership> for GroupMembership {
    fn from(db_group_membership: DBGroupMembership) -> Self {
        Self {
            id: db_group_membership.id,
            id_org: db_group_membership.id_org,
            id_group: db_group_membership.id_group,
            phone: Phone::new(&db_group_membership.phone).expect("Invalid phone"),
            created_by: Phone::new(&db_group_membership.created_by).expect("Invalid phone"),
            created_at: db_group_membership.created_at,
            removed_at: db_group_membership.removed_at,
            removed_by: db_group_membership.removed_by.map(|phone| Phone::new(&phone).expect("Invalid phone")),
        }
    }
}

