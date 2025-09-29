import { useState, useEffect } from "react";
import { GetDriversQuery } from "./shared";
import { ANONYMOUS_PROFILE_IMAGE } from "./const";

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

export function formatVehicleName(vehicle: Pick<GetDriversQuery["events"]["get"]["drivers"][0]["vehicle"], "make" | "color" | "model">) {
    return `${vehicle.color} ${vehicle.make} ${vehicle.model}`;
}

export function formatVehicleNameShort(vehicle: Pick<GetDriversQuery["events"]["get"]["drivers"][0]["vehicle"], "make" | "model">) {
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
