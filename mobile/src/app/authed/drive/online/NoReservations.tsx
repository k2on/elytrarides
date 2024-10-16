import { useContext } from "react";
import { Button, View, Text, TouchableOpacity, Alert } from "react-native";
import { en } from "@/shared";
import { Overlay, Loader } from "@/components";
import { ActionTypeDrive, ContextDrive, ContextDriveDispatch } from "../context";
import { ShareIcon } from "lucide-react-native";
import { Share } from "react-native";
import * as Haptics from "expo-haptics";

export function NoReservations() {
    const { event } = useContext(ContextDrive)!;
    const dispatch = useContext(ContextDriveDispatch)!;

    const onGoOffline = () => {
        Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
        );
        dispatch({ type: ActionTypeDrive.SET_ONLINE, val: false });
    }

    const onShare = () => {
        if (!event) {
            Alert.alert("Could not share this event. Please restart the app.");
            return
        }

        Share.share({
            url: `https://elytra.to/${event.id}`,
        });
    }

    const content = <View>
        <View className="justify-between flex-row items-center">
            <View>
                <Text className="text-xl text-white font-bold">Online!</Text>
                <Text className="text-gray-300 mt-1">{en.DRIVE_NO_RESERVATIONS_LONG}</Text>
            </View>
            <TouchableOpacity onPress={onShare} className="pr-2">
                <ShareIcon className="text-gray-300" />
            </TouchableOpacity>
        </View>
        <View className="py-4">
            <Loader />
        </View>
        <Button onPress={onGoOffline} color="red" title={en.DRIVE_GO_OFFLINE} />
    </View>;

    return <Overlay bottom={content} />
}
