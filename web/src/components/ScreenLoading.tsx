import Text from "@/components/Text";
import Icon from "@mdi/react";
import { mdiLoading } from "@mdi/js";
import View from "@/components/View";

export default function ScreenLoading() {
    return <View className="flex justify-center items-center h-screen flex-col">
        <View>
            <Icon size={1} className="animate-spin mx-auto" path={mdiLoading} />
        </View>
        <Text className="mt-4 block text-gray-400 text-center">Loading...</Text>
    </View>
}
