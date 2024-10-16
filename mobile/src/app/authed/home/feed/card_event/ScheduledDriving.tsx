import { View, Text } from "react-native";
import Icons from "react-native-vector-icons/MaterialCommunityIcons";

export default function ScheduledDriving() {
    return (
        <Text>
            <View className="bg-yellow-400 rounded-full px-2 py-1 flex-row items-center">
                <Icons
                    name="car"
                    color="black"
                    size={18}
                    style={{ marginRight: 5 }}
                />
                <Text className="text-black font-bold">SCHEDULED DRIVING</Text>
            </View>
        </Text>
    );
}
