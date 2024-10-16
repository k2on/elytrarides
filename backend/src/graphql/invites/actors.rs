use actix::Handler;
use diesel::QueryResult;
use diesel::prelude::*;
// use uuid::Uuid;

use crate::market::util::now;
// use crate::r#const::ADMIN_ORG_ID;
use crate::db_util::DBActor;
use crate::schema::invites::dsl::*;

use super::messages::OrgInviteRevoke;
use super::messages::GetInvite;
use super::model::{DBInvite, DBInviteInsertable};
use super::messages::{UserInvites, OrgInvites, OrgInviteCreate};

impl Handler<UserInvites> for DBActor {
    type Result = QueryResult<Vec<DBInvite>>;
    
    fn handle(&mut self, msg: UserInvites, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self
            .0
            .get()
            .expect("Could not get DB connection from pool");
        invites
            .filter(revoked_at.is_not_null())
            .filter(phone.eq(msg.phone))
            .get_results::<DBInvite>(&mut conn)
    }
}

impl Handler<GetInvite> for DBActor {
    type Result = QueryResult<DBInvite>;

    fn handle(&mut self, msg: GetInvite, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        invites
            .find(msg.id)
            // .filter(revoked_at.is_null())
            .get_result::<DBInvite>(&mut conn)
    }

}

impl Handler<OrgInvites> for DBActor {
    type Result = QueryResult<Vec<DBInvite>>;
    
    fn handle(&mut self, msg: OrgInvites, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        invites
            .filter(revoked_at.is_null())
            .filter(id_org.eq(msg.id_org))
            .get_results::<DBInvite>(&mut conn)
    }
}

impl Handler<OrgInviteCreate> for DBActor {
    type Result = QueryResult<DBInviteInsertable>;

    fn handle(&mut self, msg: OrgInviteCreate, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        let invite = DBInviteInsertable {
            id: msg.id,
            phone: msg.phone.map(|p| p.to_string()),
            id_org: msg.id_org,
            created_at: now(),
            created_by: msg.actor,
        };

        diesel::insert_into(invites)
            .values(&invite)
            .on_conflict(id)
            .do_update()
            .set(&invite)
            .execute(&mut conn)?;
        Ok(invite)
    }
}

impl Handler<OrgInviteRevoke> for DBActor {
    type Result = QueryResult<DBInvite>;

    fn handle(&mut self, msg: OrgInviteRevoke, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        diesel::update(invites)
            .filter(id.eq(msg.id))
            .set((revoked_at.eq(now()), revoked_by.eq(msg.actor)))
            .get_result::<DBInvite>(&mut conn)
    }
}

