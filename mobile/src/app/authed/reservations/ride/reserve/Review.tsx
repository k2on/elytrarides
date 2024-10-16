import { View, Text, SafeAreaView } from "react-native";
import { Button } from "@/components";
import { useContext, useState } from "react";
import { ActionType, en, ReservationType, StateReserve, useGetEventEstimateQuery, useReserveMutation } from "@/shared";
import { ContextRide, ContextRideDispatch } from "../context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TouchableOpacity } from "react-native-gesture-handler";
import { AuthContext } from "@/app/state";
import uuid from "react-native-uuid";

const PASSENGER_MAX = 7;

interface ReviewProps {}
export default function Review({}: ReviewProps) {
    const { getClient } = useContext(AuthContext)!;
    const { reservationType, locations, step } = useContext(ContextRide)!;
    const { event } = step as StateReserve;

    const dispatch = useContext(ContextRideDispatch)!;
    const client = getClient();

    const [passengers, setPassengers] = useState(1);

    const { isLoading, data } = useGetEventEstimateQuery(client, {
        id: event.id,
        form: {
            // stops: locations.map(loc => ({ location: loc.location, placeId: loc.placeId })),
            stops: [],
            passengerCount: passengers,
            isDropoff: reservationType == ReservationType.DROPOFF
        }
    });
    const { mutate } = useReserveMutation(client, {
        onSuccess(data, variables, context) {
            dispatch({ type: ActionType.SetReservation, reservation: data.reservations.reserve });
        },
    });

    const insets = useSafeAreaInsets();
    const bottom = insets.bottom + 40;

    const onReserve = () => mutate({
        id: uuid.v4(),
        idEvent: event.id,
        form: {
            passengerCount: passengers,
            // stops: locations.map(location => ({
            //     location: location.location,
            //     placeId: location.placeId,
            // })),
            stops: [],
            isDropoff: reservationType == ReservationType.DROPOFF
        }
    });


    // const wait = data?.events.get.estimate.secondsPickup;
    const wait = "";
    const eta = "12:30pm";
    const confirmMessage = isLoading ? "Loading..." : `${wait} min wait - Arrive at ${eta}`;

    return (
        <View className="flex-1 relative h-screen">
            <SafeAreaView className="absolute top-0 z-20 w-screen">
                <Text className="text-white">My ride</Text>
            </SafeAreaView>
            <SafeAreaView
                style={{ bottom }}
                className="bg-zinc-950 absolute z-20 w-screen rounded-t-2xl"
            >
                <View className="py-5">
                    <View className="px-4 mb-2 pb-4 border-b-2 border-gray-800">
                        <View className="flex-row mx-auto items-center">
                            <PassengerCountModifier
                                symbol="-"
                                fn={(n) => n - 1}
                                bound={1}
                                passengers={passengers}
                                setPassengers={setPassengers}
                            />
                            <Text className="font-[phont] translate-x-3 text-white text-7xl mx-12 font-bold text-center">{passengers}</Text>
                            <PassengerCountModifier
                                symbol="+"
                                fn={(n) => n + 1}
                                bound={PASSENGER_MAX}
                                passengers={passengers}
                                setPassengers={setPassengers}
                            />
                        </View>
                        <Text className="text-center text-gray-400 mt-2">{passengers == 1 ? en.RIDE_RESERVE_PASSENGER_ONE : en.RIDE_RESERVE_PASSENGER_MULTIPLE}</Text>
                    </View>
                    <View className="p-2">
                        <Text className="text-white mb-2 text-lg font-semibold">{confirmMessage}</Text>
                        <Button onClick={onReserve} title="Confirm" />
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

interface PassengerCountModifierProps {
    symbol: string;
    fn: (n: number) => number;
    bound: number;
    passengers: number;
    setPassengers: React.Dispatch<React.SetStateAction<number>>;
}
function PassengerCountModifier({ symbol, fn, bound, passengers, setPassengers }: PassengerCountModifierProps) {
    const disabled = passengers == bound;

    return <TouchableOpacity
        onPress={() => setPassengers(fn(passengers))}
        disabled={disabled}
    >
        <Text className={`text-7xl font-semibold ${disabled ? "text-gray-600" : "text-white"}`}>{symbol}</Text>
    </TouchableOpacity>
}

