use std::{collections::HashMap, str::FromStr};

use actix::Addr;
use chrono::Duration;
use kv::Store;
use uuid::Uuid;

use crate::{db_util::DBActor, graphql::{reservations::{messages::{ReservationsInPool, ReservationRemoveDriver}, FormReservation, Reservation, DBReservation, stops::model::{ReservationStops, FormReservationStop, FormLatLng}, FormReservationGeocoded}, geo::model::LatLng, locations::OrgLocation, events::{messages::{EventLocationGet, GetActiveEvents}, Event}, drivers::{Driver, messages::EventDriversList, DriverWithVehicle}, colleges::model::College}, market::util::now};

use self::cache::MarketEventCache;

use super::{types::{MarketResult, ReservationEstimate, TimeEstimate}, error::ErrorMarket, vehicle::MarketVehicle, geocoder::Geocoder, messanger::Messanger, util::add_reservation_arrivals_to_queue, strategy::{driver::{stop::model::DriverStop, model::DriverStrategy}, model::{Strategy, IdEventDriver}}, estimate::{model::StrategyEstimations, driver::{model::DriverStrategyEstimations, stop::model::DriverStopEstimation}}};

pub mod cache;

pub struct MarketEvent {
    db: Addr<DBActor>,
    geocoder: Box<dyn Geocoder>,
    messanger: Box<dyn Messanger>,
    cache: MarketEventCache,
    vehicle: MarketVehicle,
}

impl Clone for MarketEvent {
    fn clone(&self) -> Self {
        Self {
            db: self.db.clone(),
            geocoder: self.geocoder.box_clone(),
            messanger: self.messanger.box_clone(),
            cache: self.cache.clone(),
            vehicle: self.vehicle.clone(),
        }
    }
}

impl MarketEvent {
    pub fn new(db: Addr<DBActor>, geocoder: Box<dyn Geocoder>, messanger: Box<dyn Messanger>, kv: Store, vehicle: MarketVehicle) -> Self {
        Self {
            db,
            cache: MarketEventCache::new(kv),
            geocoder,
            messanger,
            vehicle,
        }
    }

    #[doc = "Clear the cache for events"]
    pub fn clear_cache(&self) -> MarketResult<()> {
        self.cache.clear()?;
        Ok(())
    }

    #[doc = "Get a property for an event"]
    async fn get_property(&self, id_event: &Uuid) -> MarketResult<Option<OrgLocation>> {
        let result = self.db.send(EventLocationGet { id: *id_event }).await??;
        let property = result.map(OrgLocation::from);
        Ok(property)
    }

    #[doc = "Get all the drivers for an event"]
    pub async fn list_drivers(&self, id_event: &Uuid) -> MarketResult<Vec<Driver>> {
        let result: Vec<Driver> = self.db.send(EventDriversList { id_event: *id_event }).await??
            .into_iter()
            .map(|driver| driver.into())
            .collect();
        Ok(result)
    }

    #[doc = "Get all the drivers who have gone online for an event"]
    pub async fn list_drivers_online(&self, id_event: &Uuid) -> MarketResult<Vec<DriverWithVehicle>> {
        let drivers = self.list_drivers(&id_event).await?;
        let mut online = Vec::new();
        for driver in drivers {
            if !self.is_driver_online(&driver.id).await? { continue; }
            if let Some(id) = driver.id_vehicle {
                online.push(DriverWithVehicle {
                    id: driver.id,
                    id_event: driver.id_event,
                    phone: driver.phone,
                    id_vehicle: id,
                    obsolete_at: driver.obsolete_at,
                });
            }
        }
        Ok(online)
    }

    #[doc = "Return whether or not the driver is online, this currently works by seeing if they have pinged for an event"]
    pub async fn is_driver_online(&self, id_driver: &IdEventDriver) -> MarketResult<bool> {
        let is_online = self.cache.get_driver_location(&id_driver)?.is_some();
        Ok(is_online)
    }

    #[doc = "Get the current active events"]
    pub async fn list_active(&self) -> MarketResult<Vec<Event>> {
        let events = self.db.send(GetActiveEvents).await??.into_iter().map(Event::from).collect();
        Ok(events)
    }

