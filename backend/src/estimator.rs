use std::{sync::Arc, collections::HashMap};
use actix::prelude::*;
use chrono::Duration;
use tokio::spawn;
use log::{info, error};
use uuid::Uuid;

use crate::market::{Market, error::ErrorMarket, estimate::driver::stop::{reservation::model::DriverStopEstimationReservation, model::DriverStopEstimation}};

pub struct Estimator {
    market: Arc<Market>
}

impl Estimator {
    pub fn new(market: Arc<Market>) -> Addr<Self> {
        let actor = Estimator { market };
        actor.start()
    }

    async fn task(market: Arc<Market>) -> Result<(), ErrorMarket> {
        info!("Updating estimations");

        let events = market.event.list_active().await?;
        if events.is_empty() {
            info!("No active events");
            return Ok(())
        }

        for event in events {
            let id_event = event.id;
            info!("Updating event: {}", id_event);

            // We want to update every reservation created for the event

            let strategy = market.event.refresh_estimates(&id_event).await?;

            if strategy.drivers.is_empty() {
                info!("Event has no drivers")
            }

            for (_id_driver, driver_strat) in strategy.drivers {
                let stop_etas: Vec<DriverStopEstimation> = driver_strat.queue.iter().cloned().collect();

                let mut reservations: HashMap<Uuid, Vec<DriverStopEstimation>> = HashMap::new();
                for stop in stop_etas {
                    if let Some(stops) = reservations.get(&stop.stop.id_reservation) {
                        let mut new_stops = stops.clone();
                        new_stops.push(stop.clone());
                        reservations.insert(stop.stop.id_reservation, new_stops);
                    } else {
                        reservations.insert(stop.stop.id_reservation, vec![stop]);
                    }
                }

                for (idx, (id, etas)) in reservations.iter().enumerate() {
                    market.messanger.send_reservation_estimate(&id, etas.clone(), idx as i32).await?;
                }

            }

        }
        Ok(())
    }

    fn start_interval(&self, ctx: &mut Context<Self>) {
        let market = self.market.clone();

        ctx.run_interval(std::time::Duration::from_secs(60), move |_act, _ctx| {
            let market = market.clone();
            spawn(async move {
                match Self::task(market).await {
                    Ok(_) => (),
                    Err(e) => {
                        error!("Error updating estimations, {e:?}");
                    }
                }
            });
        });
    }
}

impl Actor for Estimator {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.start_interval(ctx);
    }
}

