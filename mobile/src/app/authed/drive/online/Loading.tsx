import { View, Text } from "react-native";
import { en } from "@/shared";
import { Overlay, Loader } from "@/components";

export default function Loading() {
    const content = <View>
        <Text className="text-xl text-white font-bold">{en.DRIVE_LOADING_RESERVATIONS}</Text>
        <Text className="text-gray-300 mt-1">{en.DRIVE_LOADING_RESERVATIONS_LONG}</Text>
        <Loader />
    </View>;

    return <Overlay bottom={content} />
}
