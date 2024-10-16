import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { AuthedParamList } from "@/app/Authed";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GetMeQueryEvent } from "./home/feed/CardEvent";
import List from "./reservations/List";
import Ride from "./reservations/Ride";

export type ReservationsParamList = {
    List: {};
    Ride: { event: GetMeQueryEvent };
};
const Stack = createNativeStackNavigator<ReservationsParamList>();

export type PropsReservations = BottomTabScreenProps<
    AuthedParamList,
    "Reservations"
>;
export default function Reservations({ route, navigation }: PropsReservations) {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="List"
                component={List}
                options={{
                    headerTitle: "Reservations",
                }}
            />
            <Stack.Screen
                name="Ride"
                component={Ride}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}
