import { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AuthContext } from "./state";
import { ActionType, GetOrgVehiclesQuery, RideStepType, makeInitialState, reducer, useGetApiVersionQuery, useGetCurrentReservationQuery, useGetMeQuery, useSubscribeToReservation } from "@/shared";
import makeWSClient from "@/clientWS";
import { ContextRide, ContextRideDispatch } from "./authed/state";
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icons from "react-native-vector-icons/MaterialCommunityIcons";
import { Account } from "./authed/Account";
import Reservations from "./authed/Reservations";
import Drive from "./authed/Drive";
import { assertPermissions } from "@/app/permissions";
import { API_VERSION } from "@/const";
import { Alert, SafeAreaView, Text, Image, View, Button, Share } from "react-native";
import { ViewCentered } from "@/components";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Feed from "./authed/home/Feed";
import { TouchableOpacity } from "react-native-gesture-handler";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetBackgroundProps } from "@gorhom/bottom-sheet";
import { BlurView } from "@react-native-community/blur";
import { EditAccount } from "./authed/EditAccount";
import { CircleUserRoundIcon, PlusIcon, ShareIcon } from "lucide-react-native";
import { Memberships } from "./authed/Memberships";
import { Organization } from "./authed/Organization";
import { OrganizationLocations } from "./authed/OrganizationLocations";
import { LocationSearch } from "./authed/LocationSearch";
import { AddMembers, OrganizationMembers } from "./authed/Members";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { AddVehicle, OrganizationVehicles } from "./authed/Vehicles";
import { OrganizationEvents } from "./authed/OrganizationEvents";
import { EventEditScreen } from "./authed/EventEdit";
import * as Haptics from "expo-haptics";
import { EventScreen } from "./authed/Event";

type EditVehicle = {
    idOrg: string;
    idVehicle: string | null;
    data: GetOrgVehiclesQuery["orgs"]["get"]["vehicles"][number] | null;
}

export type AuthedParamList = {
    Home: {};
    Reservations: undefined;
    Drive: { idEvent: string };
    EditAccount: undefined;
    EditAccountProfileImage: undefined;
    ManageMemberships: undefined;
    Organization: { id: string, label: string };
    OrganizationLocations: { id: string };
    LocationSearch: { name: string, idOrg: string };
    OrganizationMembers: { id: string, searchValue: string };
    OrganizationVehicles: { id: string, searchValue: string, editing: EditVehicle | null };
    OrganizationEvents: { id: string, searchValue: string },
    Event: { idOrg: string, idEvent: string, name: string };
    EventEdit: { idOrg: string, idEvent: string, isCreated: boolean, onSave?: () => void, isSaving?: boolean };
};
const Stack = createNativeStackNavigator<AuthedParamList>();

