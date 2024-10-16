use actix::Handler;
use diesel::QueryResult;
use diesel::prelude::*;

use crate::db_util::DBActor;
use crate::schema::locations::dsl::*;

use super::DBLocation;
use super::DBLocationInsertable;
use super::messages::OrgLocationUpdate;
use super::messages::{OrgLocations, OrgLocationGet};



impl Handler<OrgLocations> for DBActor {
    type Result = QueryResult<Vec<DBLocation>>;

    fn handle(&mut self, msg: OrgLocations, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        locations
            .filter(id_org.eq(msg.id_org))
            .filter(obsolete_at.is_null())
            .get_results::<DBLocation>(&mut conn)
    }
}

impl Handler<OrgLocationGet> for DBActor {
    type Result = QueryResult<DBLocation>;

    fn handle(&mut self, msg: OrgLocationGet, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Org Get: Unable to establish connection");
        locations.find(msg.id).first(&mut conn)
    }
}
impl Handler<OrgLocationUpdate> for DBActor {
    type Result = QueryResult<DBLocationInsertable>;

    fn handle(&mut self, msg: OrgLocationUpdate, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Org Update: Unable to establish connection");

        let org = DBLocationInsertable {
            id: msg.id_location,
            id_org: msg.id_org,
            label: msg.form.label,
            location_lat: msg.form.location_lat,
            location_lng: msg.form.location_lng,
            image_url: msg.form.image_url,
            obsolete_at: msg.form.obsolete_at,
        };

        diesel::insert_into(locations)
            .values(&org)
            .on_conflict(id)
            .do_update()
            .set(&org)
            .execute(&mut conn)?;
        Ok(org)
    }
}

