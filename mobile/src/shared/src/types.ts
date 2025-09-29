import { GetCurrentReservationQuery, GetEventQuery, LatLng, ReservationEstimate, ReservationMutation } from "./generated/graphql";

export enum ReservationType {
    PICKUP,
    DROPOFF,
}

export enum ReserveStep {
    SEARCH,
    ORDER,
    REVIEW,
    CONFIRM_PIN,
}

export interface StateRide {
    reservationType: ReservationType | null;
    step: RideStep;
    locations: ReserveLocation[];
    shouldCenter: boolean;
}

export type RideStep = StateInitial | StateReserve | StateReservation;

export enum RideStepType {
    INITIAL,
    RESERVE,
    RESERVATION,
}

export interface StateInitial {
    type: RideStepType.INITIAL;
}

export interface StateReserve {
    type: RideStepType.RESERVE;
    event: GetEventQuery["events"]["get"];
    step: ReserveStep;
    searchText: string;
    searchResults: SearchStateResult[];
    isReordering: boolean;
    editingStop: number;
    estimation: ReservationEstimate | null;
    confirmPin: ReserveLocation | null;
    passengers: number;
}

export interface StateReservation {
    type: RideStepType.RESERVATION
    event: GetEventQuery["events"]["get"];
    reservation: NonNullable<GetCurrentReservationQuery["reservations"]["current"]>;
    estimation: ReservationEstimate | null;
    driverLocation: LatLng | null;
    driverLocationLast: LatLng | null;
}

export interface ReserveLocation {
    location: LatLng;
    main: string;
    sub: string;
    placeId: string;
}

export enum SearchResultType {
    POI,
    RECENT,
    ON_PREM,
}

export interface SearchStateResult {
    icon: SearchResultType;
    main: string;
    sub: string;
    placeId: string;
}

function stopsToLocations(stops: NonNullable<GetCurrentReservationQuery["reservations"]["current"]>["stops"]) {
    return stops.filter(stop => !stop.isComplete).map(stop => ({ main: stop.address.main, sub: stop.address.sub, placeId: "", location: {lat: stop.locationLat, lng: stop.locationLng} }));
}

export function makeInitialState(event: GetEventQuery["events"]["get"] | undefined, reservation: GetCurrentReservationQuery["reservations"]["current"], isDropoff = false): StateRide {
    return !event
    ? {
        step: { type: RideStepType.INITIAL },
        locations: [],
        reservationType: isDropoff ? ReservationType.DROPOFF : null,
        shouldCenter: false,
    }
    : reservation
    ? {
        step: {
            type: RideStepType.RESERVATION,
            event,
            reservation: reservation,
            estimation: reservation.estimate,
            driverLocation: null,
            driverLocationLast: null,
        },
        reservationType: reservation.isDropoff ? ReservationType.DROPOFF : ReservationType.PICKUP,
        locations: stopsToLocations(reservation.stops),
        shouldCenter: true,
    }
    : {
        step: {...INITIAL_RESERVE_STATE, ...{ event }},
        locations: [],
        reservationType: isDropoff ? ReservationType.DROPOFF : null,
        shouldCenter: false,
    };
}



export const INITIAL_RESERVE_STATE: Omit<StateReserve, "event"> = {
    type: RideStepType.RESERVE,
    step: ReserveStep.SEARCH,
    searchText: "",
    searchResults: [],
    isReordering: false,
    editingStop: -1,
    estimation: null,
    confirmPin: null,
    passengers: 1,
};

