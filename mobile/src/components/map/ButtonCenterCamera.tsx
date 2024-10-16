import { View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Icons from "react-native-vector-icons/MaterialCommunityIcons";

interface ButtonCenterCameraProps {
    onPress: () => void;
}
export default function ButtonCenterCamera({
    onPress,
}: ButtonCenterCameraProps) {
    return (
        <TouchableOpacity onPress={onPress}>
            <View className="bg-zinc-950 p-2 rounded-xl">
                <Icons
                    name="compass-outline"
                    color="white"
                    size={25}
                />
            </View>
        </TouchableOpacity>
    );
}
