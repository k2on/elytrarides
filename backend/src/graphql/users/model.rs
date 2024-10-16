use diesel::{Queryable, Insertable, AsChangeset};
use juniper::GraphQLInputObject;
use serde::Serialize;
use uuid::Uuid;
use crate::r#const::{ANONYMOUS_NAME, ANONYMOUS_IMAGE_URL};
use crate::schema::users;

use crate::graphql::memberships::model::Membership;
use crate::types::phone::Phone;

#[derive(Debug, Queryable, Insertable, AsChangeset)]
#[diesel(table_name=users)]
pub struct DBUser {
    pub phone: String,
    pub name: String,
    pub image_url: Option<String>,
    pub created_at: i32,
    pub updated_at: i32,
    pub is_opted_in_sms: Option<bool>,
}

#[derive(Debug, Clone, Queryable, Insertable, AsChangeset)]
#[diesel(table_name=users)]
pub struct DBUserInsertable {
    pub phone: String,
    pub name: String,
    pub image_url: Option<String>,
    pub created_at: i32,
    pub updated_at: i32,
}

#[derive(Debug, Serialize, GraphQLInputObject)]
pub struct FormUser {
    pub name: String,
    pub profile_image: Option<Uuid>,
}

#[derive(Debug, Serialize, GraphQLInputObject)]
pub struct FormUserInsert {
    pub name: String,
    pub profile_image: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct User {
    pub phone: Phone,
    pub name: String,
    pub image_url: Option<String>,
    pub memberships: Vec<Membership>,
    pub created_at: i32,
    pub updated_at: i32,
    pub is_opted_in_sms: Option<bool>,
}

impl User {
    pub fn anonymous(phone: &Phone) -> Self {
        Self {
            phone: phone.to_owned(),
            name: ANONYMOUS_NAME.to_owned(),
            image_url: Some(ANONYMOUS_IMAGE_URL.to_owned()),
            memberships: vec![],
            created_at: 0,
            updated_at: 0,
            is_opted_in_sms: None,
        }
    }
}

impl From<DBUser> for User {
    fn from(db_user: DBUser) -> Self {
        Self {
            phone: Phone::new(&db_user.phone).expect("Invalid phone number format"),
            name: db_user.name,
            image_url: db_user.image_url,
            memberships: vec![],
            created_at: db_user.created_at,
            updated_at: db_user.updated_at,
            is_opted_in_sms: db_user.is_opted_in_sms,
        }
    }
}
