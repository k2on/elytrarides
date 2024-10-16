use super::model::DriverStop;

pub fn normalize_stops(from: DriverStop, to: DriverStop) -> (DriverStop, DriverStop) {
    if from.id_reservation > to.id_reservation {
        (to, from)
    } else {
        (from, to)
    }
}

