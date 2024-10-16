use diesel::{Queryable, Insertable, AsChangeset};
use uuid::Uuid;
use crate::schema::media;

#[derive(Debug, Queryable, Insertable, AsChangeset)]
#[diesel(table_name=media)]
pub struct DBMedia {
    pub id: Uuid,
    pub uploader: String,
    pub id_org: Option<Uuid>,
    pub media_type: String,
    pub url: String,
    pub created_at: i32,
    pub removed_at: Option<i32>,
}

