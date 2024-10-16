use async_trait::async_trait;

use crate::{market::types::MarketResult, graphql::{reservations::Reservation, users::User}, sms::ClientTwilio};

use super::Pusher;

#[derive(Debug, Clone)]
pub struct PusherTwilio {
    client: ClientTwilio,
}

impl PusherTwilio {
    pub fn new(client: ClientTwilio) -> Self {
        Self { client }
    }
}

#[async_trait]
impl Pusher for PusherTwilio {
    fn box_clone(&self) -> Box<dyn Pusher> {
        Box::new(self.clone())
    }

    async fn push(&self, reservation: &Reservation, message: &str, user: &User) -> MarketResult<()> {
        match user.is_opted_in_sms {
            Some(true) => {
                self.client.post_message(&reservation.reserver, &format!("Elytra Rides: {message}")).await?;
                Ok(())
            }
            _ => Ok(())
        }
    }
}


