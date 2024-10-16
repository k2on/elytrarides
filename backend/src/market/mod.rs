pub mod messages;
pub mod error;
pub mod types;
pub mod util;
pub mod geocoder;
pub mod messanger;
pub mod pusher;
pub mod driver;
pub mod event;
pub mod vehicle;
pub mod reservation;
pub mod strategy;
pub mod estimate;

use actix::Addr;
use kv::Store;
use crate::{db_util::DBActor, sms::ClientTwilio};
use google_maps::prelude::GoogleMapsClient;

use self::{error::ErrorMarket, driver::MarketDriver, event::MarketEvent, vehicle::MarketVehicle, reservation::MarketReservation, geocoder::{Geocoder, google::GeocoderGoogle, mock::GeocoderMock}, messanger::{Messanger, redis::MessangerRedis, mock::MessangerMock}, pusher::{Pushers, mock::PusherMock, twilio::PusherTwilio}};


pub struct Market {
    pub kv: Store,
    pub is_mock: bool,
    pub sms: ClientTwilio,
    pub messanger: Box<dyn Messanger>,
    pub db: Addr<DBActor>,

    pub driver: MarketDriver,
    pub event: MarketEvent,
    pub vehicle: MarketVehicle,
    pub reservation: MarketReservation,
}


impl Clone for Market {
    fn clone(&self) -> Self {
        Market {
            kv: self.kv.clone(),
            is_mock: self.is_mock,
            db: self.db.clone(),
            sms: self.sms.clone(),
            messanger: self.messanger.box_clone(),
            driver: self.driver.clone(),
            event: self.event.clone(),
            vehicle: self.vehicle.clone(),
            reservation: self.reservation.clone(),
        }
    }
}

impl Market {
    pub fn new(db: Addr<DBActor>, kv: Store, maps: GoogleMapsClient, sms: ClientTwilio) -> Self {
        let geocoder: Box<dyn Geocoder> = Box::new(GeocoderGoogle::new(maps.clone()));
        let messanger: Box<dyn Messanger> = Box::new(MessangerRedis::new());
        let pushers = Pushers {
            web: Box::new(PusherTwilio::new(sms.clone())),
            app: Box::new(PusherMock::new()),
            mock: Box::new(PusherMock::new()),
        };
        Market::make(geocoder, messanger, db, kv, sms, false, pushers)
    }

    pub fn mock(db: Addr<DBActor>, kv: Store) -> Self {
        let geocoder: Box<dyn Geocoder> = Box::new(GeocoderMock::new());
        let sms = ClientTwilio::new("", "");
        let messanger: Box<dyn Messanger> = Box::new(MessangerMock::new());
        let pushers = Pushers {
            web: Box::new(PusherMock::new()),
            app: Box::new(PusherMock::new()),
            mock: Box::new(PusherMock::new()),
        };
        Market::make(geocoder, messanger, db, kv, sms, true, pushers)
    }

    fn make(geocoder: Box<dyn Geocoder>, messanger: Box<dyn Messanger>, db: Addr<DBActor>, kv: Store, sms: ClientTwilio, is_mock: bool, pushers: Pushers) -> Self {
        let vehicle = MarketVehicle::new(db.clone());
        let event = MarketEvent::new(db.clone(), geocoder.box_clone(), messanger.box_clone(), kv.clone(), vehicle.clone());
        Self {
            driver: MarketDriver::new(db.clone(), kv.clone(), messanger.box_clone(), event.clone(), pushers),
            event: event.clone(),
            vehicle,
            reservation: MarketReservation::new(db.clone(), geocoder, messanger.box_clone(), event),
            messanger,
            kv,
            db,
            is_mock,
            sms,
        }
    }

    pub fn clear_cache(&self) -> Result<(), ErrorMarket> {
        self.event.clear_cache()?;
        Ok(())
    }
}


