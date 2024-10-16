use diesel::{Queryable, AsChangeset, Insertable};
use serde::Serialize;
use juniper::GraphQLInputObject;
use uuid::Uuid;
use crate::{schema::events, graphql::locations::OrgLocation};

#[derive(Debug, Serialize)]
pub struct Event {
    pub id: Uuid,
    pub id_org: Uuid,
    pub id_location: Option<Uuid>,
    pub location: Option<OrgLocation>,
    pub name: String,
    pub bio: Option<String>,
    pub image_url: Option<String>,
    pub time_start: i32,
    pub time_end: i32,
    pub reservations_start: i32,
    pub reservations_end: i32,
    pub obsolete_at: Option<i32>,
    pub published_at: Option<i32>,
}

#[derive(Debug, Serialize, Queryable)]
pub struct DBEvent {
    pub name: String,
    pub bio: Option<String>,
    pub image_url: Option<String>,
    pub time_start: i32,
    pub time_end: i32,
    pub reservations_start: i32,
    pub reservations_end: i32,
    pub id_location: Option<Uuid>,
    pub id_org: Uuid,
    pub obsolete_at: Option<i32>,
    pub published_at: Option<i32>,
    pub id: Uuid,
}

#[derive(Debug, Serialize, Insertable, AsChangeset)]
#[diesel(table_name=events)]
pub struct DBEventInsertable {
    pub id: Uuid,
    pub name: String,
    pub bio: Option<String>,
    pub image_url: Option<String>,
    pub time_start: i32,
    pub time_end: i32,
    pub reservations_start: i32,
    pub reservations_end: i32,
    pub id_location: Uuid,
    pub id_org: Uuid,
    pub obsolete_at: Option<i32>,
    pub published_at: Option<i32>,
}


#[derive(Debug, GraphQLInputObject)]
pub struct FormEvent {
    pub name: Option<String>,
    pub bio: Option<String>,
    pub image_url: Option<String>,
    pub time_start: Option<i32>,
    pub time_end: Option<i32>,
    pub reservations_start: Option<i32>,
    pub reservations_end: Option<i32>,
    pub id_location: Option<Uuid>,
    pub obsolete_at: Option<i32>,
    pub published_at: Option<i32>,
}

impl From<DBEvent> for Event {
    fn from(db_event: DBEvent) -> Self {
        Self {
            id: db_event.id,
            id_org: db_event.id_org,
            id_location: db_event.id_location,
            location: None,
            name: db_event.name,
            bio: db_event.bio,
            image_url: db_event.image_url,
            time_start: db_event.time_start,
            time_end: db_event.time_end,
            reservations_start: db_event.reservations_start,
            reservations_end: db_event.reservations_end,
            obsolete_at: db_event.obsolete_at,
            published_at: db_event.published_at,
        }
    }
}
