use async_trait::async_trait;

use crate::graphql::{reservations::Reservation, users::User};
use super::types::MarketResult;

pub mod twilio;
pub mod mock;




#[async_trait]
pub trait Pusher: Send + Sync {
    fn box_clone(&self) -> Box<dyn Pusher>;

    async fn push(&self, reservation: &Reservation, message: &str, user: &User) -> MarketResult<()>;
}

impl dyn Pusher {
    pub async fn send_driver_arrival(&self, reservation: &Reservation, user: &User) -> MarketResult<()> {
        self.push(reservation, "Your driver has arrived!", user).await
    }

    pub async fn send_driver_accepted(&self, reservation: &Reservation, user: &User) -> MarketResult<()> {
        self.push(reservation, "Your driver is on the way!", user).await
    }
}

pub struct Pushers {
    pub app: Box<dyn Pusher>,
    pub web: Box<dyn Pusher>,
    pub mock: Box<dyn Pusher>,
}

impl Clone for Pushers {
    fn clone(&self) -> Self {
        Self {
            app: self.app.box_clone(),
            web: self.web.box_clone(),
            mock: self.mock.box_clone(),
        }
    }
}

impl Pushers {
    pub fn get(&self, reservation: &Reservation) -> Box<dyn Pusher> {
        if reservation.reserver.is_mock() { return self.mock.box_clone() }
        self.web.box_clone()
    }
}

