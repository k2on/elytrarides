import React, { useContext } from "react";
import DraggableFlatList, {
    ScaleDecorator,
    RenderItemParams,
} from "react-native-draggable-flatlist";
import { RouteStop } from "../Order";
import { ContextRideDispatch } from "../../context";
import { ActionType } from "@/shared";
import { StopView } from "./StopView";

interface ReorderListProps {
    data: RouteStop[];
    onDragEnd: () => void;
    setStops: React.Dispatch<React.SetStateAction<RouteStop[]>>;
}
export default function ReorderList({
    data,
    setStops,
    onDragEnd,
}: ReorderListProps) {
    const renderItem = ({
        item,
        drag,
        isActive,
    }: RenderItemParams<RouteStop>) => {
        const dispatch = useContext(ContextRideDispatch)!;

        return (
            <ScaleDecorator>
                <StopView
                    stop={item}
                    drag={() => {
                        dispatch({
                            type: ActionType.IsReorderingSet,
                            val: true,
                        });
                        drag();
                    }}
                    isDragging={isActive}
                />
            </ScaleDecorator>
        );
    };

    return (
        <DraggableFlatList
            data={data}
            onDragEnd={({ data }) => setStops(data)}
            keyExtractor={(item) => item.text}
            renderItem={renderItem}
            onRelease={onDragEnd}
        />
    );
}
