import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { GetEventForDriverQuery, en, q, useGetEventAvaliableVehiclesQuery, useGetMeAccountQuery, useGetOrgVehiclesQuery, useUpdateEventDriverMutation } from "@/shared";
import { BigButt } from "@/components";
import { GetMeQueryEvent } from "../../home/feed/CardEvent";
import { ActionTypeDrive, ContextDriveDispatch } from "../context";
import { formatTime } from "../util";
import { CarIcon } from "lucide-react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import * as Haptics from "expo-haptics";
import { AuthContext } from "@/app/state";
import { AddVehicle } from "../../Vehicles";

interface ScheduledEventProps {
    event: GetEventForDriverQuery["events"]["get"];
    driver: GetEventForDriverQuery["events"]["get"]["drivers"][number];
}
export default function ScheduledEvent({ event, driver }: ScheduledEventProps) {
    const dispatch = useContext(ContextDriveDispatch)!;

    const start = new Date(event.timeStart * 1000);
    const [now, now_set] = useState(new Date());
    const [is_event_started, is_event_started_set] = useState(now.getTime() > start.getTime());
    const diff = start.getTime() - now.getTime();
    const timer = formatTime(diff);
    
     useEffect(() => {
        const intervalId = setInterval(() => {
            const nowTemp = new Date();
            now_set(nowTemp);
            if (nowTemp.getTime() > start.getTime()) {
                is_event_started_set(true);
                clearInterval(intervalId);
            }
        }, 1000);
        return () => clearInterval(intervalId);
    }, [start]);

    const onGoOnline = () => {
        Haptics.impactAsync(
            Haptics.ImpactFeedbackStyle.Light,
        )
        dispatch({ type: ActionTypeDrive.SET_ONLINE, val: true });
    }

    return <View>
            <Text className="text-xl text-white font-bold">{en.DRIVE_SCHEDULED}</Text>
            <Text className="text-gray-300 mt-1 mb-2">{en.DRIVE_SCHEDULED_LONG} {event.name}.</Text>
            <Vehicle phone={driver.phone} idOrg={event.idOrg} idEvent={event.id} vehicle={driver.vehicle} />
            {is_event_started
            ? <BigButt disabled={!driver.vehicle} on_click={onGoOnline} title={en.DRIVE_GO_ONLINE} is_loading={false} />
            : <BigButt title={`Starts in ${timer}`} disabled={true} />}
        </View>
}

interface VehicleProps {
    phone: string;
    idOrg: string;
    idEvent: string;
    vehicle: GetEventForDriverQuery["events"]["get"]["drivers"][number]["vehicle"];
}
function Vehicle({ idOrg, phone, idEvent, vehicle }: VehicleProps) {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();

    const ref = useRef<BottomSheetModalMethods>(null);
    const refAddVehicle = useRef<BottomSheetModalMethods>(null);
    const snapPoints = useMemo(() => ['80%'], []);
    const snapPointsAddVehicle = useMemo(() => ['80%'], []);
    const renderBackdrop = useCallback( (props: any) => ( <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={1}/>), []);

    const { data: vehicles } = useGetEventAvaliableVehiclesQuery(client, { idEvent });

    const { mutate } = useUpdateEventDriverMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetEventForDriver", { id: idEvent }]);
            queryClient.invalidateQueries(["GetEventAvaliableVehicles", { id: idOrg }]);
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            );
            ref.current?.dismiss();
        },

    });

    const onPress = () => {
        ref.current?.present();
        Haptics.impactAsync(
            Haptics.ImpactFeedbackStyle.Medium,
        )

    }

    const onNewVehicle = () => {
        refAddVehicle.current?.present();
        Haptics.impactAsync(
            Haptics.ImpactFeedbackStyle.Medium,
        )
    }

    const onSelect = (id: string) => {
        console.log(phone);
        mutate({
            idEvent,
            phone,
            form: {
                idVehicle: id,
            }
        })
    }

    return <>
        <View className="py-4">
            <TouchableOpacity onPress={onPress}>
                <View className="border-2 border-white rounded-lg p-2">
                    {vehicle
                    ? <View>
                        <Image className="w-40 h-32 mx-auto" source={{ uri: vehicle.imageUrl }} />
                        <Text className="text-gray-400 text-center">{vehicle.color} {vehicle.make} {vehicle.model}</Text>
                    </View>
                    : <View>
                        <Image className="w-40 h-32 mx-auto" source={{ uri: "https://i.imgur.com/MvT3FEo.png" }} />
                        <Text className="text-gray-400 text-center">Please Select a Vehicle</Text>
                    </View>}
                </View>
            </TouchableOpacity>
        </View>
        <BottomSheetModal ref={ref} snapPoints={snapPoints} backdropComponent={renderBackdrop} handleIndicatorStyle={{ backgroundColor: "gray" }} backgroundStyle={{ backgroundColor: "#111" }}>
            <BottomSheetScrollView>
                <View className="flex-col pb-20">
                        <View className="gap-y-2 pt-4">
                            <Text className="text-xl text-white text-center font-semibold">Select Vehicle</Text>
                            <Text className="text-gray-400 text-center">Select the vehicle you're driving.</Text>
                        </View>
                    {vehicles?.events.get.avaliableVehicles.map(v => <View key={v.id} className="py-2 px-2">
                        <TouchableOpacity onPress={() => onSelect(v.id)}>
                            <View className={`rounded-lg py-2 ${vehicle?.id == v.id ? "border-white border-4" : "border-zinc-600 border-2"}`}>
                                <Image className="w-40 h-32 mx-auto" source={{ uri: v.imageUrl }} />
                                <Text className="text-gray-400 text-center">{v.color} {v.year} {v.make} {v.model}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>)}
                    <View className="py-2 px-2">
                        <TouchableOpacity onPress={onNewVehicle}>
                            <View className="border-2 border-zinc-600 rounded-lg py-2">
                                <Image className="w-40 h-32 mx-auto" source={{ uri: "https://i.imgur.com/MvT3FEo.png" }} />
                                <Text className="text-gray-400 text-center">New Vehicle</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </BottomSheetScrollView>
        </BottomSheetModal>

        <BottomSheetModal ref={refAddVehicle} snapPoints={snapPointsAddVehicle} backdropComponent={renderBackdrop} handleIndicatorStyle={{ backgroundColor: "gray" }} backgroundStyle={{ backgroundColor: "#111" }}>
            <AddVehicle editing={{ idOrg, idVehicle: null, data: null }} />
        </BottomSheetModal>
    </>
}



