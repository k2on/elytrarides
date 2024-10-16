use std::collections::HashMap;

use crate::market::{strategy::model::{Strategy, IdEventDriver}, types::MarketResult, error::ErrorMarket};

use super::{model::StrategyEstimations, driver::model::DriverStrategyEstimations};

impl StrategyEstimations {
    pub fn new(drivers: HashMap<IdEventDriver, DriverStrategyEstimations>) -> Self {
        Self { drivers }
    }

    #[doc = "Converts an estimated strategy into a normal strategy for KV store."]
    pub fn strip_estimates(&self) -> Strategy {
        Strategy {
            drivers: self.drivers
            .iter()
            .map(|(id, driver)| (*id, driver.strip_estimates()))
            .collect()
        }
    }

    pub fn driver(&self, id_driver: &IdEventDriver) -> MarketResult<DriverStrategyEstimations> {
        let driver = self.drivers.get(id_driver).ok_or(ErrorMarket::DriverNotFound)?;
        Ok(driver.clone())
    }

    pub fn shortest(&self) -> MarketResult<Option<DriverStrategyEstimations>> {
        let driver = self.drivers.iter()
            .map(|(_, driver)| (driver, driver.duration()))
            .min_by_key(|(_, dur)| *dur)
            .and_then(|(driver, _)| Some(driver.clone()));
        Ok(driver)
    }
}


