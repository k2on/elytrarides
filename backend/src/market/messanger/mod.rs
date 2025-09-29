use async_trait::async_trait;
use chrono::Duration;
use uuid::Uuid;

use crate::graphql::{reservations::Reservation, geo::model::LatLng};

use super::{types::{MarketResult, StreamMessageMarket}, messages::MessageMarket, strategy::model::IdEventDriver};
pub mod redis;
pub mod mock;




#[async_trait]
pub trait Messanger: Send + Sync {
    fn box_clone(&self) -> Box<dyn Messanger>;

    async fn publish(&self, key: String, message: MessageMarket) -> MarketResult<()>;

    async fn subscribe(&self, key: String) -> MarketResult<StreamMessageMarket>;
}

impl dyn Messanger {
    pub async fn send_reservation_update(&self, reservation: Reservation) -> MarketResult<()> {
        let message = MessageMarket::new_reservation_update(reservation.clone());
        self.send_reservation(&reservation.id, message.clone()).await?;
        self.send_event(&reservation.id_event, message).await?;
        Ok(())
    }

    pub async fn send_reservation_estimate(&self, id_reservation: &Uuid, pickup: Duration, arrival: Duration, queue_position: i32) -> MarketResult<()> {
        let message = MessageMarket::new_reservation_estimate(pickup, arrival, queue_position);
        self.send_reservation(id_reservation, message.clone()).await?;
        Ok(())
    }

    pub async fn send_driver_location(&self, id_event: &Uuid, id_driver: &IdEventDriver, id_reservations: Vec<Uuid>, location: &LatLng) -> MarketResult<()> {
        let message = MessageMarket::new_driver_location(*id_driver, location.clone());
        for id in id_reservations { // TODO: make this into an iter
            self.send_reservation(&id, message.clone()).await?;
        }
        self.send_event(id_event, message).await
    }

    async fn send_reservation(&self, id_reservation: &Uuid, message: MessageMarket) -> MarketResult<()> {
        self.publish(format!("res:{}", id_reservation), message).await
    }

    async fn send_event(&self, id_event: &Uuid, message: MessageMarket) -> MarketResult<()> {
        self.publish(format!("event:{}", id_event), message).await
    }
}


