use crate::graphql::context::Context;

use super::{driver::model::DriverStrategyEstimations, model::StrategyEstimations};

#[juniper::graphql_object(Context = Context)]
impl StrategyEstimations {
    pub fn drivers(&self) -> Vec<DriverStrategyEstimations> {
        self.drivers
            .values()
            .cloned()
            .collect()
    }
}


