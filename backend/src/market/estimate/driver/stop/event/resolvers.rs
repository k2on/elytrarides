use juniper::graphql_object;

use super::model::DriverStopEstimationEvent;

#[graphql_object()]
impl DriverStopEstimationEvent {
    fn arrival(&self) -> i32 {
        self.arrival.num_seconds() as i32
    }
}

