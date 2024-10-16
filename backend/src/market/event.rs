use std::{collections::HashMap, str::FromStr};

use actix::Addr;
use chrono::Duration;
use kv::Store;
use uuid::Uuid;

use crate::{db_util::DBActor, graphql::{reservations::{messages::{ReservationsInPool, ReservationRemoveDriver, ReservationGet, ReservationGetWithoutStops}, FormReservation, Reservation, DBReservation, stops::model::{ReservationStops, FormReservationStop, FormLatLng, FormReservationStopLocation, ReservationInputStop}, ReservationStatus, ReservationInput, ReservationWithStops, AvaliableReservation}, geo::model::LatLng, locations::OrgLocation, events::{messages::{EventLocationGet, GetActiveEvents, EventGet}, Event}, drivers::{Driver, messages::EventDriversList, DriverWithVehicle}, colleges::model::College}, market::util::now, types::phone::Phone};

use self::cache::MarketEventCache;

use super::{types::{MarketResult, ReservationEstimate, TimeEstimate}, error::ErrorMarket, vehicle::MarketVehicle, geocoder::Geocoder, messanger::Messanger, util::add_reservation_arrivals_to_queue, strategy::{driver::{stop::{model::DriverStop, reservation::location::model::Address}, model::DriverStrategy}, model::{Strategy, IdEventDriver}}, estimate::{model::StrategyEstimations, driver::{model::DriverStrategyEstimations, stop::model::DriverStopEstimation}}};

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

