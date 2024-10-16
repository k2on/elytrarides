"use client"

import client from "@/client";
import { GOOGLE_MAPS_LIBRARIES } from "@/components/ScreenMap";
import MarkerEstimation from "@/components/map/MarkerEstimation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { googleMapsApiKey } from "@/const";
import { DriverStrategyEstimations, GetAdminEventQuery, LatLng, useGetAdminEventQuery } from "@/shared";
import { GoogleMap, LoadScript, MarkerF, OVERLAY_MOUSE_TARGET, OverlayViewF } from "@react-google-maps/api";
import { setWeek } from "date-fns";
import { FC, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { from } from "rxjs";

type Reservation = GetAdminEventQuery["events"]["get"]["reservations"][number];

// interface Reservation {
//     id: string;
//     made_at: number;
//     stops: Stop[];
// }

interface Stop {
    location: LatLng;
    address: string;
}

interface Driver {
    location: LatLng;
}

interface Strategy {
    drivers: Map<number, DriverStrategy>;
} 

interface DriverStrategy {
    id: number;
    dest: Stop | null,
    queue: Stop[],
}

// estimations

interface StrategyEstimations {
    drivers: Map<number, DriverStrategyEstimation>;
}

interface DriverStrategyEstimation {
    id: number,
    dest: StopEst | null,
    queue: StopEst[],
}

interface StopEst {
    stop: Stop,
    eta: number;
}

function get_driver_location(id: number): LatLng {
    return LOCATIONS.TIGERBLVD.location;
}

function res_stop_to_driver_stop(stop: Reservation["stops"][number]): Stop {
    return {
        location: {
            lat: stop.locationLat,
            lng: stop.locationLng,
        },
        address: stop.address.main,
    }
}

function add_reservation(driver: DriverStrategy, reservation: Reservation): DriverStrategy {
    const new_driver: DriverStrategy = {...driver};
    const stops = [...reservation.stops];
    if (!driver.dest) {
        const stop = stops.splice(0, 1)[0];
        new_driver.dest = res_stop_to_driver_stop(stop);
    }
    new_driver.queue = new_driver.queue.concat(stops.map(s => res_stop_to_driver_stop(s)));
    return new_driver;
}

function get_shortest_driver(strategy: StrategyEstimations): DriverStrategy {
    const drivers = Array.from(strategy.drivers)
        .map(([, driver]) => ({ driver, len: get_driver_length(driver) }))
        .sort((a, b) => a.len - b.len)
    const driver = drivers.at(0)?.driver!;
    return strip_estimates_driver(driver);
}

function get_reservation_for_driver(driver: DriverStrategy, pool: Reservation[], score: ScoreFn): Reservation {
    const scores = pool
        .map(res => ({ res, score: score(driver, res, pool) }))
        .sort((a, b) => b.score - a.score);
    const best = scores.at(0)!.res;
    return best;
}

function dist(from: LatLng, to: LatLng): number {
    const { lat: lat1, lng: lon1 } = from;
    const { lat: lat2, lng: lon2 } = to;
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c; // in meters

    return distance;
}

type ScoreFn = (driver: DriverStrategy, reservation: Reservation, pool: Reservation[]) => number;


function assign_reservations_to_strategy(strategy: StrategyEstimations, pool: Reservation[], score: ScoreFn): StrategyEstimations {
    if (pool.length == 0) return strategy;
    const driver = get_shortest_driver(strategy);
    const reservation = get_reservation_for_driver(driver, pool, score);
    const pool_idx = pool.indexOf(reservation);
    pool.splice(pool_idx, 1);

    const new_strat = strip_estimates(strategy);
    const new_driver = add_reservation(driver, reservation);

    new_strat.drivers.set(driver.id, new_driver);

    let estimated = estimate(new_strat);

    return assign_reservations_to_strategy(estimated, pool, score);
}

function estimate(strat: Strategy): StrategyEstimations {
    return {
        drivers: new Map(Array.from(strat.drivers).map(([id, driver]) => [id, estimate_driver(driver)]))
    }
}

function estimate_driver(driver: DriverStrategy): DriverStrategyEstimation {
    let dest_est = driver.dest ? estimate_driver_to_dest(driver) : 0;
    let queue = get_driver_queue_etas(driver, dest_est);
    
    return {
        id: driver.id,
        dest: driver.dest ? {
            stop: driver.dest,
            eta: dest_est,
        } : null,
        queue
    }
}

function eq(a: LatLng, b: LatLng): boolean {
    return a.lat == b.lat && a.lng == b.lng;
}

function between(from_name: string, to_name: string): number {
    if (from_name == to_name) return 0;

    const times: [string, string, number][] = [
        ["CSP", "Benet Hall", 5],
        ["CSP", "Douthit Hills Hub", 4],
        ["CSP", "1108 Tiger Blvd", 5],
        ["Driver", "CSP", 3],

        ["Driver", "1108 Tiger Blvd", 2],
        ["Driver", "Benet Hall", 10],
        ["Driver", "Douthit Hills Hub", 8],
        ["Benet Hall", "Douthit Hills Hub", 8],
    ];

    for (const [from, to, time] of times) {
        if ((from == from_name && to == to_name) || (from == to_name && to == from_name)) {
            return time;
        }
    }


    console.error(from_name + " -> " + to_name + " was not found")
    throw Error(from_name + " -> " + to_name + " was not found");
}


function between_loc(from_target: LatLng, to_target: LatLng, from_name: string, to_name: string): number {
    if (from_target == to_target) return 0;
    const times: [{name: string, location: LatLng}, {name:string, location:LatLng}, number][] = [
        [LOCATIONS.CSP, LOCATIONS.BENET, 5],
        [LOCATIONS.CSP, LOCATIONS.DOUTHIT, 4],
        [LOCATIONS.TIGERBLVD, LOCATIONS.CSP, 3],

        [LOCATIONS.TIGERBLVD, LOCATIONS.BENET, 10],
        [LOCATIONS.TIGERBLVD, LOCATIONS.DOUTHIT, 8],
        [LOCATIONS.BENET, LOCATIONS.DOUTHIT, 8],
    ];

    for (const [from, to, time] of times) {
        if ((eq(from.location, from_target) && eq(to.location, to_target)) || (eq(to.location, from_target) && eq(from.location, to_target))) {
            return time;
        }
    }


    console.error(from_name + " -> " + to_name + " was not found")
    throw Error(from_name + " -> " + to_name + " was not found");

}

function estimate_driver_to_dest(driver: DriverStrategy): number {
    if (!driver.dest) throw Error("driver does not have dest");
    const location = get_driver_location(driver.id);
    return between("Driver", driver.dest.address);
}

function get_driver_queue_etas(driver: DriverStrategy, dest_est: number): StopEst[] {
    let last_est = dest_est;
    let last_stop = driver.dest;
    let queue: StopEst[] = [];

    for (const stop of driver.queue) {
        if (last_stop) {
            const est_between = between(last_stop.address, stop.address);
            last_est += est_between;
            queue.push({
                stop,
                eta: last_est,
            })
        }
        last_stop = stop;
    }

    return queue;
}

function get_driver_rider_pair(strategy: StrategyEstimations, pool: Reservation[]): [DriverStrategy, Reservation] {
    let scores: [number, number, string][] = [];
    for (const [, driver] of strategy.drivers) {
        for (const res of pool) {
            const score = get_driver_pair_score(driver, res);
            scores.push([score, driver.id, res.id]);
        }
    }
    scores.sort(([a], [b]) => a - b);
    console.log(scores);
    const [, id_driver, id_res] = scores[0];
    const driver = strategy.drivers.get(id_driver)!;
    const res = pool.find(res => res.id == id_res)!;
    return [strip_estimates_driver(driver), res];
}

function strip_estimates(strategy: StrategyEstimations): Strategy {
    return {
        drivers: new Map(Array.from(strategy.drivers).map(([i, d]) => ([
            i,
            strip_estimates_driver(d)
        ])))
    }
}

function strip_estimates_driver(driver: DriverStrategyEstimation): DriverStrategy {
    return {
        id: driver.id,
        dest: driver.dest?.stop ?? null,
        queue: driver.queue.map(s => s.stop),
    }
}

function get_driver_length(driver: DriverStrategyEstimation): number {
    if (driver.queue.length > 0) {
        return driver.queue[driver.queue.length - 1].eta;
    } else if (driver.dest) {
        return driver.dest.eta;
    }
    return 0;
}

function get_driver_pair_score(driver: DriverStrategyEstimation, res: Reservation): number {
    const diff = new Date().getTime() - res.madeAt * 1000;
    const len = get_driver_length(driver);
    console.log(diff, len);
    return diff * len;
}

const LOCATIONS = {
    TIGERBLVD: {
        name: "Tiger Blvd",
        location: { lat: 34.69113345677412, lng: -82.8352499055969 },
    },
    BENET: {
        name: "Benet Hall",
        location: { lat: 34.67752275452441, lng: -82.84026107839175 },
    },
    DOUTHIT: {
        name: "Douthit",
        location: { lat: 34.68054137735956, lng: -82.82995548243953 },
    },
    CSP: {
        name: "CSP",
        location: { lat: 34.68278184247956, lng: -82.83762674581469 },
    },
}
                    // {Array.from(strategy?.drivers || []).flatMap(([id, driver]) => [<OverlayViewF mapPaneName={OVERLAY_MOUSE_TARGET} position={driver.dest?.location}>DEST</OverlayViewF>, ...driver.queue.map((stop, idx) => <OverlayViewF position={{ lat: stop.location.lat - ((idx + 1) * .0008), lng: stop.location.lng}} mapPaneName={OVERLAY_MOUSE_TARGET}>{idx.toString()}</OverlayViewF>)])}

function get_dist(driver: DriverStrategy, res: Reservation): number {
    let driver_location: LatLng | null = null;
    if (driver.queue.length == 0) {
        driver_location = get_driver_location(driver.id);
    } else {
        const last = driver.queue.at(driver.queue.length - 1);
        if (!last) throw Error("Empty queue");
        driver_location = last.location;
    }

    return dist(driver_location, latlng(res.stops.at(0)!))
}


function latlng(stop: Reservation["stops"][number]): LatLng {
    return {
        lat: stop.locationLat,
        lng: stop.locationLng,
    }
}

export default function Page() {
    const [center, setCenter] = useState({ lat: 34.68130016406218, lng: -82.83417853444037 });
    const [showEvent, setShowEvent] = useState(false);
    const [showRes, setShowRes] = useState(false);
    const [w, setW] = useState(0);

    const id = "f4d98ca0-6dcd-443c-b343-84d4bc715096";

    const { data: event } = useGetAdminEventQuery(client, { id });

    const eventLocation: LatLng = LOCATIONS.CSP.location;

    const drivers: Driver[] = [
        {
            location: LOCATIONS.TIGERBLVD.location,
        },
        {
            location: LOCATIONS.TIGERBLVD.location,
        }
    ];

    const reservations = event?.events.get.reservations.map(r => ({...r, ...{ stops: [r.stops[0], {
        locationLat: eventLocation.lat,
        locationLng: eventLocation.lng,
        address: { main: "CSP" },
    }] }})) || [];
    
    // [
    //     {
    //         id: "4484420b-0444-4d59-a41f-a3f89030a2a4",
    //         made_at: new Date("2024-02-18").getTime(),
    //         stops: [
    //             { location: LOCATIONS.BENET.location },
    //             { location: eventLocation }
    //         ]
    //     },
    //     {
    //         id: "a68be3b6-9120-407f-83f9-0b06c31499e5",
    //         made_at: new Date("2024-02-19").getTime(),
    //         stops: [
    //             { location: LOCATIONS.DOUTHIT.location },
    //             { location: eventLocation }
    //         ]
    //     },
    //     {
    //         id: "c7eae67b-680f-4e78-a4b3-93dc6671b22c",
    //         made_at: new Date("2024-02-20").getTime(),
    //         stops: [
    //             { location: eventLocation },
    //             { location: LOCATIONS.BENET.location },
    //         ]
    //     },
    // ];

    const initial_strategy: Strategy = {
        drivers: new Map([
            [1, {
                id: 1,
                dest: null,
                queue: [],
            }],
            [2, {
                id: 2,
                dest: null,
                queue: [],
            }],
        ])
    };

    const score = (driver: DriverStrategy, reservation: Reservation, pool: Reservation[], weight: number): number => {
        const now = new Date().getTime();
        const maxWait = Math.max(...pool
            .map(res => now - res.madeAt * 1000));

        const maxDist = Math.max(...pool
            .map(res => get_dist(driver, res)))


        const wTime = 1 - weight;
        const wLoc = weight;

        const made_at = maxWait ? (now - reservation.madeAt * 1000) / maxWait : 0
        const distance = maxDist ? 1 - get_dist(driver, reservation) / maxDist : 1;


        const sTime = wTime * made_at;
        const sLoc = wLoc * distance;
        const s = sTime + sLoc;
        // const s = sLoc;
        // const s = sTime;

        console.log("loc", sLoc);

        return s;
    }

    const getRLen = (weight: number): number => {
        const strat = assign_reservations_to_strategy(estimate(initial_strategy), [...reservations], (d, r, p) => score(d, r, p, weight));
        const drivers = Array.from(strat.drivers).map(([_, driver]) => get_driver_length(driver));
        return Math.max(...drivers);
    }



    const strategy = assign_reservations_to_strategy(estimate(initial_strategy), [...reservations], (d, r, p) => score(d, r, p, w));
    // console.log("strat", strategy.drivers);

    const data = Array.from({ length: 100 })
        .map((_, i) => ({ r: i, l: getRLen(i / 100) }))
        console.log(data)

    return <div className="max-w-6xl mx-auto grid grid-cols-5 gap-3 pt-4">
        <div className="col-span-4">
            <LoadScript mapIds={["e054b907b2c2d1b6"]} googleMapsApiKey={googleMapsApiKey} libraries={GOOGLE_MAPS_LIBRARIES}>
                <GoogleMap
                    mapContainerStyle={{ outline: "none" }}
                    // onLoad={(e) => setMap(e)}
                    mapContainerClassName="h-[500px] remove-border"
                    center={center}
                    zoom={14}
                    options={{
                        disableDefaultUI: true,
                        mapId: "e054b907b2c2d1b6",
                    }}
                >
                    <StrategyMapView strategy={strategy} />
                    {showEvent && <MarkerF position={eventLocation} />}
                    {showRes && reservations.map(r => <MarkerF position={{ lat: r.stops[0].locationLat, lng: r.stops[0].locationLng }} />)}

                    <OverlayViewF mapPaneName={OVERLAY_MOUSE_TARGET} position={eventLocation}><div>Event</div></OverlayViewF>
                    
                    {drivers.map(d => <MarkerF position={d.location} />)}
                </GoogleMap>
            </LoadScript>

            <Card>
                <LineChart width={800} height={300} data={data}>
                    <YAxis/>
                    <XAxis/>
                    <CartesianGrid stroke="#eee" strokeDasharray="5 5"/>
                    <Line type="monotone" dataKey="l" stroke="#8884d8" />
                </LineChart>
                <CardContent className="h-64 py-8">
                    hello
                    <Slider step={.01} max={1} value={[w]} onValueChange={(v) => setW(v[0])} />
                </CardContent>
            </Card>
        </div>
        <div className="flex flex-col space-y-4">
            <Card className="w-full">
                <CardContent>
                    <div className="flex items-center space-x-2">
                      <Switch checked={showEvent} onCheckedChange={() => setShowEvent(!showEvent)} id="show_event" />
                      <Label htmlFor="show_event">Event</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={showRes} onCheckedChange={() => setShowRes(!showRes)} id="show_res" />
                      <Label htmlFor="show_res">Show Reservations</Label>
                    </div>
                </CardContent>
            </Card>
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                    {Array.from(strategy.drivers).map(([, strat]) => <DriverView driver={strat} />)}
                </CardContent>
            </Card>
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Reservations</CardTitle>
                </CardHeader>
                <CardContent>
                    {reservations.map(r => <ReservationView reservation={r} />)}
                </CardContent>
            </Card>
        </div>
    </div>
}

interface StrategyMapViewProps {
    strategy: StrategyEstimations;
}
const StrategyMapView: FC<StrategyMapViewProps> = ({ strategy }) => {
    return <>
        {Array.from(strategy.drivers).flatMap(([id, driver]) => [
            <DestMapView dest={driver.dest} />
        ])}
    </>
}

interface DestMapViewProps {
    dest: StopEst | null;

}
const DestMapView: FC<DestMapViewProps> = ({ dest }) => {
    if (!dest) return null;
    return <MarkerF position={dest.stop.location} />

}

interface ReservationViewProps {
    reservation: Reservation;
} 
const ReservationView: FC<ReservationViewProps> = ({ reservation }) => {
    return <div className="border-b">
        {new Date(reservation.madeAt * 1000).toLocaleDateString()}
        {reservation.stops.map((stop, idx) => <div>
            {idx + 1} - {stop.address.main}
        </div>)}
    </div>
}


interface DriverViewProps {
    driver: DriverStrategyEstimation;
} 
const DriverView: FC<DriverViewProps> = ({ driver }) => {
    return <div className="border-b">
        <div>
        Driver {driver.id}
        </div>
        <div>
        Dest: {driver.dest ? driver.dest.stop.address + ` (${driver.dest.eta})` : "None"}
        </div>
        <div>
        Queue:
        {driver.queue.map((stop, idx) => <div>
            {idx + 1} - {stop.stop.address} ({stop.eta})
        </div>)}
        </div>
    </div>
}
