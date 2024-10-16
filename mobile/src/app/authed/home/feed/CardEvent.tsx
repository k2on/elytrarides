import {
    ImageBackground,
    Linking,
    Pressable,
    Share,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import React, { ReactNode, useContext, useEffect, useState } from "react";
import { BlurView } from "@react-native-community/blur";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "@/app/state";
import { GetMeQuery, useGetMeQuery } from "@/shared";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ScheduledDriving from "./card_event/ScheduledDriving";
import { makeIsDriverForEvent } from "../util";
import { AuthedParamList } from "@/app/Authed";
import { AlertTriangleIcon, CalendarIcon, CarIcon, ShareIcon } from "lucide-react-native";
import { formatTime } from "../../drive/util";

const URI_DEFAULT =
    "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fget.pxhere.com%2Fphoto%2Fwine-night-restaurant-bar-celebration-meal-lighting-festive-cheers-festival-glasses-party-chandelier-nightclub-abut-wine-glasses-wedding-reception-964600.jpg&f=1&nofb=1&ipt=b7c498e7cc29b1264ee8de7ac65307aa8050c203cdc8a638e3ccba60968bae17&ipo=images";

export type GetMeQueryEvent =
    GetMeQuery["users"]["me"]["memberships"][0]["org"]["events"][0];
export type GetMeQueryMembership =
    GetMeQuery["users"]["me"]["memberships"][0];

function getDateStr(start: Date) {
    const now = new Date();

    if (now.toLocaleDateString() == start.toLocaleDateString()) return "Today";
    return start.toLocaleDateString();
}

export default function CardEvent({ event, membership }: { event: GetMeQueryEvent, membership: GetMeQueryMembership }) {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const { data } = useGetMeQuery(client);

    const start = new Date(event.timeStart * 1000);
    const [now, setNow] = useState(new Date());

    const navigation =
        useNavigation<
            NativeStackNavigationProp<AuthedParamList, "Home", undefined>
        >();

    const onPress = () => navigation.navigate("Event", { idOrg: event.idOrg, idEvent: event.id, name: event.name });

    const isScheduldDriving = data && makeIsDriverForEvent(data)(event);

    const dateStr = getDateStr(new Date(event.timeStart * 1000));
    const timeStr = new Date(event.timeStart * 1000).toLocaleTimeString();

    const vehiclesNeeded = event.drivers.filter(d => !d.vehicle).length;

    const selectedVehicle = event.drivers.find(d => d.phone == data?.users.me.phone)?.vehicle;
    const isMissingVehicle = isScheduldDriving && !selectedVehicle;

    const onSelectVehicle = () => {
        navigation.navigate("Drive", { idEvent: event.id });
    }

    const onReserve = () => {
        Linking.openURL("https://elytra.to/" + event.id);
    }

    const onShare = () => {
        Share.share({
            url: "https://elytra.to/" + event.id,
        })
    }

    useEffect(() => {
        const intervalId = setInterval(() => {
            const nowTemp = new Date();
            setNow(nowTemp);
            if (nowTemp.getTime() > start.getTime()) {
                clearInterval(intervalId);
            }
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    const isStarted = now.getTime() > start.getTime();

    return (
        <View className="mx-2 mb-4">
            <Pressable onPress={onPress}>
                <View className="bg-zinc-900 p-4 rounded-md">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-gray-300"><Text className="font-[Georgia]">{membership.org.label}</Text> · {membership.org.bio}</Text>
                        {isScheduldDriving && <ScheduledDriving />}
                    </View>
                    <View className="pt-2">
                        <Text className="text-white font-semibold text-lg">
                            {event.name}
                        </Text>
                        <Text className="text-gray-300">{event.bio}</Text>
                    </View>
                    <View className="pt-4 gap-y-2">
                        <View className="flex-row items-center gap-x-3"><CalendarIcon size={16} className="text-gray-300" /><Text className="text-gray-300">{dateStr} · {timeStr}</Text></View>
                        {membership.isAdmin && event.drivers.some(d => !d.vehicle)
                        ? <View className="flex-row items-center gap-x-3"><AlertTriangleIcon size={16} className="text-yellow-300" /><Text className="text-yellow-300 font-semibold">{vehiclesNeeded} {vehiclesNeeded == 1 ? "Vehicle" : "Vehicles"} Needed</Text></View>
                        : isScheduldDriving && isMissingVehicle ? <View className="flex-row items-center gap-x-3"><AlertTriangleIcon size={16} className="text-yellow-400" /><Text className="text-yellow-400 font-semibold">No Vehicle</Text></View>
                        : isScheduldDriving
                        ? <View className="flex-row items-center gap-x-3"><CarIcon size={16} className="text-gray-300" /><Text className="text-gray-300">{selectedVehicle?.color} {selectedVehicle?.make} {selectedVehicle?.model}</Text></View>
                        : null}
                    </View>
                    <View className="pt-8 flex-row justify-between gap-x-2">
                        <View className="flex-grow">
                        {isMissingVehicle
                        ? <Button onPress={onSelectVehicle}>Select Vehicle</Button>
                        : isScheduldDriving && !isStarted
                        ? <Button onPress={onSelectVehicle}>Change Vehicle</Button>
                        : isScheduldDriving
                        ? <Button onPress={onSelectVehicle}>Start Driving</Button>
                        : !isStarted
                        ? <Button disabled={true}>Starts in {formatTime(start.getTime() - now.getTime())}</Button>
                        : <Button onPress={onReserve}>Get a Ride</Button>}
                        </View>
                        <TouchableOpacity onPress={onShare} className="border-2 border-gray-800 px-4 justify-center items-center rounded"><ShareIcon color="white" /></TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        </View>
    );
}


interface ButtonProps {
    children: ReactNode;
    onPress?: () => void;
    disabled?: boolean;
}
function Button({ children, onPress, disabled }: ButtonProps) {
    return <TouchableOpacity onPress={onPress} className={`rounded py-3 ${disabled ? "bg-zinc-400": "bg-purple-800"}`}><Text className={`text-center text-md font-semibold ${disabled ? "" : "text-white"}`}>{children}</Text></TouchableOpacity>
}

