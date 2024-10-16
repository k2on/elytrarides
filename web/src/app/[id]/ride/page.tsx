"use client";

import client from "@/client";
import {
    GetCurrentReservationQuery,
    GetEventQuery,
    RideStepType,
    makeInitialState,
    reducer,
    useGetCurrentReservationQuery,
    useGetEventQuery,
    useGetMeAccountQuery,
} from "@/shared";
import Reservation from "./Reservation";
import Reserve from "./Reserve";
import ScreenLoading from "@/components/ScreenLoading";
import { useEffect, useReducer } from "react";
import ScreenMap from "@/components/ScreenMap";
import { ContextRide, ContextRideDispatch } from "./context";
import Inactive from "./reservation/Inactive";
import sendEvent from "@/app/analytics";

const DROPOFF_KEY = "dropoff";

interface RideProps {
    params: { id: string };
}
export default function Ride({ params }: RideProps) {
    const { data: me } = useGetMeAccountQuery(client);
    const { data: event, isLoading: eventIsLoading } = useGetEventQuery(
        client,
        { id: params.id },
    );
    const { data: reservation, isLoading: reservationIsLoading } = useGetCurrentReservationQuery(client, { idEvent: params.id });
    if (me && me.users.me.name == "Anonymous") {
        const url = `/name?r=${window.location.href}`;
        window.location.href = url;
    }

    const isLoading = reservationIsLoading || eventIsLoading;
    if (isLoading) return <ScreenLoading />

    return <RideEvent event={event?.events.get!} reservation={reservation?.reservations.current} />
}

interface RideEventProps {
    event: NonNullable<GetEventQuery["events"]["get"]>,
    reservation: GetCurrentReservationQuery["reservations"]["current"]
}
function RideEvent({ event, reservation }: RideEventProps) {
    const url = new URL(window.location.href);
    const isDropoff = url.searchParams.get(DROPOFF_KEY) != null;
    if (isDropoff) {
        url.searchParams.delete(DROPOFF_KEY)
        history.pushState({}, '', url.toString());
    }
    const inital = makeInitialState(event, reservation, isDropoff);
    

    const [state, dispatch] = useReducer(reducer, inital);

    // console.log("init", inital);
    // console.log("state", state);

    if (state.step.type == RideStepType.RESERVATION && state.step.reservation.isComplete)
        return <Inactive reservation={state.step.reservation} />; 

    const overlay = state.step.type == RideStepType.RESERVATION ? (
        <Reservation reservation={reservation || state.step.reservation} />
    ) : (
        <Reserve />
    );


    return <ContextRide.Provider value={state}>
        <ContextRideDispatch.Provider value={dispatch}>
            {overlay}
            <ScreenMap />
        </ContextRideDispatch.Provider>
    </ContextRide.Provider>

}

