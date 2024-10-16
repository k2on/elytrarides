import { View, Text } from "react-native";
import { en } from "@/shared";

export default function NotScheduled() {
    return <View>
            <Text className="text-xl text-white font-bold">{en.DRIVE_NOT_SCHEDULED}</Text>
            <Text className="text-gray-300 mt-1">{en.DRIVE_NOT_SCHEDULED_LONG}</Text>
        </View>

}
