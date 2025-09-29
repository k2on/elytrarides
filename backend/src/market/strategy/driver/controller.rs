use std::collections::HashMap;

use uuid::Uuid;

use crate::{market::{strategy::model::IdEventDriver, types::MarketResult, error::ErrorMarket}, graphql::reservations::Reservation};

use super::{model::DriverStrategy, stop::{event::model::DriverStopEvent, model::DriverStop, reservation::{location::model::DriverStopLocation, model::DriverStopReservation}}};

impl DriverStrategy {
    pub fn new(id: IdEventDriver, id_event: &Uuid, max_capacity: i32) -> Self {
        Self {
            id,
            id_event: *id_event,
            dest: None,
            queue: Vec::new(),
            picked_up: HashMap::new(),
            max_capacity,
        }
    }

    fn passengers(&self) -> i32 {
        self.picked_up.values().sum()
    }

    pub fn can_fit(&self, passengers: i32) -> bool {
        self.passengers() + passengers <= self.max_capacity
    }

    #[doc = "Add a reservation to the strategy"]
    pub fn add_reservation(&self, reservation: Reservation) -> DriverStrategy {
        let mut new_driver = self.clone();
        if reservation.is_dropoff {
            let stop = DriverStop::Event(DriverStopEvent::new());
            match (&new_driver.dest, new_driver.queue.last()) {
                (None, _) => {
                    new_driver.dest = Some(stop);
                },
                (_, Some(DriverStop::Event(_))) => (),
                (_, _) => {
                    new_driver.queue.push(stop)
                }
            }

            let idx_after_first_free_event = new_driver.idx_after_first_free_event();
            reservation.stops.get_stops()
                .iter()
                .enumerate()
                .for_each(|(idx, stop)| new_driver.queue.insert((idx_after_first_free_event + idx as i32 + 1) as usize, DriverStop::Reservation(DriverStopReservation {
                    location: DriverStopLocation {
                        coords: stop.latlng(),
                        address: stop.address.clone(),
                        place_id: stop.place_id.clone(),
                    },
                    id_reservation: reservation.id,
                    is_dropoff: true,
                    order: idx.try_into().unwrap(),
                    passengers: reservation.passenger_count,
                })))
        } else {
            let first_stop = reservation.stops.get_stops().first().expect("Reservation must have a stop");
            let stop = DriverStop::Reservation(DriverStopReservation {
                location: DriverStopLocation {
                    coords: first_stop.latlng(),
                    address: first_stop.address.clone(),
                    place_id: first_stop.place_id.clone(),
                },
                id_reservation: reservation.id.to_owned(),
                is_dropoff: false,
                order: 0,
                passengers: reservation.passenger_count,
            });
            if let None = new_driver.dest {
                new_driver.dest = Some(stop);
            } else {
                new_driver.queue.push(stop);
            }
            new_driver.queue.push(DriverStop::Event(DriverStopEvent::new()));
        };
        new_driver
    }

    #[doc = "Return the index of an event that does not have an dropoff reservation after it"]
    fn idx_after_first_free_event(&self) -> i32 {
        match (&self.dest, self.queue.first()) {
            (Some(DriverStop::Event(_)), None) => return -1,
            _ => ()
        }
        for (idx, stop) in self.queue.iter().enumerate() {
            match (stop, self.queue.get(idx + 1)) {
                (DriverStop::Event(_), Some(DriverStop::Reservation(res))) if !res.is_dropoff => return idx as i32,
                (DriverStop::Event(_), None) => return idx as i32,
                _ => ()
            }
        }
        panic!("No event in queue")
    }

    #[doc = "Confirm the pickup of a reservation"]
    pub fn pickup(&self) -> MarketResult<Self> { // TODO: make this idempotent
        match (&self.dest, self.queue.first()) {
            (None, _) => Err(ErrorMarket::NoDest),
            (Some(DriverStop::Reservation(res)), _) if !res.is_dropoff => self.pickup_reservation_pickup(),
            (Some(DriverStop::Event(_)), Some(DriverStop::Reservation(res))) if res.is_dropoff => self.pickup_reservation_dropoff(),
            _ => unreachable!("Invalid state")
        }
    }

    #[doc = "Confirm the dropoff of a reservation"]
    pub fn dropoff(&self) -> MarketResult<Self> { // TODO: make this idempotent
        match &self.dest {
            None => Err(ErrorMarket::NoDest),
            Some(DriverStop::Event(_)) => self.dropoff_pickup_reservations(),
            Some(DriverStop::Reservation(_)) => self.dropoff_dropoff_reservation_stop(),
        }
    }

    #[doc = "Dropoff a dropoff reservation stop"]
    fn dropoff_dropoff_reservation_stop(&self) -> MarketResult<Self> {
        let mut new_strategy = self.clone();
        if new_strategy.queue.len() > 0 {
            let next = new_strategy.queue.remove(0);
            new_strategy.dest = Some(next.clone());
            match (&new_strategy.dest, next) {
                (Some(DriverStop::Reservation(res)), DriverStop::Reservation(res_next)) if !res_next.id_reservation.eq(&res.id_reservation) => {
                    new_strategy.picked_up.remove(&res.id_reservation);
                }
                _ => ()
            }
        } else {
            new_strategy.dest = None;
            new_strategy.reset_picked_up();
        };

        Ok(new_strategy)
    }

    #[doc = "Confirm the dropoff of pickup reservations"]
    fn dropoff_pickup_reservations(&self) -> MarketResult<Self> {
        let mut new_strategy = self.clone();
        new_strategy.dest = None;
        new_strategy.reset_picked_up();
        Ok(new_strategy)
    }

    #[doc = "Reset the picked up reservations"]
    fn reset_picked_up(&mut self) {
        self.picked_up = HashMap::new()
    }

    #[doc = "Confirm the pickup of a pickup reservation"]
    fn pickup_reservation_pickup(&self) -> MarketResult<Self> {
        let dest = self.dest.clone()
            .and_then(|dest| if let DriverStop::Reservation(res) = dest { Some(res) } else { None })
            .expect("Cannot call pickup reservation pickup on a non pickup reservation");
        let mut new_strategy = self.clone();
        new_strategy.picked_up.insert(dest.id_reservation, dest.passengers);
        let new_dest = new_strategy.queue.remove(0);
        new_strategy.dest = Some(new_dest);
        Ok(new_strategy)
    }

    #[doc = "Confirm the pickup of a dropoff reservation"]
    fn pickup_reservation_dropoff(&self) -> MarketResult<Self> {
        let mut new_strategy = self.clone();
        let new_dest = if let DriverStop::Reservation(res) = new_strategy.queue.remove(0) { Some(res) } else { None }
            .expect("first element in queue should be reservation");
        new_strategy.dest = Some(DriverStop::Reservation(new_dest.clone()));
        new_strategy.picked_up.insert(new_dest.id_reservation, new_dest.passengers);
        Ok(new_strategy)
    }
}

