import Back from "@/components/Back";
import Button from "@/components/Button";
import Text from "@/components/Text";
import View from "@/components/View";
import { useContext } from "react";
import { ContextRide, ContextRideDispatch } from "../context";
import { ActionType, ReservationType, ReserveStep, StateReserve, useReserveMutation } from "@/shared";
import client from "@/client";
import { v4 as uuidv4 } from "uuid";
import sendEvent, { EVENT_RESERVE } from "@/app/analytics";
import Account from "../Account";
import { AccountAvatar } from "./AccountAvatar";

export default function ConfirmPin() {
    const { step, locations, reservationType } = useContext(ContextRide)!;
    const { event, passengers } = step as StateReserve;

    const dispatch = useContext(ContextRideDispatch)!;

    const { mutate, isLoading, error } = useReserveMutation(client, {
        onSuccess(data, variables, context) {
            dispatch({ type: ActionType.SetReservation, reservation: data.reservations.reserve });
        },
    });

    const onReserve = () => {
        sendEvent(EVENT_RESERVE);
        mutate({
            id: uuidv4(),
            idEvent: event.id,
            form: {
                passengerCount: passengers,
                stops: locations.map(location => ({
                    location: location.location,
                    placeId: location.placeId,
                    address: location.main,
                })),
                isDropoff: reservationType == ReservationType.DROPOFF
            }
        })
    };

    const onBack = () => dispatch({
        type: ActionType.Review
    });

    return <View>
        <View
            id="overlay-top"
            className="absolute top-0 z-20 w-screen p-4 flex flex-row justify-between">
            <View className="item"><Back onClick={onBack} /></View>
            <View className="item"><Account trigger={<AccountAvatar />} /></View>
        </View>
        <View
            id="overlay-bottom"
            className="bg-zinc-950 absolute z-20 bottom-0 w-full p-4 rounded-t-2xl"
        >
            <Text className="text-center text-center block font-semibold">Confirm the pickup spot</Text>
            <View className="flex flex-col px-4 pb-2 border-b-2 border-gray-800"></View>
            {!!error && <Text className="text-red-400">Something went wrong, please try again</Text>}
            <View className="p-2">
                <Button disabled={isLoading} onClick={onReserve} title={isLoading ? "Loading..." : "Reserve Pickup"} />
            </View>
        </View>
    </View>
}