function AuthNav() {
    const requestPermissions = async () => {
        const res = await assertPermissions();
        if (!res) {
            console.error("Error starting location updates");
        }

        PushNotificationIOS.checkPermissions((permissions) => {
            // If no permissions have been granted
            if (
                !permissions.alert &&
                !permissions.badge &&
                !permissions.sound
            ) {
                PushNotificationIOS.requestPermissions().then(
                    (newPermissions) => {
                        console.log(newPermissions);
                    },
                );
            }
        });
    }

    useEffect(() => {
        requestPermissions();
    }, []);


    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const [isOutdated, setIsOutdated] = useState(false);

    useGetApiVersionQuery(client, {}, {
        onSuccess(data) {
            let apiVersion = data.version;
            console.log(`API VERSION: ${apiVersion}, MOBILE VERSION: ${API_VERSION}`);
            if (apiVersion > API_VERSION) {
                setIsOutdated(true);
            }
        }
    });

    const { data } = useGetMeQuery(client);

    const showReservations = false;


    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['60%'], []);

    const renderBackdrop = useCallback( (props: any) => ( <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={1}/>), []);

    return isOutdated
        ? <Outdated />
        : <View className="flex-1">
            <BottomSheetModal handleIndicatorStyle={{ backgroundColor: "gray" }} backgroundStyle={{ backgroundColor: "#111" }} backdropComponent={renderBackdrop} index={0} ref={bottomSheetModalRef} snapPoints={snapPoints}><Account /></BottomSheetModal>
            <Stack.Navigator initialRouteName="Home">
                <Stack.Screen
                    name="Home"
                    component={Feed}
                    options={{
                        headerLargeTitle: true,
                        headerTransparent: true,
                        headerBlurEffect: "dark",
                        title: "Invites",
                        headerRight: () => {
                            const uri = data?.users.me.imageUrl;

                            const handlePresentModalPress = useCallback(() => {
                                bottomSheetModalRef.current?.present();
                                Haptics.impactAsync(
                                    Haptics.ImpactFeedbackStyle.Medium,
                                )
                            }, []);

                            return <>
                                <TouchableOpacity className="border-2 border-black rounded-full" onPress={handlePresentModalPress}>
                                    {uri
                                    ? <Image className="rounded-full" width={30} height={30} source={{ uri }} />
                                    : <CircleUserRoundIcon color="white" />}
                                </TouchableOpacity>
                            </>
                        },
                        // headerRight: () => {
                        //     return <View className="bg-white rounded-full"><Icons name="plus" color={"black"} size={25} /></View>
                        // }
                        // headerShown: false,
                        // tabBarIcon: ({ color, size }) => (
                        //     <Icons name="home" color={color} size={size} />
                        // ),
                    }}
                />
                <Stack.Screen
                    name="Drive"
                    component={Drive}
                    options={{
                        headerShown: false,
                        gestureEnabled: false,
                        animation: "slide_from_bottom"
                        
                        // tabBarIcon: ({ color, size }) => (
                        //     <Icons name="steering" color={color} size={size} />
                        // ),
                    }}
                />
                <Stack.Screen
                    name="EditAccount"
                    component={EditAccount}
                    options={{
                        title: "My Account",
                        headerLargeTitle: true
                    }}
                />
                <Stack.Screen
                    name="ManageMemberships"
                    component={Memberships}
                    options={{
                        title: "Memberships",
                        headerLargeTitle: true
                    }}
                />
                <Stack.Screen
                    name="Organization"
                    component={Organization}
                    options={({ route }) => {
                        return {
                            headerLargeTitle: true,
                            title: route.params.label,
                        }
                    }}
                />
                <Stack.Screen
                    name="OrganizationLocations"
                    component={OrganizationLocations}
                    options={({ navigation, route }) => {
                        return {
                            title: "Properties",
                            headerRight(_props) {
                                const onPress = () => {
                                    Alert.prompt("Property Name", "Enter the name of the new property", name => {
                                        navigation.navigate("LocationSearch", { name, idOrg: route.params.id });
                                    })
                                }

                                const isAdmin = data?.users.me.memberships.some(m => m.org.id == route.params.id && m.isAdmin);
                                return isAdmin && <TouchableOpacity onPress={onPress}><PlusIcon /></TouchableOpacity>
                            },
                        }
                    }}
                />
                <Stack.Screen
                    name="LocationSearch"
                    component={LocationSearch}
                    options={{
                        title: "Search"
                    }}
                />
                <Stack.Screen
                    name="OrganizationMembers"
                    component={OrganizationMembers}
                    options={({ navigation, route }) => {
                        return {
                            title: "Members",
                            headerLargeTitle: true,
                            headerTransparent: true,
                            headerBlurEffect: "dark",
                            headerSearchBarOptions: {
                                autoFocus: true,
                                hideWhenScrolling: false,
                                onChangeText(e) {
                                    navigation.setParams({ searchValue: e.nativeEvent.text });
                                },
                            },
                            headerRight: () => {
                                const ref = useRef<BottomSheetModalMethods>(null);

                                const onPress = () => {
                                    Haptics.impactAsync(
                                        Haptics.ImpactFeedbackStyle.Medium,
                                    )
                                    ref.current?.present();
                                }
                                const snapPointsUserAdd = useMemo(() => ['40%'], []);

                                const isAdmin = data?.users.me.memberships.some(m => m.org.id == route.params.id && m.isAdmin);
                                return isAdmin && <>
                                    <TouchableOpacity onPress={onPress}><PlusIcon /></TouchableOpacity> 
                                    <BottomSheetModal ref={ref} snapPoints={snapPointsUserAdd} backdropComponent={renderBackdrop} handleIndicatorStyle={{ backgroundColor: "gray" }} backgroundStyle={{ backgroundColor: "#111" }}>
                                        <AddMembers id={route.params.id} />
                                    </BottomSheetModal>
                                </>
                            }
                        }
                    }}
                />
                <Stack.Screen
                    name="OrganizationVehicles"
                    component={OrganizationVehicles}
                    options={({ navigation, route }) => {
                        return {
                            title: "Vehicles",
                            headerLargeTitle: true,
                            headerTransparent: true,
                            headerBlurEffect: "dark",
                            headerSearchBarOptions: {
                                autoFocus: true,
                                hideWhenScrolling: false,
                                onChangeText(e) {
                                    navigation.setParams({ searchValue: e.nativeEvent.text });
                                },
                            },
                            headerRight: () => {
                                const onPress = () => {
                                    navigation.setParams({ editing: { idOrg: route.params.id, idVehicle: null }})
                                }

                                const isAdmin = data?.users.me.memberships.some(m => m.org.id == route.params.id && m.isAdmin);
                                return isAdmin && <>
                                    <TouchableOpacity onPress={onPress}><PlusIcon /></TouchableOpacity> 
                                </>
                            }
                        }
                    }}
                />
                <Stack.Screen
                    name="OrganizationEvents"
                    component={OrganizationEvents}
                    options={({ navigation, route }) => {
                        return {
                            title: "Events",
                            headerLargeTitle: true,
                            headerTransparent: true,
                            headerBlurEffect: "dark",
                            headerSearchBarOptions: {
                                autoFocus: true,
                                hideWhenScrolling: false,
                                onChangeText(e) {
                                    navigation.setParams({ searchValue: e.nativeEvent.text });
                                },
                            },
                            headerRight: () => {
                                const onPress = () => {
                                    navigation.navigate("NewEvent");
                                }

                                const isAdmin = data?.users.me.memberships.some(m => m.org.id == route.params.id && m.isAdmin);
                                return isAdmin && <>
                                    <TouchableOpacity onPress={onPress}><PlusIcon /></TouchableOpacity> 
                                </>
                            }
                        }
                    }}
                />
                <Stack.Screen
                    name="EventEdit"
                    component={EventEditScreen}
                    options={({ navigation, route }) => {
                        return {
                            title: "Edit",
                            headerBackTitle: "Back",
                            headerTransparent: true,
                            headerBlurEffect: "dark",
                        }
                    }}
                />
                <Stack.Screen
                    name="Event"
                    component={EventScreen}
                    options={({ navigation, route }) => {
                        return {
                            title: route.params.name,
                            headerLargeTitle: true,
                            headerTransparent: true,
                            headerBlurEffect: "dark",
                            headerRight: ({ tintColor }) => {
                                const onPress = () => {
                                    Share.share({
                                        url: `https://elytra.to/${route.params.idEvent}`,
                                    });
                                }

                                return <TouchableOpacity onPress={onPress}><ShareIcon /></TouchableOpacity>
                            }
                        }
                    }}
                />
            </Stack.Navigator>
        </View>;
}

