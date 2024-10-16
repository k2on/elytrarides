use actix::Message;
use uuid::Uuid;
use super::model::{DBVehicle, FormVehicle, DBVehicleInsertable};
use diesel::QueryResult;

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBVehicle>>")]
pub struct VehiclesList {
    pub id_org: Uuid,
}


#[derive(Message)]
#[rtype(result = "QueryResult<DBVehicle>")]
pub struct VehicleGet {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBVehicleInsertable>")]
pub struct VehicleUpdate {
    pub id_org: Uuid,
    pub id_vehicle: Uuid,
    pub form: FormVehicle,
}