    #[doc = "Refresh estimates for an event and return the new estimate"]
    pub async fn refresh_estimates(&self, id_event: &Uuid) -> MarketResult<StrategyEstimations> {
        let estimated = self.get_estimates_with_pool(&id_event).await?;
        for (_, driver) in estimated.drivers {
            if let Some(_) = &driver.dest {
                self.refresh_and_get_driver_estimate(&id_event, &driver.strip_estimates()).await?;
            }
        }
        self.get_estimates(&id_event).await
    }

    #[doc = "Get estimates for an event"]
    pub async fn get_estimates(&self, id_event: &Uuid) -> MarketResult<StrategyEstimations> {
        let strategy = self.get_strategy_cached(id_event).await?;
        self.calculate_strategy_estimate(id_event, strategy).await
    }

    #[doc = "Calculate estimates for a strategy"]
    async fn calculate_strategy_estimate(&self, id_event: &Uuid, strategy: Strategy) -> MarketResult<StrategyEstimations> {
        let tmp: Vec<_> = strategy.drivers
            .iter()
            .map(|(_, driver)| async move { self.get_driver_estimates(id_event, &driver.to_owned()).await })
            .collect();
        let results: Vec<Result<DriverStrategyEstimations, ErrorMarket>> = futures::future::join_all(tmp).await;
        let driver_estimates = results.iter().try_fold(HashMap::new(), |mut acc, result| {
            match &result {
                Ok(strategy) => {
                    acc.insert(strategy.id, strategy.to_owned());
                    Ok(acc)
                }
                Err(e) => Err(e.clone())
            }
        })?;
        let estimates = StrategyEstimations::new(driver_estimates);
        Ok(estimates)
    }

    #[doc = "Estimate a driver strategy"]
    async fn get_driver_estimates(&self, id_event: &Uuid, driver_strategy: &DriverStrategy) -> MarketResult<DriverStrategyEstimations> {
        let dest_est = self.get_estimate_driver_cached(id_event, driver_strategy).await?
            .unwrap_or(Duration::seconds(0));

        let queue = self.get_driver_queue_estimates(id_event, driver_strategy, dest_est).await?;

        let dest = match &driver_strategy.dest {
            Some(DriverStop::Reservation(reservation)) => Some(DriverStopEstimation::new_res(reservation.clone(), dest_est)),
            Some(DriverStop::Event(_)) => Some(DriverStopEstimation::new_event(dest_est)),
            None => None
        };
        let estimated = DriverStrategyEstimations::new(driver_strategy.clone(), dest, queue);
        Ok(estimated)
    }

    #[doc = "Get estimations for a driver queue"]
    async fn get_driver_queue_estimates(&self, id_event: &Uuid, driver_strategy: &DriverStrategy, dest_est: Duration) -> MarketResult<Vec<DriverStopEstimation>> {
        let queue_pickups = self.get_driver_queue_estimates_without_res_arrivals(id_event, driver_strategy, dest_est).await?;
        let queue = add_reservation_arrivals_to_queue(queue_pickups);
        Ok(queue)

    }

    #[doc = "Get the estimations for a queue without the reservation arrival times"]
    async fn get_driver_queue_estimates_without_res_arrivals(&self, id_event: &Uuid, driver_strategy: &DriverStrategy, dest_est: Duration) -> MarketResult<Vec<DriverStopEstimation>> {
        let mut last_est = dest_est;
        let mut last_stop = driver_strategy.dest.clone();
        let mut queue = Vec::new();
        // println!("--------");
        // println!("ds: {driver_strategy:#?}");
        // println!("de: {dest_est:#?}");
        for (_idx, stop) in driver_strategy.queue.iter().enumerate() {
            match last_stop {
                Some(last) => {
                    let est_between = self.get_stop_estimation(id_event, &last, stop).await?;
                    // println!("last: {last:?}");
                    // println!("stop: {last:?}");
                    // println!("est: {est_between:?}");
                    last_est = last_est + est_between;
                    let stop = match stop {
                        DriverStop::Reservation(res) => DriverStopEstimation::new_res(res.clone(), last_est),
                        DriverStop::Event(_) => DriverStopEstimation::new_event(last_est),
                    };
                    queue.push(stop);
                },
                None => (),
            }
            last_stop = Some(stop.clone());
        }
        Ok(queue)
    }

