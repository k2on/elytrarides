use crate::market::{types::{MarketResult, StreamMessageMarket}, messages::MessageMarket};

use super::Messanger;
use async_trait::async_trait;
use juniper::FieldError;
use redis::{AsyncCommands, aio::Connection};
use futures::StreamExt;


#[derive(Debug, Clone)]
pub struct MessangerRedis;

impl MessangerRedis {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl Messanger for MessangerRedis {
    fn box_clone(&self) -> Box<dyn Messanger> {
        Box::new(self.clone())
    }

    async fn publish(&self, key: String, message: MessageMarket) -> MarketResult<()> {
        let mut pubsub = self.connection().await?;
        pubsub.publish(key, message.serialize()).await?;
        Ok(())
    }

    async fn subscribe(&self, key: String) -> MarketResult<StreamMessageMarket> {
        let mut pubsub = self.connection().await?.into_pubsub();
        pubsub.subscribe(key).await?;

        let stream = pubsub
            .into_on_message()
            .map(|m| {
                m.get_payload::<MessageMarket>()
                    .map_err(|e| FieldError::from(e))
            })
            .boxed();
        Ok(stream)
    }
}

impl MessangerRedis {
    async fn connection(&self) -> MarketResult<Connection> {
        let url = "redis://127.0.0.1:6379";
        let client = redis::Client::open(url).unwrap();
        let conn = client.get_async_connection().await?;
        Ok(conn)
    }
}


