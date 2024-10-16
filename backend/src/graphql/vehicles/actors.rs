use actix::Handler;
use diesel::QueryResult;
use diesel::prelude::*;

use crate::db_util::DBActor;
use crate::schema::vehicles::dsl::*;

use super::DBVehicle;
use super::DBVehicleInsertable;
use super::messages::{VehiclesList, VehicleUpdate, VehicleGet};



impl Handler<VehiclesList> for DBActor {
    type Result = QueryResult<Vec<DBVehicle>>;

    fn handle(&mut self, msg: VehiclesList, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        vehicles
            .filter(id_org.eq(msg.id_org))
            .filter(obsolete_at.is_null())
            .get_results::<DBVehicle>(&mut conn)
    }
}

impl Handler<VehicleGet> for DBActor {
    type Result = QueryResult<DBVehicle>;

    fn handle(&mut self, msg: VehicleGet, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        vehicles.find(msg.id).first(&mut conn)
    }
}

impl Handler<VehicleUpdate> for DBActor {
    type Result = QueryResult<DBVehicleInsertable>;

    fn handle(&mut self, msg: VehicleUpdate, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        let vehicle = DBVehicleInsertable {
            id: msg.id_vehicle,
            id_org: msg.id_org,
            year: msg.form.year,
            make: msg.form.make,
            model: msg.form.model,
            color: msg.form.color,
            license: msg.form.license,
            capacity: msg.form.capacity,
            image_url: msg.form.image_url,
            obsolete_at: msg.form.obsolete_at,
            owner: msg.form.owner,
        };

        diesel::insert_into(vehicles)
            .values(&vehicle)
            .on_conflict(id)
            .do_update()
            .set(&vehicle)
            .execute(&mut conn)?;
        Ok(vehicle)
    }
}

