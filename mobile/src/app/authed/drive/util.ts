import { DriverPingMutation, GraphQLClient, LatLng, useGetMeQuery } from "@/shared";
import { makeIsDriverForEvent } from "../home/util";
import { GetMeQueryEvent } from "../home/feed/CardEvent";

export function getDriveEvent(client: GraphQLClient) {
    const { data } = useGetMeQuery(client);
    const isDriver = data && makeIsDriverForEvent(data);
    const now = new Date().getTime() / 1000;
    const orgEvents =
        data?.users.me.memberships.flatMap(
            (membership) => membership.org.events.filter(event => event.timeEnd > now),
        ) || [];
    const driveEvent = orgEvents.find(isDriver!);
    // console.log("event", driveEvent);
    return driveEvent || null;
}

export function formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;

    const paddedHours = hours.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = seconds.toString().padStart(2, '0');

    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
}

export function getStopLocation(stop: NonNullable<DriverPingMutation["drivers"]["ping"]["dest"]>, event: GetMeQueryEvent): LatLng {
    if (stop.__typename == "DriverStopEstimationEvent") {
        const loc = event.location;
        if (!loc) throw Error("Event has no location");
        return { lat: loc.locationLat, lng: loc.locationLng };
    } else {
        return stop.location.coords;
    }
}
