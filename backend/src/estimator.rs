use std::sync::Arc;
use actix::prelude::*;
use chrono::Duration;
use tokio::spawn;
use log::{info, error};

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

            let strategy = market.event.refresh_estimates(&id_event).await?;

            if strategy.drivers.is_empty() {
                info!("Event has no drivers")
            }

            for (_id_driver, driver_strat) in strategy.drivers {
                let mut reservations: Vec<DriverStopEstimationReservation> = driver_strat.queue
                    .iter()
                    .filter_map(|stop| if let DriverStopEstimation::Reservation(res) = stop { Some(res.clone()) } else { None })
                    .collect();

                let arrival_time = match driver_strat.dest {
                    Some(DriverStopEstimation::Reservation(dest)) => {
                        reservations.insert(0, dest.clone());
                        Some(dest.arrival)
                    }
                    Some(DriverStopEstimation::Event(event)) => Some(event.arrival),
                    _ => None
                };

                if let Some(arrival) = arrival_time {
                    for (id, _) in &driver_strat.picked_up {
                        market.messanger.send_reservation_estimate(id, Duration::seconds(0), arrival, 0).await?;
                    }
                }

                for (idx, reservation) in reservations.iter().enumerate() {
                    market.messanger.send_reservation_estimate(&reservation.id_reservation, reservation.pickup, reservation.arrival, idx as i32).await?;
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