function Outdated() {
    return <ViewCentered>
        <Text className="text-white text-center text-2xl font-bold">Outdated App</Text>
        <Text className="text-gray-400 text-center mt-4">Please update your app, thanks -Max Koon</Text>
    </ViewCentered>

}

export default function Authed() {
    const { getClient, getToken, onLoad } = useContext(AuthContext)!;
    const client = getClient();

    // const { data: reservation, status } =
    //     useGetCurrentReservationQuery(client);

    const getInitialState = () => makeInitialState(undefined, null);
    const initial = getInitialState();

    // useEffect(() => {
    //     if (status != "success" || !reservation.reservations.current) return;
    //     dispatch({type: ActionType.SetData, data: makeInitialState(reservation.reservations.current.event, reservation?.reservations.current) });
    // }, [reservation, status])

    
    const [state, dispatch] = useReducer(reducer, initial);

    useEffect(() => {
        setTimeout(() => {
            onLoad();
        }, 100)
    }, [])

    if (state.step.type == RideStepType.RESERVATION) {
        console.log("has res with id", state.step.reservation.id)
        useSubscribeToReservation(makeWSClient, { id: state.step.reservation.id, token: getToken() }, {
            onData(data) {
                console.warn("got data", data.reservation);
            },
            onError(e) {
                console.error("error!", e)
            },
            onComplete() {
                console.log("done!")
            }
        })
    }


    return <ContextRide.Provider value={state}>
            <ContextRideDispatch.Provider value={dispatch}>
                <AuthNav />
            </ContextRideDispatch.Provider>
        </ContextRide.Provider>
}
