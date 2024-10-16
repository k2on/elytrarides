import { useContext, useState } from "react";
import { Image, SafeAreaView, Text, View } from "react-native";
import { DriverPingMutation, useAcceptReservationMutation, GetAvaliableReservationQuery } from "@/shared";
import { Overlay, BigButt } from "@/components";
import { ActionTypeDrive, ContextDrive, ContextDriveDispatch } from "../context";
import AnimatedCircle from "./new_dest/AnimatedCircle";
import Icons from "react-native-vector-icons/MaterialCommunityIcons";
import { AuthContext } from "@/app/state";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TouchableOpacity } from "react-native-gesture-handler";
import { DEFAULT_IMAGE_URL } from "@/const";

export default function NewDest() {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const { event, driver, queue, avaliableReservation } = useContext(ContextDrive)!;
    const dispatch = useContext(ContextDriveDispatch)!;
    const insets = useSafeAreaInsets();
    const bottomPx = insets.bottom + 40;

    const [isLoading, setIsLoading] = useState(false);

    const { mutate: acceptReservation } = useAcceptReservationMutation(client, {
        onSuccess(data, variables, context) {
            const { dest, queue, pickedUp, reservations } = data.drivers.acceptReservation;
            dispatch({ type: ActionTypeDrive.SET_STRAT, dest, queue, pickedUp, reservations });
            
        },
        onError(error, _variables, _context) {
            console.error(error);
        },
        onSettled(_data, _error, _variables, _context) {
            setIsLoading(false);
            dispatch({ type: ActionTypeDrive.SET_AVALIABLE_RESERVATION, reservation: null });
        },
    });
    

    if (!avaliableReservation) return <Overlay bottom={<Text className="text-red-400">NO_RES_ON_NEW_DEST. Something went wrong, please restart the app or contact support.</Text>} />;


    const passengers = avaliableReservation.reservation.passengerCount;

    const onStartDrive = () => {
        if (!driver) return console.error("driver is null");
        if (!event) return console.error("event is null");

        setIsLoading(true);
        acceptReservation({ idDriver: driver.id, idReservation: avaliableReservation.reservation.id });
    };

    const bottom = <View className="w-full  bottom-0">
                <View className="justify-center items-center w-full h-32 overflow-hidden bg-zinc-950 rounded-md p-4">
                    <AnimatedCircle />
                    <View className="absolute z-10 w-full">
                        <Text className="text-3xl text-white font-semibold mb-1">{avaliableReservation.reservation.passengerCount} {avaliableReservation.reservation.passengerCount == 1 ? "Passenger" : "Passengers"}</Text>
                        <Text className="text-gray-300 mb-1">{avaliableReservation.reservation.reserver.name} · {avaliableReservation.reservation.passengerCount} </Text>
                        {avaliableReservation.stops.map((stop, idx) => <NewReservationStop key={idx} idx={idx} stop={stop} />)}
                    </View>

                    <View style={{ marginTop: 15 }}>
                        <BigButt title="Accept" on_click={onStartDrive} is_loading={isLoading} />
                    </View>
                </View>
        </View>;

const data = [
  { key: '1', time: '6 mins (1.6 mi) away', location: 'County Hwy-25 & Fry St, St. Paul' },
  { key: '2', time: '10 mins (4.6 mi) trip', location: 'Shoreview' },
  // Add more items as needed
];


    return <View className="flex-1 relative h-screen">
        <SafeAreaView
            style={{ paddingBottom: bottomPx }}
            className="absolute z-20 w-screen bottom-0"
        >
            <View className="px-4">
                <View className="bg-zinc-950 p-4 rounded-xl border border-purple-400">

                    <View className="pb-4">
                        <View className="border-b border-zinc-800 pb-4">

                            <View className="pb-2">
                                <Text>
                                    <View>
                                        <View className="bg-zinc-800 flex-row items-center rounded-full space-x-2">
                                            <Image className="w-8 h-8 rounded-full" source={{ uri: avaliableReservation.reservation.reserver.imageUrl ?? DEFAULT_IMAGE_URL }} />
                                            <Text className="text-white">{avaliableReservation.reservation.reserver.name}</Text>
                                        </View>
                                    </View>
                                </Text>
                            </View>

                            <Text className="text-white font-bold text-3xl">{passengers} {passengers == 1 ? "passenger" : "passengers"}</Text>
                        </View>
                    </View>
                    <View className="pb-4">
                        <View className="border-b border-zinc-800 pb-4">
                            <View>
                                {avaliableReservation.stops.map((stop, idx) => (
                                    <View key={idx} className="flex-row items-start">
                                        <View className="mr-2 items-center bg-red-400">
                                            <View className="w-5 h-5 bg-white rounded-full" />
                                            {/* Render the line only if it's not the last item */}
                                            {idx < data.length - 1 && false && <View className="w-0.5 bg-white flex-grow" />}
                                        </View>
                                        <View className="flex-1">
                                            <Text className="font-bold text-white">{Math.round(stop.eta / 60)} min {idx == 0 ? "away" : "trip"}</Text>
                                            <Text className="text-white">{stop.stop.addressMain}</Text>
                                            {/* Add space below the text except for the last item */}
                                            {idx < avaliableReservation.stops.length - 1 && <View className="pb-4" />}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity className="bg-purple-600 py-3 rounded-lg" onPress={onStartDrive}>
                        <Text className="text-white text-center text-lg font-semibold">{isLoading ? "Loading..." : "Accept"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    </View>

}


interface NewReservationStopProps {
    idx: number,
    stop: NonNullable<GetAvaliableReservationQuery["events"]["get"]["avaliableReservation"]>["stops"][0];
}
export function NewReservationStop({ idx, stop }: NewReservationStopProps) {
    const icon = "map-marker";

    return <View className="flex-row items-center">
                <Icons name={icon} color="white" size={20} style={{ marginRight: 5 }} />
                <View className="flex-col">
                    <Text className="text-white">{Math.floor(stop.eta / 60)} min {idx == 0 ? "away" : "trip"}</Text>
                    <Text className="text-white">{stop.stop.addressMain}</Text>
                </View>
            </View>
}




