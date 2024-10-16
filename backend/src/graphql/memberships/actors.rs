use actix::Handler;
use diesel::QueryResult;
use diesel::prelude::*;
use uuid::Uuid;

use crate::r#const::ADMIN_ORG_ID;
use crate::db_util::DBActor;
use crate::schema::members::dsl::*;

use super::messages::UserMembership;
use super::model::{DBMembership, DBMembershipInsertable};
use super::messages::{UserMemberships, OrgMemberships, OrgMembershipUpdate};

impl Handler<UserMemberships> for DBActor {
    type Result = QueryResult<Vec<DBMembership>>;
    
    fn handle(&mut self, msg: UserMemberships, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self
            .0
            .get()
            .expect("Could not get DB connection from pool");
        members
            .filter(flags.gt(0)) // Is at least a member
            .filter(phone.eq(msg.phone))
            .get_results::<DBMembership>(&mut conn)
    }
}

impl Handler<UserMembership> for DBActor {
    type Result = QueryResult<DBMembership>;
    
    fn handle(&mut self, msg: UserMembership, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self
            .0
            .get()
            .expect("Could not get DB connection from pool");
        members
            .filter(flags.gt(0)) // Is at least a member
            .filter(phone.eq(msg.phone))
            .filter(id_org.eq(msg.id_org).or(id_org.eq(Uuid::parse_str(ADMIN_ORG_ID).expect("Could not parse ADMIN_ORG_ID"))))
            .first::<DBMembership>(&mut conn)
    }
}

impl Handler<OrgMemberships> for DBActor {
    type Result = QueryResult<Vec<DBMembership>>;
    
    fn handle(&mut self, msg: OrgMemberships, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        members
            .filter(flags.gt(0)) // Is at least a member
            .filter(id_org.eq(msg.id_org))
            .get_results::<DBMembership>(&mut conn)
    }
}

impl Handler<OrgMembershipUpdate> for DBActor {
    type Result = QueryResult<DBMembership>;
    
    fn handle(&mut self, msg: OrgMembershipUpdate, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        let membership = DBMembershipInsertable {
            phone: msg.phone.to_string(),
            id_org: msg.id_org,
            flags: msg.flags,
        };


        let r = diesel::insert_into(members)
            .values(&membership)
            .on_conflict((phone, id_org))
            .do_update()
            .set(flags.eq(msg.flags))
            .execute(&mut conn)?;

        Ok(DBMembership {
            id: r as i32,
            phone: msg.phone.to_string(),
            id_org: msg.id_org,
            flags: msg.flags,
        })
    }
}

