import View from "@/components/View";
import { ActionType, GetCurrentReservationQuery, StateReservation, useGetCurrentReservationQuery, useSubscribeToReservation } from "@/shared";
import { useContext, useEffect, useState } from "react";
import { ContextRide, ContextRideDispatch } from "./context";
import { auth_token_get } from "@/store";
import Active from "./reservation/Active";
import makeWSClient from "@/client-ws";
import Account from "./Account";
import { AccountAvatar } from "./reserve/AccountAvatar";
import client from "@/client";
import { queryClient } from "@/app/ReactQueryProvider";

interface ReservationProps {
    reservation: NonNullable<GetCurrentReservationQuery["reservations"]["current"]>
}
export default function Reservation({ }: ReservationProps) {
    const { step } = useContext(ContextRide)!;
    const dispatch = useContext(ContextRideDispatch)!;
    const { estimation, reservation } = step as StateReservation;

    useSubscribeToReservation(makeWSClient, { id: reservation.id, token: auth_token_get() || "" },
    {
        onData({ reservation: message }) {
            switch (message.__typename) {
                case "MessageReservationEstimation":
                    dispatch({ type: ActionType.SetEstimation, estimation: message.estimate })

                    break;
                case "MessageReservationUpdate":
                    dispatch({ type: ActionType.SetReservation, reservation: {...message.reservation, ...{ estimate: estimation! }} });
                    // queryClient.invalidateQueries(["GetCurrentReservation"]);
                    break;
                case "MessageDriverLocation":
                    dispatch({ type: ActionType.SetDriverLocation, driver_location: message.location });

                    break;
            }
        },
        onError(e) {
            console.error("error", e);
        },
        onComplete() {
            console.log("complete");
        }
    });

    // I dont like this either but otherwise it will not update in mobile safari
    useGetCurrentReservationQuery(client, { idEvent: reservation.event.id }, {
        onSuccess(data) {
            if (!data.reservations.current) {
                dispatch({ type: ActionType.SetReservation, reservation: { ...reservation, ...{ isComplete: true } } });
                return;
            }
            dispatch({ type: ActionType.SetReservation, reservation: data.reservations.current });
        },
    })

    // I dont like this
    useEffect(() => {
        setTimeout(() => {
            dispatch({ type: ActionType.SetShouldCenter, val: true });
        }, 250)
    }, [])

    return <View>
        <View
            id="overlay-top"
            className="absolute top-0 z-20 w-screen p-4 flex flex-row justify-between">
            <View className="item"></View>
            <View className="item"><Account trigger={<AccountAvatar />} /></View>
        </View>
        <View
            id="overlay-bottom"
            className="bg-zinc-950 absolute z-20 bottom-0 w-full p-4 rounded-t-2xl"
        ><Active /></View>
    </View>
}
