import { View, SafeAreaView } from "react-native";
import React, { useContext } from "react";
import {
    ActionType,
    GetEventQuery,
    ReservationType,
    ReserveLocation,
    StateReserve,
} from "@/shared";
import { ContextRide, ContextRideDispatch } from "../context";
import { Button } from "@/components";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Back from "./search/Back";
import ReorderList from "./order/ReorderList";
import { StopView } from "./order/StopView";

interface OrderProps {}
export default function Order({}: OrderProps) {
    const { reservationType, locations, step } = useContext(ContextRide)!;
    const { event } = step as StateReserve;

    const dispatch = useContext(ContextRideDispatch)!;
    const onClick = () =>
        dispatch({
            type: ActionType.Review,
        });

    const onBack = () =>
        dispatch({
            type: ActionType.BackFromOrder,
        });

    const onAdd = () =>
        dispatch({
            type: ActionType.StopAdd,
        });

    const onRemove: OnRemove = (idx) =>
        dispatch({ type: ActionType.StopRemove, idx });

    const onEdit: OnRemove = (idx) =>
        dispatch({ type: ActionType.StopEdit, idx });

    const insets = useSafeAreaInsets();
    const bottom = insets.bottom + 40;

    const canAdd = reservationType == ReservationType.DROPOFF;

    const stops = makeStops(
        reservationType!,
        locations,
        event,
        canAdd,
        onAdd,
        onRemove,
        onEdit,
    );

    return (
        <View className="flex-1 relative h-screen">
            <SafeAreaView className="bg-zinc-950 absolute top-0 z-20 w-screen">
                <View className="ml-2">
                    <Back onPress={onBack} />
                </View>
                <RouteStops key={JSON.stringify(stops)} stops={stops} />
            </SafeAreaView>
            <SafeAreaView
                style={{ bottom }}
                className="bg-zinc-950 absolute z-20 w-screen"
            >
                <View className="px-4 py-5">
                    <Button onClick={onClick} title="Done" />
                </View>
            </SafeAreaView>
        </View>
    );
}

const ICON_CIRCLE = "circle";
const ICON_SQUARE = "square";
const ICON_PLUS = "plus";
const ICON_NUMERIC = "numeric-";

type OnRemove = (idx: number) => void;
type OnEdit = (idx: number) => void;
type OnAdd = () => void;

function makeStops(
    reservationType: ReservationType,
    locations: ReserveLocation[],
    event: GetEventQuery["events"]["get"],
    canAdd: boolean,
    onAdd: OnAdd,
    onRemove: OnRemove,
    onEdit: OnEdit,
): RouteStop[] {
    const stops: RouteStop[] = [];
    const eventLocation = event.location?.label || "Event Location";

    if (reservationType == ReservationType.DROPOFF) {
        stops.push({
            text: eventLocation,
            icon: ICON_CIRCLE,
        });
    }

    locations.forEach((location, idx) => {
        stops.push({
            location,
            text: location.main,
            icon:
                reservationType == ReservationType.PICKUP
                    ? ICON_CIRCLE
                    : idx == locations.length - 1
                    ? ICON_SQUARE
                    : `${ICON_NUMERIC}${idx + 1}`,
            isMovable: true,
            onRemove: () => onRemove(idx),
            onPress: () => onEdit(idx),
        });
    });

    if (reservationType == ReservationType.PICKUP) {
        stops.push({
            text: eventLocation,
            isLast: true,
            icon: ICON_SQUARE,
            onPress: () => console.log("hi"),
        });
    }

    if (canAdd) {
        stops.push({
            text: "Add stop",
            icon: ICON_PLUS,
            isLast: true,
            onPress: onAdd,
            color: "#aaa",
        });
    }
    return stops;
}

export interface RouteStop {
    text: string;
    isMovable?: boolean;
    icon: string;
    isLast?: boolean;
    color?: string;
    location?: ReserveLocation;
    onPress?: () => void;
    onRemove?: () => void;
}

interface RouteStopsProps {
    stops: RouteStop[];
    // onReorder: OnReorder;
}
function RouteStops({ stops }: RouteStopsProps) {
    const dispatch = useContext(ContextRideDispatch)!;

    const setStops = (s: RouteStop[]) =>
        dispatch({
            type: ActionType.SetStops,
            stops: s.map((stop) => stop.location!),
        });

    const onDragEnd = () =>
        dispatch({
            type: ActionType.IsReorderingSet,
            val: false,
        });

    const non_orderable_stop = stops.find(
        (stop) => !stop.isMovable && !stop.isLast,
    );
    const stopsMovable = stops.filter((stop) => stop.isMovable && !stop.isLast);
    const last_stop = stops.find((stop) => stop.isLast)!;

    return (
        <View>
            {non_orderable_stop && (
                <StopView stop={non_orderable_stop} isDragging={false} />
            )}
            <View className="relative">
                <ReorderList
                    data={stopsMovable}
                    onDragEnd={onDragEnd}
                    // @ts-ignore
                    setStops={(s) => setStops(s)}
                />
            </View>
            <StopView stop={last_stop} isDragging={false} />
        </View>
    );
}

interface StopMovableProps {
    stop: RouteStop;
    drag?: () => void;
    isDragged?: boolean;
    anyDragged?: boolean;
}
