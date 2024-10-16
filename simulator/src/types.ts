import { DriverPingMutation, GetAdminEventQuery, LatLng } from "./generated";

export interface Simulation {
    url: string;
    idEvent: string;
    adminToken: string;
    event: GetAdminEventQuery["events"]["get"];
    driverSpeed: number;
}

export interface Driver {
    token: string;
    idDriver: number;
}

export interface DriverCtx {
    driver: Driver;
    dest: DriverPingMutation["drivers"]["ping"]["dest"];
    path: LatLng[] | null;
}

export interface Rider {
    token: string;
    phone: string;
}
