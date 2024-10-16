use actix::Handler;
use diesel::QueryResult;
use diesel::prelude::*;

use crate::db_util::DBActor;
use crate::schema::colleges::dsl::*;

use super::messages::CollegeGet;
use super::messages::CollegeUpdate;
use super::messages::CollegesList;
use super::model::DBCollege;


impl Handler<CollegesList> for DBActor {
    type Result = QueryResult<Vec<DBCollege>>;

    fn handle(&mut self, _msg: CollegesList, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Org Get All: Unable to establish connection");
        colleges.get_results::<DBCollege>(&mut conn)
    }
}


impl Handler<CollegeGet> for DBActor {
    type Result = QueryResult<DBCollege>;

    fn handle(&mut self, msg: CollegeGet, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Org Get: Unable to establish connection");
        colleges.find(msg.id).first(&mut conn)
    }
}

impl Handler<CollegeUpdate> for DBActor {
    type Result = QueryResult<DBCollege>;

    fn handle(&mut self, msg: CollegeUpdate, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Org Update: Unable to establish connection");

        let college = DBCollege {
            id: msg.id,
            name: msg.form.name,
            logo_url: msg.form.logo_url,
            location_lat: msg.form.location_lat,
            location_lng: msg.form.location_lng,
            created_at: msg.form.created_at,
            removed_at: msg.form.removed_at,
        };

        diesel::insert_into(colleges)
            .values(&college)
            .on_conflict(id)
            .do_update()
            .set(&college)
            .execute(&mut conn)?;
        Ok(college)
    }
}

