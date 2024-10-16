import { ActivityIndicator, Alert, Button, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native"
import { AuthedParamList } from "../Authed";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { q, useGetEventQuery, useGetOrgLocationsQuery, Event, useUpdateEventMutation } from "@/shared";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "../state";
import { SaveIcon, TrashIcon } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { Picker } from "@react-native-picker/picker";
import * as Haptics from "expo-haptics";

type EventForm = Pick<Event,
    "id"
    | "idOrg"
    | "name"
    | "bio"
    | "timeStart"
    | "timeEnd"
    | "reservationsStart"
    | "reservationsEnd"
    | "idLocation"
>;

type UpdateTime = { type: "date" | "start" | "end" | "publicStart", d: Date };

const unix = (d: Date): number => Math.floor(d.getTime() / 1000);
const fromUnix = (u: number): Date => new Date(u * 1000);
const applyDate = (time: Date, date: Date): Date => {
    time.setFullYear(date.getFullYear());
    time.setMonth(date.getMonth());
    time.setDate(date.getDate());
    return time;
}


type PropsEvent = NativeStackScreenProps<AuthedParamList, "EventEdit">;
export const EventEditScreen = ({ route, navigation }: PropsEvent) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();
    const { idOrg, idEvent, isCreated } = route.params;

    const [event, setEvent] = useState<EventForm>({
        id: idEvent,
        idOrg,
        name: "",
        bio: "",
        timeStart: 0,
        timeEnd: 0,
        reservationsStart: 0,
        reservationsEnd: 0
    });

    const [date, setDate] = useState(new Date());
    const [startTimeDate, setStartTimeDate] = useState(new Date());
    const [endTimeDate, setEndTimeDate] = useState(new Date());
    const [publicStartTimeDate, setPublicStartTimeDate] = useState(new Date());

    const [isDelayed, setIsDelayed] = useState(false);
    

    useGetEventQuery(client, { id: idEvent }, { enabled: isCreated, onSuccess(data) {
        update({...data.events.get, ...{ idLocation: data.events.get.location?.id }}, true);
        setDate(fromUnix(data.events.get.timeStart));
        setStartTimeDate(fromUnix(data.events.get.timeStart));
        setEndTimeDate(fromUnix(data.events.get.timeEnd));
        setPublicStartTimeDate(fromUnix(data.events.get.reservationsStart));
        setIsDelayed(data.events.get.timeStart != data.events.get.reservationsStart);
    }});

    const { data: locations } = useGetOrgLocationsQuery(client, { id: idOrg });

    const { mutate } = useUpdateEventMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetEvent", { id: idEvent }]);
        },
        onError(error, variables, context) {
            console.log(error);
        },
        onSettled(data, error, variables, context) {
            navigation.setOptions({
                headerRight: undefined
            })
        },
    });

    
    const ref = useRef<BottomSheetModalMethods>(null);
    const snapPointsUserAdd = useMemo(() => ['40%'], []);
    const renderBackdrop = useCallback( (props: any) => ( <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={1}/>), []);

    const eventRef = useRef(event);

    const onSave = () => {
        const event = eventRef.current;
        navigation.setOptions({
            headerRight: ({ tintColor }) => <ActivityIndicator color={tintColor} />
        })

        mutate({
            idOrg,
            idEvent,
            form: {
                bio: event.bio,
                idLocation: event.idLocation,
                name: event.name,
                publishedAt: unix(new Date()),
                reservationsEnd: event.timeEnd,
                reservationsStart: event.reservationsStart,
                timeEnd: event.timeEnd,
                timeStart: event.timeStart,
            }
        });
    }


    const update = (data: Partial<EventForm>, first?: boolean) => {
        if (!first) {
            navigation.setOptions({
                headerRight: ({ tintColor }) => <Button color={tintColor} onPress={onSave} title="Save" />
            })
        }
        eventRef.current = ({...event, ...data});
        setEvent(last => ({...last, ...data}))
    }

    const onEditName = () => {
        Alert.prompt("Event Name", "Enter the name of the event", name => {
            update({ name })
        }, "plain-text", event.name);
    }

    const onEditDesc = () => {
        Alert.prompt("Event Description", "Enter a description of the event", desc => {
            update({ bio: desc })
        }, "plain-text", event.bio || "");
    }

    const onEditLocation = () => {
        Haptics.impactAsync(
            Haptics.ImpactFeedbackStyle.Medium,
        )
        ref.current?.present();
    }

    const onDeleteEvent = () => {
        Alert.alert("Delete Event", "Are you sure you want to delete this event?");
    }

    const getStartTimeWithDate = (d: Date): Date => applyDate(startTimeDate, d);
    const getEndTimeWithDate = (d: Date): Date => {
        const endTime = applyDate(endTimeDate, d);
        if (endTime.getTime() < startTimeDate.getTime()) {
            endTime.setTime(endTime.getTime() + 1000 * 60 * 60 * 24);
        }
        return endTime;
    }
    const getPublicStartTimeWithDate = (d: Date): Date => applyDate(publicStartTimeDate, d);

    const getStartTimeWithTime = (t: Date): Date => applyDate(t, date);
    const getEndTimeWithTime = (t: Date): Date => {
        const endTime = applyDate(t, date);
        if (endTime.getTime() < startTimeDate.getTime()) {
            endTime.setTime(endTime.getTime() + 1000 * 60 * 60 * 24);
        }
        return endTime;
    }

    const getPublicStartTimeWithTime = (t: Date): Date => applyDate(t, date);

    const updateDates = ({ timeStart, timeEnd, reservationsStart }: { timeStart: Date, timeEnd: Date, reservationsStart: Date }) => {
        setDate(timeStart);
        setStartTimeDate(timeStart);
        setEndTimeDate(timeEnd);
        setPublicStartTimeDate(reservationsStart);

        update({
            timeStart: unix(timeStart),
            timeEnd: unix(timeEnd),
            reservationsStart: unix(reservationsStart),
        });
    }

    const updateDatesForStart = ({ timeStart, reservationsStart }: { timeStart: Date, reservationsStart: Date }) => {
        setDate(timeStart);
        setStartTimeDate(timeStart);
        setPublicStartTimeDate(reservationsStart);

        update({
            timeStart: unix(timeStart),
            reservationsStart: unix(reservationsStart),
        });
    }

    const updateDatesForPublicStart = ({ reservationsStart }: { reservationsStart: Date }) => {
        setPublicStartTimeDate(reservationsStart);

        update({
            reservationsStart: unix(reservationsStart),
        });
    }

    const updateDatesForStartDelayed = ({ timeStart }: { timeStart: Date }) => {
        setDate(timeStart);
        setStartTimeDate(timeStart);

        update({
            timeStart: unix(timeStart),
        });
    }

    const updateDatesForEnd = ({ timeEnd }: { timeEnd: Date }) => {
        setEndTimeDate(timeEnd);
        update({
            timeEnd: unix(timeEnd),
        });
    }

    const updateTime = ({ type, d }: UpdateTime) => {
        if (type == "date") {
            const timeStart = getStartTimeWithDate(d);
            const timeEnd = getEndTimeWithDate(d);
            const reservationsStart = getPublicStartTimeWithDate(d);

            updateDates({
                timeStart,
                timeEnd,
                reservationsStart,
            })
        } else if (type == "start") {
            const timeStart = getStartTimeWithTime(d);
            if (isDelayed) {
                updateDatesForStartDelayed({
                    timeStart,
                })
            } else {
                const reservationsStart = getPublicStartTimeWithTime(d);
                updateDatesForStart({
                    timeStart,
                    reservationsStart,
                })
            }
        } else if (type == "end") {
            const timeEnd = getEndTimeWithTime(d);
            updateDatesForEnd({
                timeEnd,
            });
        } else if (type == "publicStart") {
            const reservationsStart = getPublicStartTimeWithTime(d);
            updateDatesForPublicStart({
                reservationsStart,
            });
        }
    }

    const onDelayChange = (delayed: boolean) => {
        setIsDelayed(delayed);
        if (!delayed) {
            update({
                reservationsStart: event.timeStart,
            });
            setPublicStartTimeDate(startTimeDate);
        }
    }

    const eventLocation = locations?.orgs.get.locations.find(l => l.id == event.idLocation);

    return <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Text>My event</Text>

        <View className="px-2 pt-4">
            <View className="bg-zinc-900 rounded py-2">
                <TouchableOpacity onPress={onEditName}>
                    <View className="flex-row items-center gap-4 px-4 justify-between">
                        <Text className="text-gray-100 text-lg">Name</Text>
                        <Text className={`text-lg ${event.name ? "text-gray-400" : "text-red-400"}`}>{event.name || "Missing"}</Text>
                    </View>
                </TouchableOpacity>
                <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                <TouchableOpacity onPress={onEditDesc}>
                    <View className="flex-row items-center gap-4 px-4 justify-between">
                        <Text className="text-gray-100 text-lg">Description</Text>
                        <Text style={{ maxWidth: "80%" }} ellipsizeMode="tail" numberOfLines={2} className={`text-lg ${event.bio ? "text-gray-400" : "text-red-400"}`}>{event.bio || "Missing"}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>

        <View className="px-2 pt-4">
            <View className="bg-zinc-900 rounded py-2">
                <TouchableOpacity onPress={onEditName}>
                    <View className="flex-row items-center gap-4 px-4 justify-between">
                        <Text className="text-gray-100 text-lg">Date</Text>
                        <View>
                            <DateTimePicker value={date} onChange={(_, d) => {
                                if (d) updateTime({ type: "date", d })
                            }} />
                        </View>
                    </View>
                </TouchableOpacity>
                <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                <TouchableOpacity onPress={onEditDesc}>
                    <View className="flex-row items-center gap-4 px-4 justify-between">
                        <Text className="text-gray-100 text-lg">Start Time</Text>
                        <View>
                            <DateTimePicker
                                value={startTimeDate}
                                mode="time"
                                onChange={(_, d) => {
                                    if (d) updateTime({ type: "start", d })
                                }}
                            />
                        </View>
                    </View>
                </TouchableOpacity>
                <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                <TouchableOpacity onPress={onEditDesc}>
                    <View className="flex-row items-center gap-4 px-4 justify-between">
                        <Text className="text-gray-100 text-lg">End Time</Text>
                        <View>
                            <DateTimePicker
                                value={endTimeDate}
                                mode="time"
                                onChange={(_, d) => {
                                    if (d) updateTime({ type: "end", d })
                                }}
                            />
                        </View>
                    </View>
                </TouchableOpacity>
                <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                <View className="flex-row items-center gap-4 px-4 justify-between">
                    <Text className="text-gray-100 text-lg">Delayed Public Start</Text>
                    <View><Switch value={isDelayed} onChange={(e) => onDelayChange(e.nativeEvent.value)} /></View>
                </View>
                {isDelayed && <><View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                <TouchableOpacity onPress={onEditDesc}>
                    <View className="flex-row items-center gap-4 px-4 justify-between">
                        <Text className="text-gray-100 text-lg">Public Start Time</Text>
                        <View>
                            <DateTimePicker
                                value={publicStartTimeDate}
                                mode="time"
                                onChange={(_, d) => {
                                    if (d) updateTime({ type: "publicStart", d });
                                }}
                            />
                        </View>
                    </View>
                </TouchableOpacity></>}
                {false && <>
                <Text className="text-red-400">{new Date(event.timeStart * 1000).toLocaleString()}</Text>
                <Text className="text-blue-400">{new Date(event.timeEnd * 1000).toLocaleString()}</Text>
                <Text className="text-green-400">{new Date(event.reservationsStart * 1000).toLocaleString()}</Text>
                {false && <Text className="text-purple-400">{new Date(event.reservationsEnd * 1000).toLocaleString()}</Text>}
                </>}
            </View>
        </View>

        <View className="px-2 pt-4">
            <View className="bg-zinc-900 rounded py-2">
                <TouchableOpacity onPress={onEditLocation}>
                    <View className="flex-row items-center gap-4 px-4 justify-between">
                        <Text className="text-gray-100 text-lg">Location</Text>
                        <Text className={`text-lg ${eventLocation ? "text-gray-400" : "text-red-400"}`}>{eventLocation?.label || "Missing"}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>

        <BottomSheetModal ref={ref} snapPoints={snapPointsUserAdd} backdropComponent={renderBackdrop} handleIndicatorStyle={{ backgroundColor: "gray" }} backgroundStyle={{ backgroundColor: "#111" }}>
            <View className="flex-col justify-between flex-1 pb-20">
                <View>
                    <View className="gap-y-2 pt-4">
                        <Text className="text-xl text-white text-center font-semibold">Select Property</Text>
                        <Text className="text-gray-400 text-center">Select the property for this event.</Text>
                    </View>
                    <Picker
                        itemStyle={{ color: "white" }}
                        selectedValue={event.idLocation || ""}
                        onValueChange={(itemValue, itemIndex) =>
                            update({ idLocation: itemValue })
                        }
                    >
                        <Picker.Item label="Select property" value="" />
                        {locations?.orgs.get.locations.map(l => <Picker.Item key={l.id} label={l.label} value={l.id} />)}
                    </Picker>
                </View>
            </View>
        </BottomSheetModal>

        {isCreated && <View className="px-2 pt-4">
            <View className="bg-zinc-900 rounded py-2">
                <TouchableOpacity onPress={onDeleteEvent}>
                    <View className="flex-row items-center gap-4 px-4">
                        <TrashIcon size={20} color="red" />
                        <Text className="text-red-600 text-lg">Delete Event</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>}

    </ScrollView>
}
