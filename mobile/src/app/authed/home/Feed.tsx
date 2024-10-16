import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useContext } from "react";
import {
    ScrollView,
    RefreshControl,
    View,
    Text,
    Image,
    TouchableOpacity,
    Alert,
    AlertButton,
} from "react-native";
import { q, useGetMeQuery, en, useGetCurrentReservationQuery } from "@/shared";
import { ViewCentered } from "@/components";
import { AuthContext } from "@/app/state";
import CardEvent from "./feed/CardEvent";
import { groupEventsByDate } from "./util";
import CurrentReservation from "./feed/CurrentReservation";
import { PlusSquareIcon } from "lucide-react-native"
import uuid from "react-native-uuid";
import { AuthedParamList } from "@/app/Authed";
import * as Haptics from "expo-haptics";

export type PropsFeed = NativeStackScreenProps<AuthedParamList, "Home">;
export default function Feed({ navigation }: PropsFeed) {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();

    
    const { data: me, isLoading } = useGetMeQuery(client, undefined, {
        refetchInterval: 60 * 1000,
    });

    // const { data: reservation, status } = useGetCurrentReservationQuery(client, undefined, { enabled: false });

    const now = new Date().getTime() / 1000;
    const events =
        me?.users.me.memberships.flatMap(
            (membership) => membership.org.events.filter(event => event.timeEnd > now).map(event => ({ event, membership })),
        ) || [];

    const feed = groupEventsByDate(events);

    const adminMemberships = me?.users.me.memberships
        .filter(m => m.isAdmin);

    const onNewEvent = () => {
        const adminFor: AlertButton[] = adminMemberships?.map(m => ({
                text: m.org.bio || m.org.label,
                onPress: () => {
                    Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Heavy,
                    )
                    navigation.navigate("EventEdit", { idOrg: m.org.id, idEvent: uuid.v4().toString(), isCreated: false })
                }
            })) || [];

        if (adminFor.length == 1) {
            const idOrg = me?.users.me.memberships.at(0)?.org.id;
            Haptics.impactAsync(
                Haptics.ImpactFeedbackStyle.Heavy,
            )
            navigation.navigate("EventEdit", { idOrg, idEvent: uuid.v4().toString(), isCreated: false })
        } else {
            Haptics.impactAsync(
                Haptics.ImpactFeedbackStyle.Light,
            )
            Alert.alert("Select Organization", "Select the organization you want to create an event for", [...adminFor, { text: "Cancel", isPreferred: true }]);
        }
    }

    return (
        <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            refreshControl={
                !me ? undefined : <RefreshControl
                    tintColor="grey"
                    refreshing={isLoading}
                    onRefresh={() => {
                        queryClient.invalidateQueries();
                    }}
                />
            }
        >
            {!!adminMemberships?.length && <View className="px-4 pt-8">
                <TouchableOpacity onPress={onNewEvent} className="bg-white rounded py-2">
                    <View className="items-center flex-row justify-center gap-x-2">
                        <PlusSquareIcon color="black" />
                        <Text className="text-lg">New Event</Text>
                    </View>
                </TouchableOpacity>
            </View>}
            {Object.entries(feed).length > 0 || isLoading ? (
                Object.entries(feed).map(([label, events]) => (
                    <View key={label}>
                        <Text className="text-white font-bold text-xl ml-3 my-4">
                            {label}
                        </Text>
                        {events.map((event) => {
                            return <CardEvent key={event.event.id} event={event.event} membership={event.membership} />;
                        })}
                    </View>
                ))
            ) : (
                <ViewCentered>
                    <View>
                        <View className="px-16 pt-8">
                            <Image className="w-full" style={{ aspectRatio: 1 }} source={{ uri: "https://i.imgur.com/2r3Pj31.png" }} />
                        </View>
                        <Text className="text-gray-400 text-center mt-10">
                            No Events
                        </Text>
                    </View>
                </ViewCentered>
            )}
        </ScrollView>
    );
}
