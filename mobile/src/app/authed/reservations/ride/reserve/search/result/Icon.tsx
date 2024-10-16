import { View } from "react-native";
import { SearchStateResult, SearchResultType } from "@/shared";
import Icons from "react-native-vector-icons/MaterialCommunityIcons";

interface ResultIconProps {
    result: SearchStateResult;
}
export default function ResultIcon({ result }: ResultIconProps) {
    const path = getPath(result.icon);

    return (
        <View className="bg-gray-800 rounded-full p-1">
            <Icons color="white" size={25} name={path} />
        </View>
    );
}

function getPath(icon: SearchResultType) {
    switch (icon) {
        case SearchResultType.RECENT:
            return "history";
        default:
            return "map-marker";
    }
}
