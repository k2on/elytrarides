import { SafeAreaView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface OverlayProps {
    top?: React.ReactNode;
    bottom: React.ReactNode;
}
export default function Overlay({ top, bottom }: OverlayProps) {
    const insets = useSafeAreaInsets();
    const bottomPx = insets.bottom + 40;

    return <View className="flex-1 relative h-screen">
        <SafeAreaView className="absolute top-0 z-20 w-screen">
            {top}
        </SafeAreaView>
        <SafeAreaView
            style={{ paddingBottom: bottomPx }}
            className="bg-zinc-950 absolute z-20 w-screen rounded-t-2xl bottom-0"
        >
            <View className="py-5">
                <View className="px-4 mb-2">
                    {bottom}
                </View>
            </View>
        </SafeAreaView>
    </View>

}
