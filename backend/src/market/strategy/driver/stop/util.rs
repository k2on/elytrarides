use super::model::DriverStop;

pub fn normalize_stops(from: DriverStop, to: DriverStop) -> (DriverStop, DriverStop) {
    match (&from, &to) {
        (DriverStop::Event(_), DriverStop::Reservation(_)) => (from, to),
        (DriverStop::Reservation(_), DriverStop::Event(_)) => (to, from),
        (DriverStop::Reservation(res_from), DriverStop::Reservation(res_to)) => {
            if res_from.id_reservation > res_to.id_reservation {
                (to, from)
            } else {
                (from, to)
            }
        }
        (DriverStop::Event(_), DriverStop::Event(_)) => unreachable!(),
    }
}

