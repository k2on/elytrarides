import { Event, GetMeQuery, Membership, Organization } from "@/shared";
import { GetMeQueryEvent } from "./feed/CardEvent";

type GetMeMembership = GetMeQuery["users"]["me"]["memberships"][number];
export function groupEventsByDate<T extends Pick<Event, "timeStart">>(
    events: { event: T, membership: GetMeMembership }[],
) {
    // Get current date
    const currentDate = new Date();

    // Initialize event groups
    const eventGroups: { [k: string]: { event: T, membership: GetMeMembership }[] } = {};

    events.forEach((event) => {
        const eventDate = new Date(event.event.timeStart * 1000); // assuming event.date is in correct format

        // Compute label for the event date
        let label = "";

        const diffDays = Math.floor(
            (eventDate.getTime() - currentDate.getTime()) /
                (1000 * 60 * 60 * 24),
        );

        if (
            eventDate.toLocaleDateString() == currentDate.toLocaleDateString()
        ) {
            label = "Today";
        } else if (diffDays <= 1) {
            label = "Tomorrow";
        } else if (diffDays < 7) {
            label = eventDate.toLocaleString("default", { weekday: "long" });
        } else {
            label = `${eventDate.toLocaleString("default", {
                weekday: "long",
            })}, ${eventDate.toLocaleString("default", {
                month: "long",
            })} ${eventDate.getDate()}`;
        }

        // Add event to its corresponding group
        if (eventGroups[label]) {
            eventGroups[label].push(event);
        } else {
            eventGroups[label] = [event];
        }
    });

    return eventGroups;
}

export function makeIsDriverForEvent(data: GetMeQuery) {
    return (event: GetMeQueryEvent) =>
        isDriverForEvent(data.users.me.phone, event);
}

export function isDriverForEvent(
    phone: string,
    event: GetMeQueryEvent,
): boolean {
    return event.drivers.some((driver) => driver.phone == phone);
}