export function reducer(state: StateRide, action: Action): StateRide {
    // console.log("dis", state, action);
    switch (action.type) {
        case ActionType.SetData:
            return action.data;
        case ActionType.SetReservationType:
            return { ...state, ...{ reservationType: action.reservationType } };
        case ActionType.SearchClear:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step")

            return { ...state, ...{ step: {...state.step, ...{ searchText: "" }} } };
        case ActionType.SearchSet:

            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step")
            return { ...state, ...{ step: {...state.step, ...{ searchText: action.searchText }} } };
        case ActionType.SearchSelect:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step")

            const locations_new_edit = state.locations;
            if (state.step.editingStop == -1) {
                locations_new_edit.push(action.result);
            } else {
                locations_new_edit.splice(state.step.editingStop, 1, action.result);
            }

            return {
                ...state,
                ...{
                    step: {
                        ...state.step,
                        ...{
                            searchText: "",
                            searchResults: [],
                            editingStop: -1,
                            step: ReserveStep.REVIEW,
                        }
                    },
                    locations: locations_new_edit,
                    shouldCenter: true,
                },
            };
        case ActionType.Order:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step")
            return {
                ...state,
                ...{ step: {...state.step, ...{ step: ReserveStep.ORDER }}, shouldCenter: true },
            };
        case ActionType.Review:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step")
            return {
                ...state,
                ...{ step: {...state.step, ...{ step: ReserveStep.REVIEW }}, shouldCenter: true },
            };
        case ActionType.StopAdd:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step")
            return {
                ...state,
                ...{ step: {...state.step, ...{ step: ReserveStep.SEARCH }}, shouldCenter: true },
            };
        case ActionType.SetStops:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step")
            if (
                JSON.stringify(state.locations) == JSON.stringify(action.stops)
            ) {
                return {
                    ...state,
                    ...{ isReordering: false },
                };
            }
            return {
                ...state,
                ...{
                    locations: action.stops,
                    isReordering: false,
                    shouldCenter: true,
                },
            };
        case ActionType.StopRemove:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step")

            const new_locations_rm = [...state.locations];
            new_locations_rm.splice(action.idx, 1);
            const reserveStep = state.step;
            if (new_locations_rm.length == 0) reserveStep.step = ReserveStep.SEARCH;

            return {
                ...state,
                ...{ locations: new_locations_rm, shouldCenter: true, step: reserveStep },
            };
        case ActionType.StopEdit:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step")
            return {
                ...state,
                ...{
                    step: {
                        ...state.step,
                        ...{
                            step: ReserveStep.SEARCH,
                            searchText: state.locations.at(action.idx)!.main,
                            editingStop: action.idx,
                        }
                    }
                },
            };
        case ActionType.IsReorderingSet:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step")
            return {
                ...state,
                ...{ isReordering: action.val },
            };
        case ActionType.BackFromOrder:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step")

            // return {...state, ...{ step: {...state.step, ...{ step: ReserveStep.REVIEW }}, shouldCenter: true }}
            return makeInitialState(state.step.event, null);
        case ActionType.BackFromSearch:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step")
            if (state.locations.length == 0) return makeInitialState(state.step.event, null);

            return {...state, ...{ step: {...state.step, ...{ step: ReserveStep.ORDER }}, shouldCenter: true }}
        case ActionType.BackFromReview:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step")
            if (state.locations.length == 0) return makeInitialState(state.step.event, null);

            return {
                ...state,
                ...{
                    step: {
                        ...state.step,
                        ...{
                            step: ReserveStep.SEARCH,
                            searchText: state.locations.at(0)!.main,
                            editingStop: 0,
                        }
                    }
                },
            };
        case ActionType.SetShouldCenter:
            return {
                ...state,
                ...{
                    shouldCenter: action.val,
                },
            };
        case ActionType.SetReservation:
            if (state.step.type == RideStepType.INITIAL) throw Error("Cannot do in initial step")

            return {
                ...state,
                ...{
                    shouldCenter: true,
                    locations: stopsToLocations(action.reservation.stops),
                    step: {
                        type: RideStepType.RESERVATION,
                        event: state.step.event,
                        reservation: action.reservation,
                        estimation: action.reservation.estimate,
                        driverLocation: state.step.type == RideStepType.RESERVATION ? state.step.driverLocation : null,
                        driverLocationLast: state.step.type == RideStepType.RESERVATION ? state.step.driverLocationLast : null,
                    }
                }

            };
        case ActionType.SetEstimation:
            if (state.step.type == RideStepType.INITIAL) throw Error("Not in RESERVATION step");

            return {
                ...state,
                ...{
                    step: {
                        ...state.step,
                        ...{ estimation: action.estimation }
                    }
                }
            }
        case ActionType.SetDriverLocation:
            if (state.step.type != RideStepType.RESERVATION) throw Error("Not in RESERVATION step");

            return {
                ...state,
                ...{
                    step: {
                        ...state.step,
                        ...{ driverLocation: action.driver_location, driverLocationLast: state.step.driverLocation }
                    }
                }
            }
        case ActionType.SetPassengers:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step");

            return {
                ...state,
                ...{ step: {...state.step, ...{ passengers: action.passengers }}},
            };
        case ActionType.ConfirmPin:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step");

            return {
                ...state,
                ...{ step: {...state.step, ...{ step: ReserveStep.CONFIRM_PIN }, confirmPin: action.pin }, shouldCenter: true },
            };
        case ActionType.SetStopLocation:
            if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step");
            const newLocations = state.locations.map(loc => loc.placeId == action.placeId ? {...loc, location: action.location } : loc);
            return {
                ...state,
                ...{ locations: newLocations }
            }
    }
}