    #[doc = "Get stop estimation"]
    async fn get_stop_estimation(&self, id_event: &Uuid, from: &DriverStop, to: &DriverStop) -> MarketResult<Duration> {
        match self.cache.get_estimate_between_stops(id_event, from, to)? {
            Some(est) => Ok(est),
            None => self.refresh_and_get_stop_estimate(id_event, from, to).await,
        }
    }

    #[doc = "Gets the driver estimation to their destination, if none exists, will calculate and store it in cache."]
    async fn get_estimate_driver_cached(&self, id_event: &Uuid, driver_strategy: &DriverStrategy) -> MarketResult<Option<Duration>> {
        if let Some(_) = &driver_strategy.dest {
            match self.cache.get_estimate_driver(id_event, &driver_strategy)? {
                Some(est) => Ok(Some(est)),
                None => Ok(Some(self.refresh_and_get_driver_estimate(id_event, driver_strategy).await?)),
            }
        } else {
            Ok(None)
        }
    }

    async fn refresh_and_get_driver_estimate(&self, id_event: &Uuid, driver_strategy: &DriverStrategy) -> MarketResult<Duration> {
        println!("refresh driver");
        let driver_location = self.cache.get_driver_location(&driver_strategy.id)?;
        match (&driver_strategy.dest, driver_location) {
            (Some(dest), Some(location)) => {
                let dest_location = self.get_stop_location(id_event, dest.to_owned()).await?;
                let est = self.geocoder.estimate(location, dest_location).await?;
                self.cache.update_estimate_driver(id_event, &driver_strategy, est.clone())?;
                Ok(est)
            },
            (_, None) => Err(ErrorMarket::NoDriverLocation),
            (None, _) => Err(ErrorMarket::NoDest)
        }
    }

    async fn refresh_and_get_stop_estimate(&self, id_event: &Uuid, stop_from: &DriverStop, stop_to: &DriverStop) -> MarketResult<Duration> {
        println!("refresh stop");
        let from = self.get_stop_location(id_event, stop_from.clone()).await?;
        let to = self.get_stop_location(id_event, stop_to.clone()).await?;
        let est = self.geocoder.estimate(from, to).await?;
        self.cache.update_estimate_stop(id_event, stop_from, stop_to, est)?;
        Ok(est)
    }

    #[doc = "Get the location of a driver stop, will return the event property location if it is an event, otherwise, will return the location of the reservation"]
    async fn get_stop_location(&self, id_event: &Uuid, stop: DriverStop) -> MarketResult<LatLng> {
        match stop {
            DriverStop::Event(_) => self.get_property_location_cached(id_event).await,
            DriverStop::Reservation(res) => Ok(res.latlng()),
        }
    }

    #[doc = "Get an avaliable reservation for an event and driver"]
    pub async fn get_avaliable_reservation(&self, id_event: &Uuid, _id_driver: &IdEventDriver) -> MarketResult<Option<Reservation>> {
        let pool = self.get_pool(id_event).await?; // TODO: cache this
        Ok(pool.first().cloned())
    }

    #[doc = "Get a cached strategy, if one is not found, create one and set it in cache, then return it"]
    async fn get_strategy_cached(&self, id_event: &Uuid) -> MarketResult<Strategy> {
        if let Some(strategy) = self.cache.get_strategy(id_event)? {
            Ok(strategy)
        } else {
            let strategy = self.create_new_strategy(id_event).await?;
            self.cache.set_strategy(id_event, strategy.clone())?;
            Ok(strategy)
        }
    }

    #[doc = "Create a new strategy from an event id"]
    async fn create_new_strategy(&self, id_event: &Uuid) -> MarketResult<Strategy> {
        let event_drivers = self.list_drivers_online(id_event).await?;
        let tmp: Vec<_> = event_drivers
            .iter()
            .map(|driver| async move {
                let vehicle = self.vehicle.get(&driver.id_vehicle).await?;
                let driver_strat = DriverStrategy::new(driver.id, id_event, vehicle.capacity);
                Ok((driver.id, driver_strat))
            })
            .collect();

        let results: Vec<Result<(IdEventDriver, DriverStrategy), ErrorMarket>> = futures::future::join_all(tmp).await;
        let drivers = results.iter().try_fold(HashMap::new(), |mut acc, result| {
            match &result {
                Ok((id, strategy)) => {
                    acc.insert(*id, strategy.to_owned());
                    Ok(acc)
                }
                Err(e) => Err(e.clone())
            }
        })?;
        let strategy = Strategy { drivers };
        Ok(strategy)
    }

