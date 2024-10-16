import { createContext } from "react";
import { DriverPingMutation, GetAvaliableReservationQuery, GetEventForDriverQuery  } from "@/shared";
import { GetMeQueryEvent } from "../home/feed/CardEvent";

type EventForDriver = GetEventForDriverQuery["events"]["get"];

export interface StateDrive {
    isOnline: boolean;
    isLoading: boolean;
    dest: DriverPingMutation["drivers"]["ping"]["dest"];
    queue: DriverPingMutation["drivers"]["ping"]["queue"];
    pickedUp: DriverPingMutation["drivers"]["ping"]["pickedUp"];
    reservations: DriverPingMutation["drivers"]["ping"]["reservations"];
    event: EventForDriver | null;
    driver: GetMeQueryEvent["drivers"][0] | null;
    avaliableReservation: GetAvaliableReservationQuery["events"]["get"]["avaliableReservation"];
    lastPingAt: Date;
    lastAvaliableReservationAt: Date;
}

export enum ActionTypeDrive {
    SET_ONLINE,
    SET_EVENT,
    SET_STRAT,
    SET_AVALIABLE_RESERVATION,
}

interface ActionDriveSetOnline {
    type: ActionTypeDrive.SET_ONLINE;
    val: boolean;
}

interface ActionDriveSetEvent {
    type: ActionTypeDrive.SET_EVENT;
    event: EventForDriver;
    driver: EventForDriver["drivers"][number];
}

interface ActionDriveSetStrat {
    type: ActionTypeDrive.SET_STRAT;
    dest: DriverPingMutation["drivers"]["ping"]["dest"];
    queue: DriverPingMutation["drivers"]["ping"]["queue"];
    pickedUp: DriverPingMutation["drivers"]["ping"]["pickedUp"];
    reservations: DriverPingMutation["drivers"]["ping"]["reservations"];
}

interface ActionDriveSetAvaliableReservation {
    type: ActionTypeDrive.SET_AVALIABLE_RESERVATION;
    reservation: GetAvaliableReservationQuery["events"]["get"]["avaliableReservation"]
}

export type Action = ActionDriveSetOnline
    | ActionDriveSetEvent
    | ActionDriveSetStrat
    | ActionDriveSetAvaliableReservation;

export const INITAL_DRIVE_STATE: StateDrive = {
    isOnline: false,
    isLoading: true,
    dest: null,
    queue: [],
    event: null,
    driver: null,
    reservations: [],
    pickedUp: [],
    avaliableReservation: null,
    lastPingAt: new Date(0),
    lastAvaliableReservationAt: new Date(0),
}

export function reducer(state: StateDrive, action: Action): StateDrive {
    switch (action.type) {
        case ActionTypeDrive.SET_ONLINE:
            return {...state, ...{ isOnline: action.val }};
        case ActionTypeDrive.SET_EVENT:
            return {...state, ...{ event: action.event, driver: action.driver }};
        case ActionTypeDrive.SET_STRAT:
            return {...state, ...{ isLoading: false, dest: action.dest, queue: action.queue, pickedUp: action.pickedUp, reservations: action.reservations, lastPingAt: new Date() }};
        case ActionTypeDrive.SET_AVALIABLE_RESERVATION:
            return {...state, ...{ lastAvaliableReservationAt: new Date(), avaliableReservation: action.reservation }}
    }
}

export const ContextDrive = createContext<StateDrive | null>(null);
export const ContextDriveDispatch =
    createContext<React.Dispatch<Action> | null>(null);
