import { View, Text, SafeAreaView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Reservation() {
    const insets = useSafeAreaInsets();
    const bottom = insets.bottom + 40;

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
                    <View className="px-4 mb-2">
                        <Text className="text-white">hello</Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