    #[doc = "Estimate the pickup time of reservation"]
    #[async_recursion::async_recursion]
    pub async fn get_estimate_reservation(&self, reservation: &Reservation) -> MarketResult<ReservationEstimate> {
        let id_event = reservation.id_event;

        let driver_est = if let Some(id_driver) = reservation.id_driver {
            let driver_est = self.get_estimates(&id_event).await?.driver(&id_driver)?;
            Some(driver_est)
        } else {
            let strategy = self.get_estimates(&id_event).await?;
            let pool = self.get_pool(&id_event).await?;
            let (_, driver_opt) = self.assign_reservations_to_strategy(&id_event, strategy, pool, Some(reservation.id)).await?;
            driver_opt
        };
        if let Some(driver) = driver_est {
            match driver.estimate_reservation(reservation) {
                Ok(est) => Ok(est),
                Err(ErrorMarket::ReservationNotInStrategy) => {
                    let reservation: Reservation = self.db.send(ReservationRemoveDriver { id: reservation.id.to_owned() }).await??.into();
                    self.get_estimate_reservation(&reservation).await
                }
                Err(err) => Err(err),
            }
        } else {
            Ok(self.get_no_drivers_estimation())
        }
    }

    #[doc = "Get estimates of pool reservations"]
    pub async fn get_estimates_with_pool(&self, id_event: &Uuid) -> MarketResult<StrategyEstimations> {
        let strategy = self.get_estimates(&id_event).await?;
        let pool = self.get_pool(&id_event).await?;
        let (est, _) = self.assign_reservations_to_strategy(&id_event, strategy, pool, None).await?;
        Ok(est)
    }

    #[doc = "Estimate the pickup time of reservation"]
    pub async fn get_estimate_reservation_new(&self, id_event: &Uuid, form: &FormReservation) -> MarketResult<ReservationEstimate> {
        let strategy = self.get_estimates(&id_event).await?;
        let mut pool = self.get_pool(&id_event).await?;

        let id_temp = Uuid::new_v4();
        let form = self.geocoder.geocode_form(form).await?;
        let res_temp: Reservation = DBReservation {
            id: id_temp,
            id_event: id_event.to_owned(),
            made_at: now(),
            reserver: String::from("+18002000000"),
            passenger_count: form.passenger_count,
            is_cancelled: false,
            cancelled_at: None,
            id_driver: None,
            is_complete: false,
            complete_at: None,
            stops: ReservationStops::new(form.stops),
            is_dropoff: form.is_dropoff,
            is_driver_arrived: false,
            driver_arrived_at: None,
            est_pickup: 0,
            est_dropoff: 0,
            rating: None,
            feedback: None,
            rated_at: None,
            cancel_reason: None,
            cancel_reason_at: None,
        }.into();
        pool.push(res_temp.clone());

        let (_, driver) = self.assign_reservations_to_strategy(&id_event, strategy, pool, Some(id_temp)).await?;
        if let Some(driver) = driver {
            let est = driver.estimate_reservation(&res_temp)?;
            Ok(est)
        } else {
            Ok(self.get_no_drivers_estimation())
        }
    }

