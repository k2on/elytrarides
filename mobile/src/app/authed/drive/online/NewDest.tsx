import { useContext, useState } from "react";
import { Text, View } from "react-native";
import { DriverPingMutation, useConfirmPickupMutation, useAcceptReservationMutation, GetAvaliableReservationQuery } from "@/shared";
import { Overlay, BigButt } from "@/components";
import { ActionTypeDrive, ContextDrive, ContextDriveDispatch } from "../context";
import AnimatedCircle from "./new_dest/AnimatedCircle";
import Icons from "react-native-vector-icons/MaterialCommunityIcons";
import { AuthContext } from "@/app/state";

export default function NewDest() {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const { event, driver, queue, avaliableReservation } = useContext(ContextDrive)!;
    const dispatch = useContext(ContextDriveDispatch)!;

    const [isLoading, setIsLoading] = useState(false);

    const { mutate: acceptReservation } = useAcceptReservationMutation(client, {
        onSuccess(data, variables, context) {
            const { dest, queue, pickedUp } = data.drivers.acceptReservation;
            dispatch({ type: ActionTypeDrive.SET_STRAT, dest, queue, pickedUp });
            
        },
        onError(error, _variables, _context) {
            console.error(error);
        },
        onSettled(_data, _error, _variables, _context) {
            setIsLoading(false);
            dispatch({ type: ActionTypeDrive.SET_AVALIABLE_RESERVATION, reservation: null });
        },
    });

    const { mutate: pickup } = useConfirmPickupMutation(client, {
        onSuccess(_data, _variables, _context) {
            
        },
        onError(error, _variables, _context) {
            console.error(error);
        },
        onSettled(_data, _error, _variables, _context) {
            setIsLoading(false);
        },
    });
    

    if (!avaliableReservation) return <Overlay bottom={<Text className="text-red-400">NO_RES_ON_NEW_DEST. Something went wrong, please restart the app or contact support.</Text>} />;


    const onConfirmPickup = () => {
        if (!driver) return console.error("driver is null");
        if (!event) return console.error("event is null");

        setIsLoading(true);
        pickup({ idDriver: driver.id, idEvent: event.id });
    };

    const onStartDrive = () => {
        if (!driver) return console.error("driver is null");
        if (!event) return console.error("event is null");

        setIsLoading(true);
        acceptReservation({ idDriver: driver.id, idReservation: avaliableReservation.id });
    };

    const bottom = <View>
            <View className="absolute -mt-44 w-full">
                <View className="justify-center items-center w-full h-32 overflow-hidden bg-zinc-950 rounded-md p-4">
                    <AnimatedCircle />
                    <View className="absolute z-10">
                        <Text className="text-xl text-white font-semibold text-center mb-1">{avaliableReservation.isDropoff ? "Dropoff" : "Pickup"} Reservation</Text>
                        <Text className="text-gray-300 text-center mb-1">{avaliableReservation.reserver.name} · {avaliableReservation.passengerCount} {avaliableReservation.passengerCount == 1 ? "Passenger" : "Passengers"}</Text>
                        {avaliableReservation.stops.map((stop, idx) => <NewReservationStop key={idx} stop={stop} is_dropoff={avaliableReservation.isDropoff} />)}
                    </View>
                </View>
            </View>
            <View style={{ marginTop: 15 }}>
                <BigButt title="Accept" on_click={onStartDrive} is_loading={isLoading} />
            </View>
        </View>;

    return <Overlay bottom={bottom} />;
}


interface NewReservationStopProps {
    stop: NonNullable<GetAvaliableReservationQuery["events"]["get"]["avaliableReservation"]>["stops"][0];
    is_dropoff: boolean;
}
export function NewReservationStop({ stop, is_dropoff }: NewReservationStopProps) {
    const icon = is_dropoff
                ? "home-export-outline"
                : is_dropoff
                ? "map-marker-down"
                : "map-marker-up";
    return <View className="flex-row items-center">
                <Icons name={icon} color="white" size={20} style={{ marginRight: 5 }} />
                <Text className="text-white">{stop.address.main}</Text>
            </View>
}




