use crate::market::{types::{MarketResult, StreamMessageMarket}, messages::MessageMarket};

use super::Messanger;
use async_trait::async_trait;
use log::debug;


#[derive(Debug, Clone)]
pub struct MessangerMock;

impl MessangerMock {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl Messanger for MessangerMock {
    fn box_clone(&self) -> Box<dyn Messanger> {
        Box::new(self.clone())
    }

    async fn publish(&self, key: String, message: MessageMarket) -> MarketResult<()> {
        debug!("MOCK MESSENGER: {key}: {message:?}");
        Ok(())
    }

    async fn subscribe(&self, _key: String) -> MarketResult<StreamMessageMarket> {
        todo!()
    }
}


