import { useContext } from "react";
import { View, Text } from "react-native";
import { GetEventForDriverQuery, useGetMeQuery } from "@/shared";
import { Overlay } from "@/components";
import { AuthContext } from "@/app/state";
import { isDriverForEvent } from "../home/util";
import NotScheduled from "./offline/NotScheduled";
import ScheduledEvent from "./offline/ScheduledEvent";
import { XIcon } from "lucide-react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { AuthedParamList } from "@/app/Authed";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

interface OfflineProps {
    event: GetEventForDriverQuery["events"]["get"];
    driver:  GetEventForDriverQuery["events"]["get"]["drivers"][number];
}
export function Offline({ event, driver }: OfflineProps) {
    const navigation = useNavigation<NativeStackNavigationProp<AuthedParamList, "Home", undefined>>();

    const onBack = () => {
        navigation.pop();
    }

    return <Overlay top={<Text className="ml-4"><TouchableOpacity className="bg-black items-center justify-center rounded-full w-14 h-14" onPress={onBack}><XIcon color="white" size={30} /></TouchableOpacity></Text>} bottom={<ScheduledEvent event={event} driver={driver} />} />;
}