// const makeInitialReserveState = (state: StateRide): StateRide => {
//     if (state.step.type != RideStepType.RESERVE) throw Error("Not in RESERVE step")

//     return {
//         ...
//         ...{
//             reservationType: null,
//             step: {...INITIAL_RESERVE_STATE, ...{ event: state.step.event }},
//         },
//     };
// };

export enum ActionType {
    SetData,
    SetReservationType,
    SearchClear,
    SearchSet,
    SearchSelect,
    Review,
    Order,
    StopAdd,
    SetStops,
    StopRemove,
    StopEdit,
    IsReorderingSet,
    BackFromOrder,
    BackFromSearch,
    BackFromReview,
    SetShouldCenter,
    SetReservation,
    SetEstimation,
    SetDriverLocation,
    ConfirmPin,
    SetPassengers,
    SetStopLocation,
}

interface SetDataAction {
    type: ActionType.SetData;
    data: StateRide;
}

interface SetReservationTypeAction {
    type: ActionType.SetReservationType;
    reservationType: ReservationType | null;
}

interface SearchClearAction {
    type: ActionType.SearchClear;
}

interface SearchSetAction {
    type: ActionType.SearchSet;
    searchText: string;
}

interface SearchSelectAction {
    type: ActionType.SearchSelect;
    result: ReserveLocation;
}

interface ReviewAction {
    type: ActionType.Review;
}

interface OrderAction {
    type: ActionType.Order;
}

interface StopAddAction {
    type: ActionType.StopAdd;
}

interface SetStopsAction {
    type: ActionType.SetStops;
    stops: ReserveLocation[];
}

interface StopRemoveAction {
    type: ActionType.StopRemove;
    idx: number;
}

interface StopEditAction {
    type: ActionType.StopEdit;
    idx: number;
}

interface IsReorderingSetAction {
    type: ActionType.IsReorderingSet;
    val: boolean;
}

interface BackFromOrderAction {
    type: ActionType.BackFromOrder;
}

interface BackFromSearchAction {
    type: ActionType.BackFromSearch;
}

interface BackFromReviewAction {
    type: ActionType.BackFromReview;
}

interface SetShouldCenterAction {
    type: ActionType.SetShouldCenter;
    val: boolean;
}

interface SetReservationAction {
    type: ActionType.SetReservation;
    reservation: NonNullable<GetCurrentReservationQuery["reservations"]["current"]>;
}

// Reservation Actions
interface SetEstimationAction {
    type: ActionType.SetEstimation;
    estimation: ReservationEstimate;
}

interface SetDriverLocationAction {
    type: ActionType.SetDriverLocation;
    driver_location: LatLng;
}

interface ConfirmPinAction {
    type: ActionType.ConfirmPin,
    pin: ReserveLocation,
}

interface SetPassengersAction {
    type: ActionType.SetPassengers,
    passengers: number,
}

interface SetStopLocationAction {
    type: ActionType.SetStopLocation,
    placeId: string,
    location: LatLng,
}

export type Action =
    | SetDataAction
    | SetReservationTypeAction
    | SearchClearAction
    | SearchSetAction
    | SearchSelectAction
    | ReviewAction
    | OrderAction
    | StopAddAction
    | SetStopsAction
    | StopRemoveAction
    | StopEditAction
    | IsReorderingSetAction
    | BackFromOrderAction
    | BackFromSearchAction
    | BackFromReviewAction
    | SetShouldCenterAction
    | SetReservationAction
    | SetEstimationAction
    | SetDriverLocationAction
    | ConfirmPinAction
    | SetPassengersAction
    | SetStopLocationAction;

export interface Marker {
    location: LatLng;
    text: string;
    onPress?: () => void;
}
