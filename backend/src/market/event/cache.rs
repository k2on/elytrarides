use std::collections::HashMap;

use chrono::Duration;
use kv::{Store, Integer};
use log::debug;
use serde::{Serialize, Deserialize};
use uuid::Uuid;

use crate::{graphql::geo::model::LatLng, market::{types::MarketResult, util::now, strategy::{model::{Strategy, IdEventDriver}, driver::{model::DriverStrategy, stop::model::DriverStop}}}};

const BUCKET_LOCATIONS: &str = "location_events";
const BUCKET_STRATEGIES: &str = "strategies";
const BUCKET_EST_DRIVERS: &str = "estimations_drivers";
const BUCKET_REAL_TIME: &str = "location_real_time";
const BUCKET_EST_STOPS: &str = "estimations_stops";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TimeEstimatesDrivers {
    pub drivers: HashMap<String, CachedEstimate>,
}

impl TimeEstimatesDrivers {
    pub fn new() -> Self {
        Self {
            drivers: HashMap::new()
        }
    }
}

impl TimeEstimatesStops {
    pub fn new() -> Self {
        Self {
            connections: HashMap::new()
        }
    }
}

/// Reservation ids should decrease (not 421-420)
/// `E-420:0` for reservation to event estimates (in that order)
///
/// `420:0-420:1` for reservation stop to reservation stop
///
/// `420:0-421:0` for reservation to reservation
pub type TimeEstimateStopKey = String;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TimeEstimatesStops {
    pub connections: HashMap<TimeEstimateStopKey, CachedEstimate>,
}


#[serde_with::serde_as]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CachedEstimate {
    #[serde_as(as = "serde_with::DurationSeconds<i64>")]
    pub duration: Duration,
    pub made_at: i32,
}

const EST_REFRESH_THRESHOLD_SECONDS: i32 = 60;

impl CachedEstimate {
    pub fn new(duration: Duration) -> Self {
        Self {
            duration,
            made_at: now(),
        }
    }

    pub fn should_update(&self) -> bool {
        let now = now();
        let diff = now - self.made_at;
        diff > EST_REFRESH_THRESHOLD_SECONDS
    }
}



#[derive(Debug, Clone)]
pub struct MarketEventCache {
    kv: Store
}

impl MarketEventCache {
    pub fn new(kv: Store) -> Self {
        Self {
            kv
        }
    }

    #[doc = "Get the bucket for property locations"]
    fn bucket_property_locations(&self) -> kv::Bucket<&str, kv::Json<LatLng>> {
        self.kv.bucket(Some(BUCKET_LOCATIONS)).unwrap()
    }

    #[doc = "Get the bucket for strategies"]
    fn bucket_strategies(&self) -> kv::Bucket<&str, kv::Json<Strategy>> {
        self.kv.bucket(Some(BUCKET_STRATEGIES)).unwrap()
    }

    #[doc = "Get the bucket for driver estimations"]
    fn bucket_estimations_drivers(&self) -> kv::Bucket<&str, kv::Json<TimeEstimatesDrivers>> {
        self.kv.bucket(Some(BUCKET_EST_DRIVERS)).unwrap()
    }

    #[doc = "Get the bucket for stop estimations"]
    fn bucket_estimations_stops(&self) -> kv::Bucket<&str, kv::Json<TimeEstimatesStops>> {
        self.kv.bucket(Some(BUCKET_EST_STOPS)).unwrap()
    }

    #[doc = "Get the bucket for driver real time locations"]
    fn bucket_driver_locations(&self) -> kv::Bucket<Integer, kv::Json<LatLng>> {
        self.kv.bucket(Some(BUCKET_REAL_TIME)).unwrap()
    }

    #[doc = "Clear the cache for events"]
    pub fn clear(&self) -> MarketResult<()> {
        self.kv.drop_bucket(BUCKET_LOCATIONS)?;
        self.kv.drop_bucket(BUCKET_STRATEGIES)?;
        self.kv.drop_bucket(BUCKET_EST_DRIVERS)?;
        self.kv.drop_bucket(BUCKET_EST_STOPS)?;
        self.kv.drop_bucket(BUCKET_REAL_TIME)?;
        Ok(())
    }

    #[doc = "Get a property location from an event id"]
    pub fn get_property_location(&self, id_event: &Uuid) -> MarketResult<Option<LatLng>> {
        let key = id_event.to_string();
        let result = self.bucket_property_locations().get(&&*key)?
            .map(|result| result.0);
        Ok(result)
    }

    #[doc = "Set a property location for an event id"]
    pub fn set_property_location(&self, id_event: &Uuid, location: LatLng) -> MarketResult<()> {
        let key = id_event.to_string();
        self.bucket_property_locations().set(&&*key, &kv::Json(location))?;
        Ok(())
    }

