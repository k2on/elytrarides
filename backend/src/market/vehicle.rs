use actix::Addr;
use uuid::Uuid;

use crate::{db_util::DBActor, graphql::vehicles::{Vehicle, messages::VehicleGet}};

use super::types::MarketResult;

#[derive(Debug, Clone)]
pub struct MarketVehicle {
    db: Addr<DBActor>
}

impl MarketVehicle {
    pub fn new(db: Addr<DBActor>) -> Self {
        Self {
            db
        }
    }

    pub async fn get(&self, id: &Uuid) -> MarketResult<Vehicle> {
        let result = self.db.send(VehicleGet { id: id.to_owned() }).await??.into();
        Ok(result)
    }
}

