import { Event, GetAdminEventQuery } from "@/shared";
import { AdminEvent, AdminState, Driver, DriverStrat, Reservation, ReservationStatus, Strategy, StrategyDriver } from "./types";
import { ANY } from "./all/columns";


export function makeInitialState(id: string): AdminState {
    return {
        id,
        strategy: null,
        event: null,
        mapCenter: null,
        filter: {
            driver: ANY,
            status: ANY,
            reserver: null,
        },
        focusedReservation: null,
        tab: "drivers"
    }
}


export function initStrategy(event: AdminEvent): Strategy {
    const drivers = event.strategy.drivers.sort((a, b) => {
      return a.driver.id - b.driver.id;
    });
    return { drivers: drivers.map(initDriver) };
}

function initDriver(driver: DriverStrat): StrategyDriver {
    return {
        driver: driver.driver,
        dest: driver.dest,
        queue: driver.queue,
    };
}

export function getDriverColor(idx: number): string {
    const colors = [
        "#00f",
        "#0f0",
        "#f00",
        "#f0f",
        "#ff0",
    ];
    const color = colors[idx];
    return color || "#fff";
}

export function formatTime(d: Date): string {
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();

    return `${hours}:${minutesStr} ${ampm}`;
}

export function getReservationStatus(res: Reservation, strategy: Strategy | null): ReservationStatus {
    const isReservationActive = (id: string) => strategy?.drivers.some(d => {
        if (d.dest?.__typename == "DriverStopEstimationReservation") {
            if (d.dest.idReservation == id) return true;
        }
        for (const stop of d.queue) {
            if (stop.__typename == "DriverStopEstimationReservation") {
                if (stop.idReservation == id) return true;
            }
        }
        return false;
    }) || false;

    return res.isCancelled
            ? ReservationStatus.CANCELLED
            : res.isComplete
            ? ReservationStatus.COMPLETE
            : res.isCollected || isReservationActive(res.id)
            ? ReservationStatus.ACTIVE
            : ReservationStatus.WAITING

}

export function isEventActive(event: Pick<Event, "timeStart" | "timeEnd">): boolean {
    const now = new Date().getTime() / 1000;
    return event.timeStart < now && now < event.timeEnd;
}

export function isEventEnded(event: Pick<Event, "timeEnd">): boolean {
    const now = new Date().getTime() / 1000;
    return event.timeEnd < now;
}
