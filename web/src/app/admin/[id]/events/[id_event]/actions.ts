import { LatLng } from "@/shared";
import { AdminEvent } from "./types";
import { ReservationFilter } from "./all/columns";

export enum AdminActionType {
    SET_EVENT,
    SET_CENTER,
    SET_FILTER_STATUS,
    SET_FOCUSED,
    SET_TAB,
    UPDATE_DRIVER_LOCATION,
}

export type AdminAction = AdminActionSetEvent | AdminActionSetCenter | AdminActionSetFilterStatus | AdminActionSetFocused | AdminActionSetTab | AdminActionUpdateDriverLocation;

interface AdminActionSetEvent {
    type: AdminActionType.SET_EVENT,
    event: NonNullable<AdminEvent>,
}

interface AdminActionSetCenter {
    type: AdminActionType.SET_CENTER,
    center?: LatLng,
}

interface AdminActionSetFilterStatus {
    type: AdminActionType.SET_FILTER_STATUS,
    status: ReservationFilter["status"];
}

interface AdminActionSetFocused {
    type: AdminActionType.SET_FOCUSED;
    id: string | null;
}

interface AdminActionSetTab {
    type: AdminActionType.SET_TAB;
    tab: "drivers" | "reservations";
}

interface AdminActionUpdateDriverLocation {
    type: AdminActionType.UPDATE_DRIVER_LOCATION,
    id: number;
    location: LatLng;
}
