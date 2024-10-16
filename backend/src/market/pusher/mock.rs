use crate::{market::types::MarketResult, graphql::{reservations::Reservation, users::User}};

use super::Pusher;
use async_trait::async_trait;
use log::debug;


#[derive(Debug, Clone)]
pub struct PusherMock;

impl PusherMock {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl Pusher for PusherMock {
    fn box_clone(&self) -> Box<dyn Pusher> {
        Box::new(self.clone())
    }

    async fn push(&self, reservation: &Reservation, message: &str, user: &User) -> MarketResult<()> {
        debug!("MOCK PUSHER: {}: {:?}", reservation.reserver, message);
        Ok(())
    }
}



