import { useContext, useState } from "react";
import { ContextRide, ContextRideDispatch } from "../context";
import Text from "@/components/Text";
import View from "@/components/View";
import Button from "@/components/Button";
import { ActionType, ReservationType, StateReserve, en, useGetEventEstimateQuery, useReserveMutation } from "@/shared";
import client from "@/client";
import { v4 as uuidv4 } from "uuid";
import Back from "@/components/Back";
import sendEvent, { EVENT_CONFIRM_PIN, EVENT_RESERVE } from "@/app/analytics";
import Account from "../Account";
import { AccountAvatar } from "./AccountAvatar";

interface ReviewProps {}
export default function Review({}: ReviewProps) {
    const { step, locations, reservationType } = useContext(ContextRide)!;
    const { event, estimation, passengers } = step as StateReserve;
    const dispatch = useContext(ContextRideDispatch)!;

    const onBack = () => dispatch({
        type: ActionType.BackFromReview,
    });

    const onNext = () => {
        sendEvent(EVENT_CONFIRM_PIN);
        dispatch({
            type: ActionType.ConfirmPin,
            pin: locations[0],
        })
    };

    const { mutate, isLoading: isReserving, error } = useReserveMutation(client, {
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

    const { isLoading, error: estimateError } = useGetEventEstimateQuery(client, {
        id: event.id,
        form: {
            stops: locations.map(loc => ({ location: loc.location, placeId: loc.placeId, address: loc.main })),
            passengerCount: passengers,
            isDropoff: reservationType == ReservationType.DROPOFF,
        }
    },
    {
        onSuccess(data) {
            dispatch({ type: ActionType.SetEstimation, estimation: data.events.get.estimate })
        },
    });

    const PASSENGER_MAX = 4;

    const timestamp = new Date().getTime();
    const eta = estimation && new Date(timestamp + estimation.timeEstimate.arrival * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const min = estimation && Math.round(estimation.timeEstimate.pickup / 60);
    const confirmMessage = !estimation ? estimateError ? "" : "Loading..." : `${min} min wait · Arrive at ${eta}`;

    return (
        <View>
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
                <View className="flex flex-col px-4 mb-2 pb-4 border-b-2 border-gray-800">
                    <View className="flex flex-row mx-auto items-center">
                        <PassengerCountModifier
                            symbol="-"
                            fn={(n) => n - 1}
                            bound={1}
                            passengers={passengers}
                        />
                        <Text className="text-white text-7xl mx-12 font-bold text-center">{passengers}</Text>
                        <PassengerCountModifier
                            symbol="+"
                            fn={(n) => n + 1}
                            bound={PASSENGER_MAX}
                            passengers={passengers}
                        />
                    </View>
                    <Text className="text-center text-gray-400 mt-2">{passengers == 1 ? en.RIDE_RESERVE_PASSENGER_ONE : en.RIDE_RESERVE_PASSENGER_MULTIPLE}</Text>
                </View>
                <View className="p-2">
                    <Text className="block text-white mb-2 text-lg font-semibold">{confirmMessage}</Text>
                    {!!estimateError && <Text className="text-red-400">{formatError(estimateError, "Error getting estimate, please try again.")}</Text>}
                    {!!error && <Text className="text-red-400">Something went wrong, please try again</Text>}
                    <Button disabled={isReserving || isLoading || !!estimateError} onClick={reservationType == ReservationType.PICKUP ? onNext : onReserve} title={isReserving || isLoading ? "Loading..." : reservationType == ReservationType.PICKUP ? "Next" : "Confirm Reservation"} />
                </View>
            </View>
        </View>
    );
}

function formatError(e: any, msg?: string) {
    try {
        return "Error: " + e.response.errors[0].message;
    } catch {
        return msg || "An error occured, please try again";
    }
}

interface PassengerCountModifierProps {
    symbol: string;
    fn: (n: number) => number;
    bound: number;
    passengers: number;
}
function PassengerCountModifier({ symbol, fn, bound, passengers }: PassengerCountModifierProps) {
    const dispatch = useContext(ContextRideDispatch)!;
    const disabled = passengers == bound;

    const setPassengers = (passengers: number) => dispatch({ type: ActionType.SetPassengers, passengers });

    return <button
        onClick={() => setPassengers(fn(passengers))}
        disabled={disabled}
    >
        <Text className={`text-7xl font-semibold ${disabled ? "text-gray-600" : "text-white"}`}>{symbol}</Text>
    </button>
}

