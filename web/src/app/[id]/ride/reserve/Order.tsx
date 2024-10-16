import View from "@/components/View";
import React, { useContext, useState } from "react";
import { ContextRide, ContextRideDispatch } from "../context";
import {
    ActionType,
    GetEventQuery,
    ReservationType,
    ReserveLocation,
    StateReserve,
} from "@/shared";
import Button from "@/components/Button";
import {
    DragDropContext,
    Draggable,
    Droppable,
    DropResult,
} from "react-beautiful-dnd";
import Icon from "@mdi/react";
import {
    mdiCircle,
    mdiClose,
    mdiMenu,
    mdiNumeric1, // ew
    mdiNumeric10,
    mdiNumeric2,
    mdiNumeric3,
    mdiNumeric4,
    mdiNumeric5,
    mdiNumeric6,
    mdiNumeric7,
    mdiNumeric8,
    mdiNumeric9,
    mdiPlus,
    mdiSquare,
} from "@mdi/js";
import ButtonIcon from "@/components/ButtonIcon";
import Back from "./search/Back";
import sendEvent, { EVENT_REORDER_LOCATIONS } from "@/app/analytics";

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

    const setStops = (s: RouteStop[]) =>
        dispatch({
            type: ActionType.SetStops,
            stops: s.map((stop) => stop.location!),
        });

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
        <View>
            <View
                id="overlay-top"
                className="bg-zinc-950 absolute top-0 z-20 w-screen py-4"
            >
                <View className="ml-3">
                    <Back onPress={onBack} />
                </View>
                <RouteStops
                    stops={stops}
                    setStops={(s) => {
                        // @ts-ignore
                        setStops(s);
                    }}
                />
            </View>
            <View
                id="overlay-bottom"
                className="bg-zinc-950 absolute z-20 bottom-0 w-full p-4"
            >
                <Button onClick={onClick} title="Done" />
            </View>
        </View>
    );
}

const ICON_CIRCLE = mdiCircle;
const ICON_SQUARE = mdiSquare;
const ICON_PLUS = mdiPlus;
const ICON_MOVE = mdiMenu;
const ICON_REMOVE = mdiClose;

const ICON_NUMBERS = [ // ew
    mdiNumeric1,
    mdiNumeric2,
    mdiNumeric3,
    mdiNumeric4,
    mdiNumeric5,
    mdiNumeric6,
    mdiNumeric7,
    mdiNumeric8,
    mdiNumeric9,
    mdiNumeric10,
];

type OnRemove = (idx: number) => void;
type OnEdit = (idx: number) => void;
type OnAdd = () => void;

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
                    : ICON_NUMBERS[idx],
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
            color: "text-gray-400",
        });
    }
    return stops;
}

interface RouteStopsProps {
    stops: RouteStop[];
    setStops: React.Dispatch<React.SetStateAction<RouteStop[]>>;
}
export function RouteStops({ stops, setStops }: RouteStopsProps) {
    const dispatch = useContext(ContextRideDispatch)!;

    const non_orderable_stops = stops.filter(
        (stop) => !stop.isMovable && !stop.isLast,
    );
    const orderable_stops = stops.filter(
        (stop) => stop.isMovable && !stop.isLast,
    );
    const last_stop = stops.find((stop) => stop.isLast)!;
    const [is_dragging, is_dragging_set] = useState(false);

    const on_drag_end = (result: DropResult) => {
        if (!result.destination) return;

        sendEvent(EVENT_REORDER_LOCATIONS);

        const new_locations = orderable_stops;
        const [removed] = new_locations.splice(result.source.index, 1);
        new_locations.splice(result.destination!.index, 0, removed);

        setStops([...new_locations]);
    };

    const onDragStart = () =>
        dispatch({ type: ActionType.IsReorderingSet, val: true });

    return (
        <View>
            {non_orderable_stops.map((stop, idx) => (
                <RouteStopView key={idx} stop={stop} />
            ))}
            <DragDropContext onDragStart={onDragStart} onDragEnd={on_drag_end}>
                <Droppable droppableId="stops">
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {orderable_stops.map((stop, idx) => (
                                <Draggable
                                    key={stop.text.replace(/\s/g, "-")}
                                    draggableId={stop.text.replace(/\s/g, "-")}
                                    index={idx}
                                    isDragDisabled={false}
                                >
                                    {(provided, snapshot) => {
                                        return (
                                            <div
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                ref={provided.innerRef}
                                            >
                                                <RouteStopView
                                                    stop={stop}
                                                    is_dragging={
                                                        snapshot.isDragging
                                                    }
                                                />
                                            </div>
                                        );
                                    }}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            <RouteStopView stop={last_stop} />
        </View>
    );
}

interface RouteStopViewProps {
    stop: RouteStop;
    is_dragging?: boolean;
}
function RouteStopView({ stop, is_dragging }: RouteStopViewProps) {
    const { step } = useContext(ContextRide)!;
    const { isReordering } = step as StateReserve;

    return (
        <View className="flex flex-row w-full flex-1 mb-3 items-center">
            <View
                className={`${
                    isReordering ? "opacity-0" : "opacity-100"
                } flex-1 text-center relative`}
            >
                <View className="flex flex-1 items-center justify-center">
                    <Icon
                        className="text-gray-400 active:text-gray-500"
                        size={0.5}
                        path={stop.icon}
                    />
                    {!stop.isLast && (
                        <View className="bg-gray-400 absolute h-4 w-[2px] mx-auto top-6">
                            {null}
                        </View>
                    )}
                </View>
            </View>
            <View className="w-3/4">
                <View
                    className={`flex items-center w-full p-2 bg-zinc-900 rounded ${
                        stop.color || "text-white"
                    }`}
                    onClick={stop.onPress}
                >
                    {stop.text}
                    {stop.isMovable && (
                        <Icon
                            size={1}
                            color={is_dragging ? "white" : "gray"}
                            className="flex items-center ml-auto"
                            path={ICON_MOVE}
                        />
                    )}
                </View>
            </View>
            <View
                className={`flex items-center flex-1 justify-center ${
                    isReordering ? "opacity-0" : "opacity-100"
                }`}
            >
                {stop.onRemove && (
                    <ButtonIcon icon={ICON_REMOVE} onPress={stop.onRemove} />
                )}
            </View>
        </View>
    );
}