    #[doc = "Estimate the pickup time of reservation about to be created"]
    pub async fn get_estimate_reservation_preinsert(&self, id_event: &Uuid, id_reservation: &Uuid, form_geocoded: &FormReservationGeocoded) -> MarketResult<ReservationEstimate> {
        let strategy = self.get_estimates(&id_event).await?;
        let mut pool = self.get_pool(&id_event).await?;

        let res_temp: Reservation = DBReservation {
            id: *id_reservation,
            id_event: id_event.to_owned(),
            made_at: now(),
            reserver: String::from("+18002000000"),
            passenger_count: form_geocoded.passenger_count,
            is_cancelled: false,
            cancelled_at: None,
            id_driver: None,
            is_complete: false,
            complete_at: None,
            stops: ReservationStops::new(form_geocoded.stops.clone()),
            is_dropoff: form_geocoded.is_dropoff,
            is_driver_arrived: false,
            driver_arrived_at: None,
            est_pickup: 0,
            est_dropoff: 0,
            rating: None,
            feedback: None,
            rated_at: None,
            cancel_reason: None,
            cancel_reason_at: None,
        }.into();
        pool.push(res_temp.clone());

        let (_, driver) = self.assign_reservations_to_strategy(&id_event, strategy, pool, Some(*id_reservation)).await?;
        if let Some(driver) = driver {
            let est = driver.estimate_reservation(&res_temp)?;
            Ok(est)
        } else {
            Ok(self.get_no_drivers_estimation())
        }
    }

    #[doc = "Estimate the pickup time of reservation from campus"]
    pub async fn get_estimate_reservation_campus(&self, id_event: &Uuid, college: &College) -> MarketResult<ReservationEstimate> {
        let strategy = self.get_estimates(&id_event).await?;
        let mut pool = self.get_pool(&id_event).await?;

        // You have to use a constant reservation id for the estimate to get cached
        let id = Uuid::from_str("f8272da1-e043-46a8-a5f7-ca922d7da52a").unwrap();
        let form_raw = FormReservation {
            passenger_count: 1,
            is_dropoff: false,
            stops: vec![
                FormReservationStop {
                    location: college.latlng_form(),
                    place_id: String::from(""), // Google geocoder will not try to geocode this
                    address: String::from("Campus")
                }
            ]
        };
        let form = self.geocoder.geocode_form(&form_raw).await?;
        let res_temp: Reservation = DBReservation {
            id,
            id_event: id_event.to_owned(),
            made_at: now(),
            reserver: String::from("+18002000000"),
            passenger_count: form.passenger_count,
            is_cancelled: false,
            cancelled_at: None,
            id_driver: None,
            is_complete: false,
            complete_at: None,
            stops: ReservationStops::new(form.stops),
            is_dropoff: form.is_dropoff,
            is_driver_arrived: false,
            driver_arrived_at: None,
            est_pickup: 0,
            est_dropoff: 0,
            rating: None,
            feedback: None,
            rated_at: None,
            cancel_reason: None,
            cancel_reason_at: None,
        }.into();
        pool.push(res_temp.clone());

        let (_, driver) = self.assign_reservations_to_strategy(&id_event, strategy, pool, Some(id)).await?;
        if let Some(driver) = driver {
            let est = driver.estimate_reservation(&res_temp)?;
            Ok(est)
        } else {
            Ok(self.get_no_drivers_estimation())
        }
    }


    #[doc = "Get an estimation for an event with no drivers"]
    fn get_no_drivers_estimation(&self) -> ReservationEstimate {
        ReservationEstimate {
            time_estimate: TimeEstimate {
                pickup: Duration::minutes(7),  // TODO: figure out a better way to do this
                arrival: Duration::minutes(14) // there shouldn't be a lot of people who get
                                               // this estimation tho
            },
            queue_position: 0,
        }
    }

    #[async_recursion::async_recursion]
    async fn assign_reservations_to_strategy(&self, id_event: &Uuid, strategy: StrategyEstimations, pool: Vec<Reservation>, target_id: Option<Uuid>) -> MarketResult<(StrategyEstimations, Option<DriverStrategyEstimations>)> {
        if pool.is_empty() { return Ok((strategy, None)) };
        let mut new_pool = pool;
        let next = new_pool.remove(0);

        if let Some(shortest) = strategy.shortest()? {
            let driver = shortest.strip_estimates()
                .add_reservation(next.clone());

            let mut strategy_new = strategy.strip_estimates();
            strategy_new.drivers.insert(driver.id, driver.clone());

            let estimated = self.calculate_strategy_estimate(id_event, strategy_new).await?;

            match target_id {
                Some(id) if next.id.eq(&id) => {
                    let driver = estimated.driver(&driver.id)?;
                    return Ok((estimated, Some(driver)));
                }
                _ => ()
            }
            
            let result = self.assign_reservations_to_strategy(id_event, estimated, new_pool, target_id).await?;
            Ok(result)
        } else {
            Ok((strategy, None))
        }
    }


