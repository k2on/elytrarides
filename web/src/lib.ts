import { useState, useEffect } from "react";
import { FormReservationStop, GetDriversQuery, ReservationEstimateWithEta, ReservationType, ReserveLocation } from "./shared";
import { ANONYMOUS_PROFILE_IMAGE } from "./const";
import { v4 as uuidv4 } from "uuid";

export function useDebounce<T>(value: T, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function now() {
    return Math.floor(new Date().getTime() / 1000);
}

type Vehicle = NonNullable<GetDriversQuery["events"]["get"]["drivers"][0]["vehicle"]>;

export function formatVehicleName(vehicle: Pick<Vehicle, "make" | "color" | "model">) {
    return `${vehicle.color} ${vehicle.make} ${vehicle.model}`;
}

export function formatVehicleNameShort(vehicle: Pick<Vehicle, "make" | "model">) {
    return `${vehicle.make} ${vehicle.model}`;
}

export function getImageId(url?: string | null): string | undefined {
    if (!url) return undefined;
    if (url == ANONYMOUS_PROFILE_IMAGE) return undefined;
    return url.split("/images/")[1].split(".jpg")[0];
}

export function presist<S, A>(reducer: (state: S, action: A) => S, key: string) {
    return (state: S, action: A): S => {
        const updatedState = reducer(state, action);
        try {
            const serializedState = JSON.stringify(updatedState);
            localStorage.setItem(key, serializedState);
        } catch (err) {
            console.error("Error saving state to local storage", err);
        }
        return updatedState;
    }
}

export function getArrivalDate(est: ReservationEstimateWithEta): Date {
    const now = new Date().getTime();
    const last = est.stopEtas.at(-1);
    if (!last) return new Date(now);
    return new Date(now + last.eta * 1000);
}

export function getPickupTime(est: ReservationEstimateWithEta): number {
    const first = est.stopEtas.at(0);
    if (!first) return 0;
    return first.eta;
}


const makeStop = (stop: ReserveLocation, idx: number): FormReservationStop => ({
    id: uuidv4(),
    stopOrder: idx,
    location: {
        location: stop.location,
        address: stop.main,
        placeId: stop.placeId,
    }
})

export function makeStops(locations: ReserveLocation[], reservationType: ReservationType | null): FormReservationStop[] {
    const stops = locations.map(makeStop);
    if (reservationType == undefined) return stops;
    return reservationType == ReservationType.PICKUP
        ? [...stops, { id: uuidv4(), stopOrder: stops.length }]
        : [{ id: uuidv4(), stopOrder: 0 }, ...stops.map(s => ({...s, ...{ stopOrder: s.stopOrder + 1 }}))];
}
