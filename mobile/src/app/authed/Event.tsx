import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthedParamList } from "../Authed";
import { AuthContext } from "../state";
import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { GetEventForDriverQuery, GetOrgMembersQuery, q, useGetAdminEventQuery, useGetEventQuery, useGetMeQuery, useGetMemberEventQuery, useGetOrgMembersQuery, useUpdateEventDriverMutation } from "@/shared";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { PencilIcon, PlusIcon } from "lucide-react-native";
import { DEFAULT_IMAGE_URL } from "@/const";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import * as Haptics from "expo-haptics";
import { Picker } from "@react-native-picker/picker";
import { makeIsDriverForEvent } from "./home/util";

type PropsEvent = NativeStackScreenProps<AuthedParamList, "Event">;
export const EventScreen = ({ route, navigation }: PropsEvent) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();
    const { idOrg, idEvent, name } = route.params;

    const ref = useRef<BottomSheetModalMethods>(null);
    const snapPoints = useMemo(() => ['50%'], []);
    const renderBackdrop = useCallback( (props: any) => ( <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={1}/>), []);

    // General Queries
    const { data: me } = useGetMeQuery(client);
    const { data: event } = useGetEventQuery(client, { id: idEvent });

    const membership = me && me.users.me.memberships.find(m => m.org.id == idOrg);
    const isMemberForOrg = !!membership;
    const isAdminForOrg = isMemberForOrg && membership.isAdmin;

    

    // Member Queries
    const { data: memberData } = useGetMemberEventQuery(client, { id: idEvent }, { enabled: isMemberForOrg });

    // Admin Queries
    const { data: adminData } = useGetAdminEventQuery(client, { id: idEvent }, { enabled: isAdminForOrg });
    const { data: members } = useGetOrgMembersQuery(client, { id: idOrg }, { enabled: isAdminForOrg });


    const { mutate } = useUpdateEventDriverMutation(client, {
        onSuccess(data, variables, context) {
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            )
            ref.current?.dismiss();
            queryClient.invalidateQueries(["GetAdminEvent", { id: idEvent }]);
        },
    });

    const isScheduldDriving = memberData?.events.get.isDriver || false;

    const notScheduled = (m: GetOrgMembersQuery["orgs"]["get"]["memberships"][number]): boolean => !adminData?.events.get.drivers.find(d => d.phone == m.user.phone);

    const avaliableDrivers = members?.orgs.get.memberships
        .filter(notScheduled)
        .sort((a, b) => {
            // Extract the last names by taking the last part after splitting by space
            let lastNameA = a.user.name.split(" ").pop()!.toLowerCase();
            let lastNameB = b.user.name.split(" ").pop()!.toLowerCase();
            // Compare the last names for sorting
            if (lastNameA < lastNameB) return -1;
            if (lastNameA > lastNameB) return 1;
            return 0;
        });
    
    console.log("members", members?.orgs.get.memberships);
    console.log("drivers", adminData?.events.get.drivers);
    console.log("ava", avaliableDrivers);

    const [driver, setDriver] = useState("");

    const onManage = () => {
        navigation.navigate("EventEdit", { idOrg, idEvent, isCreated: true });
    }

    const onAddDriver = () => {
        Haptics.impactAsync(
            Haptics.ImpactFeedbackStyle.Medium,
        )
        ref.current?.present();
    }

    const onSaveDriver = () => {
        mutate({
            idEvent,
            phone: driver,
            form: {}
        });

    }

    const onDrive = () => {
        navigation.navigate("Drive", { idEvent });
    }

    const onEditDriver = (driver: GetEventForDriverQuery["events"]["get"]["drivers"][number]) => {
        Alert.alert("Edit Driver", "What would you like to do with this driver?", [
            {
                text: "Delete Driver",
                style: "destructive",
                onPress: () => {
                    Alert.alert("Delete Driver", "Are you sure you want to delete this driver", [
                        {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => {
                                mutate({
                                    idEvent,
                                    phone: driver.phone,
                                    form: {
                                        idVehicle: driver.vehicle?.id,
                                        obsoleteAt: Math.floor(new Date().getTime() / 1000)
                                    }
                                })
                            }
                        },
                        {
                            text: "Cancel",
                            isPreferred: true,
                        }
                    ])
                }
            },
            {
                text: "Cancel",
                isPreferred: true,
            }
        ])

    }

    const drivers = adminData?.events.get.drivers;

    return <ScrollView contentInsetAdjustmentBehavior="automatic">
        {isScheduldDriving && <View className="px-2 pt-4">
            <TouchableOpacity className="bg-purple-800 py-2 rounded" onPress={onDrive}><Text className="text-white font-semibold text-center text-lg">Start Driving</Text></TouchableOpacity>
        </View>}

        {isAdminForOrg && <View className="px-2 pt-4">
            <View className="bg-zinc-900 rounded py-2">
                <View className="flex-row items-center gap-4 px-4">
                    <Text className={`text-lg ${drivers?.length == 0 ? "text-red-400" : "text-gray-100"}`}>{
                        drivers == undefined
                        ? "Loading Drivers..."
                        : drivers.length == 0
                        ? "No Drivers"
                        : drivers.length == 1
                        ? "1 Driver"
                        : `${drivers.length} Drivers`
                    }</Text>
                </View>
                <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                {drivers == undefined
                ? <View>
                    <View className="py-4">
                        <ActivityIndicator />
                    </View>
                    <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                </View>
                : drivers.map(d => <View key={d.id}>
                    <TouchableOpacity onPress={() => onEditDriver(d)} className="flex flex-row justify-between items-center px-4">
                        <View className="flex-row items-center gap-4">
                            <Image className="w-8 h-8 rounded-full" resizeMode="cover" source={{ uri: d.user.imageUrl || DEFAULT_IMAGE_URL }} />
                            <Text className="text-gray-100 text-lg">{d.user.name}</Text>
                        </View>
                        {d.vehicle ? <Text className="text-gray-400 text-lg">{d.vehicle.color} {d.vehicle.make}</Text> : <Text className="text-red-400 text-lg">No Vehicle</Text>}
                    </TouchableOpacity>
                    <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                </View>)}
                <TouchableOpacity onPress={onAddDriver}>
                    <View className="flex-row items-center gap-4 px-4">
                        <View className="bg-gray-100 w-8 h-8 items-center justify-center rounded-full p-1"><PlusIcon size={20} color="black" /></View>
                        <Text className="text-gray-100 text-lg">Add Driver</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>}

        <BottomSheetModal ref={ref} snapPoints={snapPoints} backdropComponent={renderBackdrop} handleIndicatorStyle={{ backgroundColor: "gray" }} backgroundStyle={{ backgroundColor: "#111" }}>
            <View className="flex-col justify-between flex-1 pb-20">
                <View>
                    <View className="gap-y-2 pt-4">
                        <Text className="text-xl text-white text-center font-semibold">Add Driver</Text>
                        <Text className="text-gray-400 text-center">Add a driver for this event.</Text>
                    </View>
                    {avaliableDrivers && avaliableDrivers.length > 0 ? <Picker
                        itemStyle={{ color: "white" }}
                        selectedValue={driver}
                        onValueChange={(itemValue, itemIndex) => {
                            setDriver(itemValue)
                        }}
                    >
                        <Picker.Item value="" label="Select Member" />
                        {avaliableDrivers?.map(m => <Picker.Item key={m.user.phone} value={m.user.phone} label={m.user.name} />)}
                    </Picker> : <View className="py-8"><Text className="text-xl text-center text-gray-400">No More Members Avaliable</Text></View>}
                </View>
                <View className="px-2">
                    <TouchableOpacity disabled={!driver} onPress={onSaveDriver} activeOpacity={.8} className={`py-2 rounded ${driver ? "bg-white" : "bg-zinc-600"}`}><Text className="text-lg text-center">Save</Text></TouchableOpacity>
                </View>
            </View>
        </BottomSheetModal>

        {isAdminForOrg && <View className="px-2 pt-4">
             <View className="bg-zinc-900 rounded py-2">
                 <TouchableOpacity onPress={onManage}>
                     <View className="flex-row items-center gap-4 px-4">
                         <View className="p-1 w-8 h-8 items-center justify-center"><PencilIcon size={20} className="text-gray-100" /></View>
                         <Text className="text-gray-100 text-lg">Edit Details</Text>
                     </View>
                 </TouchableOpacity>
             </View>
        </View>} 
    </ScrollView>
}

