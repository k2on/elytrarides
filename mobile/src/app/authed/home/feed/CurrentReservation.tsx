import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { View, Text } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { GetCurrentReservationQuery } from "@/shared";
import { AuthedParamList } from "@/app/Authed";

interface CurrentReservationProps {
    reservation: NonNullable<GetCurrentReservationQuery["reservations"]["current"]>
}
export default function CurrentReservation({ reservation }: CurrentReservationProps) {



    const navigation =
        useNavigation<BottomTabNavigationProp<AuthedParamList, "Home">>();

    const onPress = () => navigation.navigate("Reservations", {
        screen: "Ride",
        params: { event: reservation.event },
    });
;


    
    return <View className="m-2 mt-4">
        <TouchableOpacity onPress={onPress} activeOpacity={.6}>
            <View className="bg-yellow-700 p-4 rounded-md">
                <Text className="text-white">View Your Reservation</Text>
            </View>
        </TouchableOpacity>
    </View>

}