    #[doc = "Get a strategy from an event id"]
    pub fn get_strategy(&self, id_event: &Uuid) -> MarketResult<Option<Strategy>> {
        let key = id_event.to_string();
        let result = self.bucket_strategies().get(&&*key)?
            .map(|result| result.0);
        Ok(result)
    }

    #[doc = "Set a strategy for an event"]
    pub fn set_strategy(&self, id_event: &Uuid, strategy: Strategy) -> MarketResult<()> {
        let key = id_event.to_string();
        self.bucket_strategies().set(&&*key, &kv::Json(strategy))?;
        Ok(())
    }

    #[doc = "Get driver estimations for an event"]
    pub fn get_estimates_drivers(&self, id_event: &Uuid) -> MarketResult<Option<TimeEstimatesDrivers>> {
        let key = id_event.to_string();
        let result = self.bucket_estimations_drivers().get(&&*key)?
            .map(|result| result.0);
        Ok(result)
    }

    #[doc = "Get an updated estimate for a driver, this will be None if it is out of date"]
    pub fn get_estimate_driver(&self, id_event: &Uuid, driver_strategy: &DriverStrategy) -> MarketResult<Option<Duration>> {
        let key = format!("{}-{}", driver_strategy.id, driver_strategy.clone().dest.unwrap().key());
        let ests = self.get_estimates_drivers(id_event)?;
        let est = ests
            .and_then(|ests| ests.drivers.get(&key).cloned())
            .and_then(|est| if est.should_update() { None } else { Some(est) })
            .map(|est| est.duration);
        Ok(est)
    }

    #[doc = "Set driver estimates for an event"]
    fn set_estimates_drivers(&self, id_event: &Uuid, estimates: TimeEstimatesDrivers) -> MarketResult<()> {
        let key = id_event.to_string();
        self.bucket_estimations_drivers().set(&&*key, &kv::Json(estimates))?;
        Ok(())
    }

    #[doc = "Update a driver estimation"]
    pub fn update_estimate_driver(&self, id_event: &Uuid, driver_strategy: &DriverStrategy, estimate: Duration) -> MarketResult<()> {
        let key = format!("{}-{}", driver_strategy.id, driver_strategy.clone().dest.unwrap().key());
        let mut ests = self.get_estimates_drivers(id_event)?.unwrap_or(TimeEstimatesDrivers::new());
        ests.drivers.insert(key, CachedEstimate::new(estimate));
        self.set_estimates_drivers(id_event, ests)?;
        Ok(())
    }

    #[doc = "Get driver location by their id"]
    pub fn get_driver_location(&self, id_driver: &IdEventDriver) -> MarketResult<Option<LatLng>> {
        let result = self.bucket_driver_locations().get(&Integer::from(*id_driver))?
            .map(|result| result.0);
        Ok(result)
    }

    #[doc = "Set driver location from their id"]
    pub fn delete_driver_location(&self, id_driver: &IdEventDriver) -> MarketResult<()> {
        self.bucket_driver_locations().remove(&Integer::from(*id_driver))?;
        Ok(())
    }

    #[doc = "Set driver location from their id"]
    pub fn set_driver_location(&self, id_driver: &IdEventDriver, location: &LatLng) -> MarketResult<()> {
        self.bucket_driver_locations().set(&Integer::from(*id_driver), &kv::Json(location.clone()))?;
        Ok(())
    }

    #[doc = "Get stops estimations for an event"]
    pub fn get_estimates_stops(&self, id_event: &Uuid) -> MarketResult<Option<TimeEstimatesStops>> {
        let key = id_event.to_string();
        let result = self.bucket_estimations_stops().get(&&*key)?
            .map(|result| result.0);
        Ok(result)
    }

    #[doc = "Set the estimates stops for an event"]
    fn set_estimates_stops(&self, id_event: &Uuid, estimates: TimeEstimatesStops) -> MarketResult<()> {
        let key = id_event.to_string();
        self.bucket_estimations_stops().set(&&*key, &kv::Json(estimates))?;
        Ok(())
    }

    #[doc = "Get an estimate between two stops"]
    pub fn get_estimate_between_stops(&self, id_event: &Uuid, from: &DriverStop, to: &DriverStop) -> MarketResult<Option<Duration>> {
        let key = from.key_with(to);
        let stops = self.get_estimates_stops(id_event)?;
        let est = stops.and_then(|stops| stops.connections.get(&key).cloned());
        let duration = est.map(|est| est.duration);
        Ok(duration)
    }

    #[doc = "Update a stop estimate"]
    pub fn update_estimate_stop(&self, id_event: &Uuid, from: &DriverStop, to: &DriverStop, est: Duration) -> MarketResult<()> {
        let key = from.key_with(to);
        let mut ests = self.get_estimates_stops(id_event)?.unwrap_or(TimeEstimatesStops::new());
        ests.connections.insert(key, CachedEstimate::new(est));
        self.set_estimates_stops(id_event, ests)?;
        Ok(())
    }
}
