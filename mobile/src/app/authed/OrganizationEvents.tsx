import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthedParamList } from "../Authed";
import { useContext } from "react";
import { AuthContext } from "../state";
import { GetOrgEventsQuery, q, useGetMeQuery, useGetOrgEventsQuery } from "@/shared";
import { Text, FlatList, ImageBackground, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { BlurView } from "@react-native-community/blur";
import { makeIsDriverForEvent } from "./home/util";
import ScheduledDriving from "./home/feed/card_event/ScheduledDriving";
import { useNavigation } from "@react-navigation/native";

const URI_DEFAULT =
    "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fget.pxhere.com%2Fphoto%2Fwine-night-restaurant-bar-celebration-meal-lighting-festive-cheers-festival-glasses-party-chandelier-nightclub-abut-wine-glasses-wedding-reception-964600.jpg&f=1&nofb=1&ipt=b7c498e7cc29b1264ee8de7ac65307aa8050c203cdc8a638e3ccba60968bae17&ipo=images";


type PropsOrg = NativeStackScreenProps<AuthedParamList, "OrganizationEvents">;
export const OrganizationEvents = ({ route, navigation }: PropsOrg) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();
    const { params } = route;
    const { id, searchValue } = params;

    const { data } = useGetOrgEventsQuery(client, { id });

    const results = data?.orgs.get.events
        .filter(e =>  (e.name + " " + e.bio).toLowerCase().includes(searchValue.toLowerCase()))


    return <FlatList
        className="px-4"
        contentInsetAdjustmentBehavior="always"
        data={results}
        renderItem={({ item }) => <EventView idOrg={id} event={item} />}
    />;
}

type Event = GetOrgEventsQuery["orgs"]["get"]["events"][number];
interface EventViewProps {
    idOrg: string;
    event: Event;
}
const EventView = ({ idOrg, event }: EventViewProps) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const { data } = useGetMeQuery(client);

    const uri = URI_DEFAULT;


    const navigation = useNavigation<NativeStackNavigationProp<AuthedParamList, "Home", undefined>>();

    const onPress = () => {
        navigation.navigate("Event", { idOrg, idEvent: event.id, name: event.name })
    }

    return <View className="my-4">
        <TouchableOpacity onPress={onPress} activeOpacity={.8}>
            <ImageBackground
                className="overflow-hidden rounded-md"
                source={{ uri }}
            >
                <View className="h-40 p-4"></View>
                <BlurView>
                    <View className="p-4">
                        <Text className="text-white font-semibold text-lg">
                            {event.name}
                        </Text>
                        <Text className="text-gray-300">{event.bio}</Text>
                    </View>
                </BlurView>
            </ImageBackground>
        </TouchableOpacity>
    </View>

}


