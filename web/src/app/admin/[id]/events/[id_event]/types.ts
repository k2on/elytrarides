import { GetAdminEventQuery, LatLng } from "@/shared";
import { ReservationFilter } from "./all/columns";

export interface AdminState {
    id: string;
    strategy: Strategy | null;
    event: AdminEvent | null
    mapCenter: LatLng | null;
    filter: ReservationFilter;
    focusedReservation: string | null;
    tab: "drivers" | "reservations";
}

export type AdminEvent = GetAdminEventQuery["events"]["get"];

export interface Strategy {
    drivers: StrategyDriver[]
}

export interface StrategyDriver {
    ping?: DriverPing;
    driver: DriverStrat["driver"];
    dest: DriverStrat["dest"];
    queue: DriverStrat["queue"];
}

export type Driver = AdminEvent["drivers"][0];

export type Reservation = AdminEvent["reservations"][0];
export type DriverStrat = AdminEvent["strategy"]["drivers"][0];
type DriverStop = StrategyDriver["queue"][0];

type ExtractType<T, U> = T extends { __typename: U } ? T : never;

type DriverStopLocation = ExtractType<DriverStop, "DriverStopEstimationReservation">;
type DriverStopEvent = ExtractType<DriverStop, "DriverStopEstimationEvent">;

interface DriverPing {
    location: LatLng;
    time: Date;
}

export enum ReservationStatus {
    WAITING,
    ACTIVE,
    COMPLETE,
    CANCELLED,
}