    #[doc = "Get a pool of all the unaccepted reservations for an event"]
    pub async fn get_pool(&self, id_event: &Uuid) -> MarketResult<Vec<Reservation>> {
        let reservations = self.db.send(ReservationsInPool { id_event: *id_event }).await??.into_iter()
            .map(|res| res.into())
            .collect();
        Ok(reservations)
    }

    #[doc = "Get a cached event location's cordinates, if no cache, it will get the location from the db and set it in cache."]
    async fn get_property_location_cached(&self, id_event: &Uuid) -> MarketResult<LatLng> {
        if let Some(location) = self.cache.get_property_location(id_event)? {
            Ok(location)
        } else {
            if let Some(property) = &self.get_property(id_event).await? {
                let location = property.latlng();
                self.cache.set_property_location(id_event, location.clone())?;
                Ok(location)
            } else {
                Err(ErrorMarket::NoEventProperty)
            }
        }
    }

    #[doc = "Update a driver strategy for an event"]
    pub async fn update_driver_strategy(&self, id_event: &Uuid, id_driver: &IdEventDriver, update_fn: Box<dyn FnOnce(DriverStrategy) -> MarketResult<DriverStrategy> + Send>) -> MarketResult<DriverStrategyEstimations> {
        let driver_id_cloned = id_driver.clone();
        let strategy = self.update_strategy(id_event, Box::new(move |mut strategy| {
            let driver = strategy.drivers.get(&driver_id_cloned).ok_or(ErrorMarket::DriverNotFound)?;
            let driver_new = update_fn(driver.clone())?;
            strategy.drivers.insert(driver_id_cloned, driver_new);
            Ok(strategy)
        })).await?;
        let driver = strategy.driver(id_driver)?;
        Ok(driver)
    }

    async fn update_strategy(&self, id_event: &Uuid, update_fn: Box<dyn FnOnce(Strategy) -> MarketResult<Strategy> + Send>) -> MarketResult<StrategyEstimations> {
        let strategy = self.get_strategy_cached(id_event).await?;
        let new_strategy = update_fn(strategy)?;
        self.cache.set_strategy(id_event, new_strategy)?;
        self.get_estimates(id_event).await
    }

    pub async fn update_driver_location(&self, id_event: &Uuid, id_driver: &IdEventDriver, location: &LatLng) -> MarketResult<()> {
        let est = self.get_estimates(id_event).await?;
        let driver = est.driver(id_driver)?;
        let id_reservations = driver.get_sharing_location_with();
        
        self.cache.set_driver_location(id_driver, location)?;
        self.messanger.send_driver_location(id_event, id_driver, id_reservations, location).await?;
        Ok(())
    }

    #[doc = "Get whether or not the requested driver has reservation in their queue."]
    pub async fn is_driver_empty(&self, id_event: &Uuid, id_driver: &IdEventDriver) -> MarketResult<bool> {
        let est = self.get_estimates(id_event).await?;
        let driver = est.driver(id_driver)?;
        Ok(driver.is_empty())
    }

    #[doc = "Add a driver to the event"]
    pub async fn add_driver(&self, id_event: &Uuid, driver: &DriverWithVehicle) -> MarketResult<()> {
        let max_capacity = self.vehicle.get(&driver.id_vehicle).await?.capacity;
        let id_driver = driver.id;
        let id_event_cloned = id_event.clone();
        self.update_strategy(id_event, Box::new(move |mut strategy: Strategy| {
            strategy.drivers.insert(id_driver, DriverStrategy::new(id_driver, &id_event_cloned, max_capacity));
            Ok(strategy)
        })).await?;
        Ok(())
    }

    #[doc = "Remove a driver from the event"]
    pub async fn remove_driver(&self, id_event: &Uuid, driver: &Driver) -> MarketResult<()> {
        let id_driver = driver.id;
        self.cache.delete_driver_location(&id_driver)?;
        self.update_strategy(id_event, Box::new(move |mut strategy: Strategy| {
            strategy.drivers.remove(&id_driver);
            Ok(strategy)
        })).await?;
        Ok(())
    }
}

