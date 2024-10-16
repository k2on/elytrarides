import { useContext } from "react";
import { SafeAreaView, View, Text } from "react-native";
import Icons from "react-native-vector-icons/MaterialCommunityIcons";
import { ContextDrive } from "../../context";

export default function Header() {
    const { dest, event } = useContext(ContextDrive)!;

    // find a way to not have this
    if (!dest) return <Text>No dest</Text>;
    if (!event) return <Text>No event</Text>;


    const icon = "map-marker";
    
    const name = dest.stop.addressMain;
    const bottom = dest.stop.addressSub;

    return <View className="bg-zinc-950 m-2 p-4 rounded-md flex-row items-center">
            <Icons name={icon} color="white" size={25} />
            <View style={{ marginLeft: 5 }}>
                <Text style={{ color: "white" }}>{name}</Text>
                {bottom && <Text style={{ color: "#ccc" }}>{bottom}</Text>}
            </View>
        </View>
}

