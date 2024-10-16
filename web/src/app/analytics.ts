import { ReservationType } from "@/shared";

export enum EventType {
    SetReservation,
    SearchLocation,
    SelectLocation,
    ConfirmPin,
    Reserve,
    ReorderLocations,
    ReservationCancel,
    ReservationContact,
}

interface EventSetReservationType {
    type: EventType.SetReservation,
    reservation_type: ReservationType,
}

interface EventSearchLocation {
    type: EventType.SearchLocation,
}

interface EventSelectLocation {
    type: EventType.SelectLocation,
}

interface EventConfirmPin {
    type: EventType.ConfirmPin,
}

interface EventReserve {
    type: EventType.Reserve,
}
interface EventReorderLocations {
    type: EventType.ReorderLocations,
}
interface EventReservationCancel {
    type: EventType.ReservationCancel,
}
interface EventReservationContact {
    type: EventType.ReservationContact,
}

export const EVENT_SET_RESERVATION_TYPE_PICKUP: EventSetReservationType = { type: EventType.SetReservation, reservation_type: ReservationType.PICKUP };
export const EVENT_SET_RESERVATION_TYPE_DROPOFF: EventSetReservationType = { type: EventType.SetReservation, reservation_type: ReservationType.DROPOFF };
export const EVENT_SEARCH_LOCATION: EventSearchLocation = { type: EventType.SearchLocation };
export const EVENT_SELECT_LOCATION: EventSelectLocation = { type: EventType.SelectLocation };
export const EVENT_CONFIRM_PIN: EventConfirmPin = { type: EventType.ConfirmPin };
export const EVENT_RESERVE: EventReserve = { type: EventType.Reserve };
export const EVENT_REORDER_LOCATIONS: EventReorderLocations = { type: EventType.ReorderLocations };
export const EVENT_RESERVATION_CANCEL: EventReservationCancel = { type: EventType.ReservationCancel };
export const EVENT_RESERVATION_CONTACT: EventReservationContact = { type: EventType.ReservationContact };

type GEvent = EventSetReservationType
    | EventSearchLocation
    | EventSelectLocation
    | EventConfirmPin
    | EventReserve
    | EventReorderLocations
    | EventReservationCancel
    | EventReservationContact;

export default function sendEvent(event: GEvent) {
    // @ts-ignore
    if (typeof window.gtag == 'undefined') return;

    // @ts-ignore
    const gtag: any = window.gtag;
    let action = "";
    let data: any = undefined;
    switch (event.type) {
        case EventType.SetReservation:
            action = "set_reservation_type";
            data = { type: event.reservation_type == ReservationType.PICKUP ? "pickup" : "dropoff" }
            break;
        case EventType.SearchLocation:
            action = "search_location";
            break;
        case EventType.SelectLocation:
            action = "select_location";
            break;
        case EventType.ConfirmPin:
            action = "confirm_pin";
            break;
        case EventType.Reserve:
            action = "reserve";
            break;
        case EventType.ReorderLocations:
            action = "reorder_locations";
            break;
        case EventType.ReservationCancel:
            action = "reservation_cancel";
            break;
        case EventType.ReservationContact:
            action = "reservation_contact";
            break;
    }

    gtag('event', action, data);
}
