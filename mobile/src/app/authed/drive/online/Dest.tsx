import { useContext, useState } from "react";
import { Linking, Platform, Pressable, Text, View, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { useConfirmArrivalMutation, useNextStopMutation } from "@/shared";
import { Overlay, BigButt } from "@/components";
import { AuthContext } from "@/app/state";
import { ActionTypeDrive, ContextDrive, ContextDriveDispatch } from "../context";
import Header from "./dest/Header";
import Icons from "react-native-vector-icons/MaterialCommunityIcons";
import SlideButton from "rn-slide-button";
import { ArrowRightIcon } from "lucide-react-native";

const DEFAULT_USER_IMAGE = "https://imgur.com/BhtDVgO.jpg";

export default function Dest() {

    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const { dest, queue, driver, event, pickedUp, reservations } = useContext(ContextDrive)!;
    const dispatch = useContext(ContextDriveDispatch)!;


    const [isLoading, setIsLoading] = useState(false);
    const [isArrived, setIsArrived] = useState(false);


    const { mutate: arrive } = useConfirmArrivalMutation(client, {
        onSuccess(data, variables, context) {
            setIsArrived(true);
        },
        onError(error, variables, context) {
            console.error(error);
        },
        onSettled(data, error, variables, context) {
            setIsLoading(false);
        },
    });

    const { mutate: next } = useNextStopMutation(client, {
        onSuccess(data, variables, context) {
            const { dest, queue, pickedUp, reservations } = data.drivers.next;
            setIsArrived(false);
            dispatch({ type: ActionTypeDrive.SET_STRAT, dest, queue, pickedUp, reservations });
            
        },
        onError(error, variables, context) {
            console.error(error);
        },
        onSettled(data, error, variables, context) {
            setIsLoading(false);
        },
    });

    if (!dest) return <Text>Dest not set</Text>;

    const onNextStop = () => {
        setIsLoading(true);
        if (!driver) return console.error("driver is null");
        if (!event) return console.error("event is null");

        next({ idEvent: event.id, idDriver: driver.id });
    };

    const onArrive = () => {
        setIsLoading(true);
        if (!driver) return console.error("driver is null");
        if (!event) return console.error("event is null");

        arrive({ idEvent: event.id, idDriver: driver.id });
    };

    function getDestReservation() {
        if (!dest) throw Error("No dest");
        for (const res of reservations) {
            if (res.id == dest.stop.idReservation) {
                return res;

            }
        }
        throw Error("Reservation not found");
    }

    const curr = getDestReservation();

    const isLastStop = queue.length == 0;
    const isFirstStop = pickedUp.length == 0;
    
    const bottom = (
        <View>
            {dest && <View className="mx-4 flex-row justify-center items-center py-6">
                    <Image className="absolute left-0 w-12 h-12 rounded-full"
                        source={{ uri: curr.reserver.imageUrl || DEFAULT_USER_IMAGE }}
                    />
                    <View>
                        <Text className="text-xl font-semibold text-white text-center">{curr.reserver.name.split(" ")[0]}</Text>
                        <Text className="text-gray-300 text-center">{dest.stop.passengers} {dest.stop.passengers == 1 ? "Passenger" : "Passengers"}</Text>
                    </View>
                    <TouchableOpacity
                        className="absolute right-0 w-12 h-12 rounded-full bg-black justify-center items-center"
                        onPress={() => dialCall(curr.reserver.phone)}
                    >
                        <Text className="text-white">
                            <Icons name="phone" color="gray" size={25} />
                        </Text>
                    </TouchableOpacity>
            </View>}
            {!isArrived
            ? <BigButt title="Arrive" on_click={() => { onArrive() }} is_loading={isLoading} />
            : isLastStop
            ? <Slider onSlide={onNextStop} title="Complete Ride" color="rgb(220 38 38)" colorDark="rgb(185 28 28)" isLoading={isLoading} />
            : isFirstStop
            ? <Slider onSlide={onNextStop} title="Confirm Pickup" color="rgb(22 163 74)" colorDark="rgb(21 128 61)" isLoading={isLoading} />
            : <Slider onSlide={onNextStop} title="Complete Stop" color="rgb(22 163 74)" colorDark="rgb(21 128 61)" isLoading={isLoading} />}
        </View>
    );

    return <Overlay top={<Header />} bottom={bottom} />;
}

interface SliderProps {
    title: string;
    onSlide: () => void;
    color: string;
    colorDark: string;
    isLoading: boolean;
}
function Slider({ title, onSlide, color, colorDark, isLoading }: SliderProps) {
    return isLoading
    ? <View style={{ backgroundColor: colorDark }} className="h-[55px] rounded-[5px] justify-center mb-[5px]"><ActivityIndicator color={"black"}  /></View>
    : <SlideButton
        autoReset
        autoResetDelay={0}
        onReachedToEnd={onSlide}
        icon={<ArrowRightIcon size={30} color="white" />}
        borderRadius={5}
        padding={0}
        containerStyle={{ backgroundColor: color }}
        underlayStyle={{ backgroundColor: colorDark }}
        thumbStyle={{ backgroundColor: "none" }}
        titleStyle={{ fontSize: 20 }}
        title={title} />
}


const dialCall = (number: string) => {
    let phoneNumber = '';

    if (Platform.OS === 'android') { phoneNumber = `tel:${number}`; }
    else {phoneNumber = `telprompt:${number}`; }
    Linking.openURL(phoneNumber);
  }; 
