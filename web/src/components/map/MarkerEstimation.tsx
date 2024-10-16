import View from "../View";
import Text from "../Text";

interface MarkerEstimationProps {
    seconds: number;
}
export default function MarkerEstimation({ seconds }: MarkerEstimationProps) {
    const min = Math.round(seconds / 60);
    return <View className="bg-white text-black flex items-center px-2">
        <View>
            <View><Text className="text-lg font-semibold">{min}</Text></View>
            <View className="-mt-1"><Text>MIN</Text></View>
        </View>
    </View>
}

