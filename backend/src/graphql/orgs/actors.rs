use actix::Handler;
use diesel::QueryResult;
use diesel::prelude::*;

use crate::db_util::DBActor;
use crate::graphql::colleges::model::DBCollege;
use crate::schema::orgs::dsl::*;
use crate::schema::colleges;

use super::messages::OrganizationCollegeGet;
use super::messages::OrganizationList;
use super::messages::OrganizationListAtCollege;
use super::messages::OrganizationSearch;
use super::messages::OrganizationUpdate;
use super::{model::DBOrganization, messages::OrganizationGet};

impl Handler<OrganizationList> for DBActor {
    type Result = QueryResult<Vec<DBOrganization>>;

    fn handle(&mut self, _msg: OrganizationList, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Org Get All: Unable to establish connection");
        orgs.get_results::<DBOrganization>(&mut conn)
    }
}


impl Handler<OrganizationGet> for DBActor {
    type Result = QueryResult<DBOrganization>;

    fn handle(&mut self, msg: OrganizationGet, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Org Get: Unable to establish connection");
        orgs.find(msg.id).first(&mut conn)
    }
}
impl Handler<OrganizationUpdate> for DBActor {
    type Result = QueryResult<DBOrganization>;

    fn handle(&mut self, msg: OrganizationUpdate, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Org Update: Unable to establish connection");

        let org = DBOrganization {
            id: msg.id,
            label: msg.form.label,
            bio: msg.form.bio,
            logo_url: msg.form.logo_url,
            banner_url: msg.form.banner_url,
            college: msg.form.college,
        };

        diesel::insert_into(orgs)
            .values(&org)
            .on_conflict(id)
            .do_update()
            .set(&org)
            .execute(&mut conn)?;
        Ok(org)
    }
}

impl Handler<OrganizationCollegeGet> for DBActor {
    type Result = QueryResult<Option<DBCollege>>;

    fn handle(&mut self, msg: OrganizationCollegeGet, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Org Get: Unable to establish connection");
        orgs
            .find(msg.id)
            .left_join(colleges::table.on(college.eq(colleges::id.nullable())))
            .select(colleges::all_columns.nullable())
            .first::<Option<DBCollege>>(&mut conn)
    }
}

impl Handler<OrganizationListAtCollege> for DBActor {
    type Result = QueryResult<Vec<DBOrganization>>;

    fn handle(&mut self, msg: OrganizationListAtCollege, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Org Get All: Unable to establish connection");
        orgs
            .filter(college.eq(Some(msg.id)))
            .get_results::<DBOrganization>(&mut conn)
    }
}

impl Handler<OrganizationSearch> for DBActor {
    type Result = QueryResult<Vec<DBOrganization>>;

    fn handle(&mut self, msg: OrganizationSearch, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Org Get All: Unable to establish connection");
        let pattern = format!("%{}%", msg.input);
        orgs
            .filter(bio.ilike(&pattern))
            .get_results::<DBOrganization>(&mut conn)
    }
}