type DriverPairScore = f64;

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
            .unwrap_or(0);

        let queue = self.get_driver_queue_estimates(id_event, driver_strategy, dest_est).await?;

        let dest = driver_strategy.dest.clone().map(|d| d.to_est(dest_est));
        let estimated = DriverStrategyEstimations::new(driver_strategy.clone(), dest, queue);
        Ok(estimated)
    }

    #[doc = "Get estimations for a driver queue"]
    async fn get_driver_queue_estimates(&self, id_event: &Uuid, driver_strategy: &DriverStrategy, dest_est: i32) -> MarketResult<Vec<DriverStopEstimation>> {
        let queue_pickups = self.get_driver_queue_estimates_without_res_arrivals(id_event, driver_strategy, dest_est).await?;
        let queue = add_reservation_arrivals_to_queue(queue_pickups);
        Ok(queue)

    }

    #[doc = "Get the estimations for a queue without the reservation arrival times"]
    async fn get_driver_queue_estimates_without_res_arrivals(&self, id_event: &Uuid, driver_strategy: &DriverStrategy, dest_est: i32) -> MarketResult<Vec<DriverStopEstimation>> {
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
                    queue.push(stop.to_est(last_est));
                },
                None => (),
            }
            last_stop = Some(stop.clone());
        }
        Ok(queue)
    }

    #[doc = "Get stop estimation"]
    async fn get_stop_estimation(&self, id_event: &Uuid, from: &DriverStop, to: &DriverStop) -> MarketResult<i32> {
        match self.cache.get_estimate_between_stops(id_event, from, to)? {
            Some(est) => Ok(est),
            None => self.refresh_and_get_stop_estimate(id_event, from, to).await,
        }
    }

    #[doc = "Gets the driver estimation to their destination, if none exists, will calculate and store it in cache."]
    async fn get_estimate_driver_cached(&self, id_event: &Uuid, driver_strategy: &DriverStrategy) -> MarketResult<Option<i32>> {
        if let Some(_) = &driver_strategy.dest {
            match self.cache.get_estimate_driver(id_event, &driver_strategy)? {
                Some(est) => Ok(Some(est)),
                None => Ok(Some(self.refresh_and_get_driver_estimate(id_event, driver_strategy).await?)),
            }
        } else {
            Ok(None)
        }
    }

    async fn refresh_and_get_driver_estimate(&self, id_event: &Uuid, driver_strategy: &DriverStrategy) -> MarketResult<i32> {
        println!("refresh driver");
        let driver_location = self.cache.get_driver_location(&driver_strategy.id)?;
        match (&driver_strategy.dest, driver_location) {
            (Some(dest), Some(location)) => {
                let est = self.geocoder.estimate(location, dest.latlng()).await?.num_seconds() as i32;
                self.cache.update_estimate_driver(id_event, &driver_strategy, est.clone())?;
                Ok(est)
            },
            (_, None) => Err(ErrorMarket::NoDriverLocation),
            (None, _) => Err(ErrorMarket::NoDest)
        }
    }

    async fn refresh_and_get_stop_estimate(&self, id_event: &Uuid, stop_from: &DriverStop, stop_to: &DriverStop) -> MarketResult<i32> {
        // println!("refresh stop");
        let est = self.geocoder.estimate(stop_from.latlng(), stop_to.latlng()).await?.num_seconds() as i32;
        self.cache.update_estimate_stop(id_event, stop_from, stop_to, est)?;
        Ok(est)
    }

    #[doc = "Get an avaliable reservation for an event and driver"]
    pub async fn get_avaliable_reservation(&self, id_event: &Uuid, id_driver: &IdEventDriver) -> MarketResult<Option<AvaliableReservation>> {
        let driver = self
            .get_estimates_with_pool(id_event).await?
            .driver(id_driver)?;
        match &driver.dest {
            Some(dest) => {
                let id_reservation = dest.stop.id_reservation;
                let mut stops_for_res: Vec<DriverStopEstimation> = driver.queue.iter()
                    .filter(|stop| stop.stop.id_reservation.eq(&id_reservation))
                    .cloned()
                    .collect();

                stops_for_res.insert(0, dest.clone());

                let reservation = self.db.send(ReservationGetWithoutStops { id: id_reservation }).await??;

                Ok(Some(AvaliableReservation {
                    reservation,
                    stops: stops_for_res,
                }))
            }
            None => Ok(None)
        }
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
                    self.db.send(ReservationRemoveDriver { id: reservation.id.to_owned() }).await??;
                    let reservation = self.db.send(ReservationGet { id: reservation.id }).await??;

                    self.get_estimate_reservation(&reservation).await
                }
                Err(err) => Err(err),
            }
        } else {
            Ok(self.get_no_drivers_estimation(reservation)) // FIXME: THIS WILL ONLY RETURN 2 STOP ETAS
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

        let input = self.process_reserveration_input(id_event, form).await?;
        let reservation = input.to_reservation(id_event, &id_temp, Phone::new("+10000000000").unwrap());

        pool.push(reservation.clone());

        let (_, driver) = self.assign_reservations_to_strategy(&id_event, strategy, pool, Some(id_temp)).await?;
        if let Some(driver) = driver {
            println!("{:#?}", driver);
            let est = driver.estimate_reservation(&reservation)?;
            Ok(est)
        } else {
            Ok(self.get_no_drivers_estimation(&reservation))
        }
    }

    #[doc = "Estimate the pickup time of reservation about to be created"]
    pub async fn get_estimate_reservation_preinsert(&self, id_event: &Uuid, id_reservation: &Uuid, input: &ReservationInput) -> MarketResult<ReservationEstimate> {
        let strategy = self.get_estimates(&id_event).await?;
        let mut pool = self.get_pool(&id_event).await?;

        let reservation = input.to_reservation(id_event, id_reservation, Phone::new("+10000000000").unwrap());

        pool.push(reservation.clone());

        let (_, driver) = self.assign_reservations_to_strategy(&id_event, strategy, pool, Some(*id_reservation)).await?;
        if let Some(driver) = driver {
            let est = driver.estimate_reservation(&reservation)?;
            Ok(est)
        } else {
            Ok(self.get_no_drivers_estimation(&reservation))
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
            stops: vec![
                FormReservationStop {
                    id: Uuid::from_str("32420f81-2690-4e48-a32f-4f8f256af199").unwrap(),
                    stop_order: 0,
                    location: Some(FormReservationStopLocation {
                        location: college.latlng_form(),
                        place_id: None,
                        address: String::from("Campus")
                    })
                },
                FormReservationStop {
                    id: Uuid::from_str("cd2163e4-f630-40d9-b596-216866a0fc25").unwrap(),
                    stop_order: 1,
                    location: None,
                },
            ]
        };
        let input = self.process_reserveration_input(id_event, &form_raw).await?;
        let reservation = input.to_reservation(&id, id_event, Phone::new("+10000000000").unwrap());

        pool.push(reservation.clone());

        let (_, driver) = self.assign_reservations_to_strategy(&id_event, strategy, pool, Some(id)).await?;
        if let Some(driver) = driver {
            let est = driver.estimate_reservation(&reservation)?;
            Ok(est)
        } else {
            Ok(self.get_no_drivers_estimation(&reservation))
        }
    }


    #[doc = "Get an estimation for an event with no drivers"]
    fn get_no_drivers_estimation(&self, reservation: &Reservation) -> ReservationEstimate {
        ReservationEstimate {
            stop_etas: vec![
                DriverStopEstimation {
                    stop: reservation.get_driver_stop(0),
                    eta: 7,
                },
                DriverStopEstimation {
                    stop: reservation.get_driver_stop(1),
                    eta: 14,
                },
            ],
            queue_position: 0,
        }
    }

    #[async_recursion::async_recursion]
    async fn assign_reservations_to_strategy(&self, id_event: &Uuid, strategy: StrategyEstimations, pool: Vec<Reservation>, target_id: Option<Uuid>) -> MarketResult<(StrategyEstimations, Option<DriverStrategyEstimations>)> {
        if pool.is_empty() { return Ok((strategy, None)) };
        let mut new_pool = pool.clone();

        if let Some((driver, reservation)) = self.get_driver_rider_pair(strategy.clone(), pool).await? {

            let pool_idx = new_pool.iter().enumerate().find_map(|(idx, res)| if res.id.eq(&reservation.id) { Some(idx) } else { None }).unwrap();
            new_pool.remove(pool_idx);

            let new_driver = driver.add_reservation(reservation.clone());

            let mut strategy_new = strategy.strip_estimates();
            strategy_new.drivers.insert(driver.id, new_driver.clone());

            let estimated = self.calculate_strategy_estimate(id_event, strategy_new).await?;

            match target_id {
                Some(id) if reservation.id.eq(&id) => {
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

    async fn get_driver_rider_pair(&self, strategy: StrategyEstimations, pool: Vec<Reservation>) -> MarketResult<Option<(DriverStrategy, Reservation)>> {
        let epsilon = 1e-9;

        let mut scores: Vec<(DriverPairScore, IdEventDriver, Uuid)> = Vec::new();
        for (id, driver) in &strategy.drivers {
            for reservation in &pool {
                let score = self.get_driver_pair_score(&strategy, driver, reservation).await?;
                scores.push((score, *id, reservation.id));
            }
        }
        scores.sort_by(|(a, _, _), (b, _, _)| if (a - b).abs() < epsilon {
            std::cmp::Ordering::Equal
        } else if a < b {
            std::cmp::Ordering::Greater
        } else {
            std::cmp::Ordering::Less
        });
        println!("Scores:");
        for (score, id_driver, id_reservation) in &scores {
            let res = &pool.iter().find(|res| res.id.eq(&id_reservation)).unwrap().stops.first().unwrap().address_main;
            println!("{} {} {} ({})", score, id_driver, res, id_reservation);

        }
        println!("");
        let (_, id_driver, id_reservation) = scores.remove(0);
        let driver = strategy.driver(&id_driver)?.strip_estimates();
        let reservation = pool.iter().find(|res| res.id.eq(&id_reservation)).unwrap();
        Ok(Some((driver, reservation.clone())))
    }

    async fn get_driver_pair_score(&self, strategy: &StrategyEstimations, driver: &DriverStrategyEstimations, reservation: &Reservation) -> MarketResult<DriverPairScore> {

        let driver_location = self.cache.get_driver_location(&driver.id)?.ok_or(ErrorMarket::NoDriverLocation)?;
        let first_stop_location = reservation.stops.first().ok_or(ErrorMarket::InvalidStopTooFew)?.latlng();

        let distance =  driver_location.distance(first_stop_location);

        let current_time = now();
        let driver_availability_timestamp = current_time + driver.duration();
        let time_difference = (reservation.made_at as i64 - driver_availability_timestamp as i64).abs() as u64;

        let waiting_time = current_time.saturating_sub(reservation.made_at);

        // Constants for maximum scores
        let max_time_difference_score = 50.0;
        let max_waiting_time_score = 50.0;

        let time_difference_score = max_time_difference_score - time_difference as f64;
        let waiting_time_score = (max_waiting_time_score * (1.0 + waiting_time as f64).ln() / 2f64.ln()).min(max_waiting_time_score);

        let score = time_difference_score.max(0.0) + waiting_time_score + driver.id as f64;

        Ok(score as f64)
    }
    

    #[doc = "Get a pool of all the unaccepted reservations for an event"]
    pub async fn get_pool(&self, id_event: &Uuid) -> MarketResult<Vec<Reservation>> {
        let reservations = self.db.send(ReservationsInPool { id_event: *id_event }).await??;
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

    #[doc = "Convert a form reservation into a reservation input. This will geocode all the place ids, or get the event location."]
    pub async fn process_reserveration_input(&self, id_event: &Uuid, input: &FormReservation) -> MarketResult<ReservationInput> {
        match (input.stops.first(), input.stops.last()) {
            (Some(first), Some(last)) if first.id.eq(&last.id) => Err(ErrorMarket::InvalidStopTooFew)?,
            (Some(first), Some(last)) => {
                let property_opt = self.get_property(id_event).await?;

                let mut stops = Vec::new();
                let mut is_event_used = false;

                for stop in &input.stops {
                    let stop = match (&stop.location, &property_opt, is_event_used) {
                        (Some(location), _, _) => self.process_reservation_stop_location(id_event, stop.clone(), location).await?,
                        (None, Some(property), false) if stop.id.eq(&first.id) || stop.id.eq(&last.id) => {
                            is_event_used = true;
                            self.process_reservation_stop_event(id_event, &stop, property).await?
                        },
                        (None, Some(_), true) => Err(ErrorMarket::InvalidStopEventStopAlreadyUsed)?,
                        (None, Some(_), false) => Err(ErrorMarket::InvalidStopInvalidEventLocation)?,
                        (None, None, _) => Err(ErrorMarket::InvalidStopEventUsedForEventWithoutProperty)?
                    };
                    stops.push(stop)
                }

                let result = ReservationInput {
                    passenger_count: input.passenger_count,
                    stops, 
                };
                Ok(result)
            },
            _ => Err(ErrorMarket::InvalidStopTooFew)?,
        }
    }

    async fn process_reservation_stop_location(&self, _id_event: &Uuid, stop: FormReservationStop, location: &FormReservationStopLocation) -> MarketResult<ReservationInputStop> {
        let address = self.geocoder.geocode_location(&location).await;
        Ok(ReservationInputStop {
            id: stop.id,
            stop_order: stop.stop_order,
            is_event_location: false,
            lat: location.location.lat,
            lng: location.location.lng,
            lat_address: location.location.lat,
            lng_address: location.location.lng,
            address_main: address.main,
            address_sub: address.sub,
            place_id: location.place_id.clone(),
        })
    }

    async fn process_reservation_stop_event(&self, id_event: &Uuid, stop: &FormReservationStop, property: &OrgLocation) -> MarketResult<ReservationInputStop> {
        let location = self
            .get_property_location_cached(id_event).await?;

        Ok(ReservationInputStop {
            id: stop.id,
            stop_order: stop.stop_order,
            is_event_location: true,
            lat: location.lat,
            lng: location.lng,
            lat_address: location.lat,
            lng_address: location.lng,
            address_main: property.label.clone(),
            address_sub: String::from(""),
            place_id: None,
        })
    }
}

