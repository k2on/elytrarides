import React, { useContext } from "react";
import { View, Pressable, Text } from "react-native";
import { ButtonIcon } from "@/components";
import { RouteStop } from "../Order";
import { ContextRide } from "../../context";
import Icons from "react-native-vector-icons/MaterialCommunityIcons";
import { StateReserve } from "@/shared";

interface StopViewProps {
    stop: RouteStop;
    isDragging: boolean;
    drag?: () => void;
}
export function StopView({ stop, drag, isDragging }: StopViewProps) {
    const { step } = useContext(ContextRide)!;
    const { isReordering } = step as StateReserve;

    return (
        <View className="flex-row flex-1 w-full mb-3">
            <View
                className={`flex-1 ${
                    isReordering ? "opacity-0" : "opacity-100"
                }`}
            >
                <View className="flex-1 items-center justify-center">
                    <Icons
                        size={stop.icon.startsWith("numeric-") ? 20 : 10}
                        color="gray"
                        name={stop.icon}
                    />
                    {!stop.isLast && (
                        <View className="bg-gray-400 absolute h-4 w-[2px] mx-auto top-6"></View>
                    )}
                </View>
            </View>
            <View className="w-3/4">
                <Pressable
                    onLongPress={drag}
                    delayLongPress={100}
                    onPress={stop.onPress}
                >
                    <View className="bg-zinc-900 py-1 px-2 rounded flex-row justify-between">
                        <Text style={{ color: stop.color || "white" }}>
                            {stop.text}
                        </Text>
                        {stop.isMovable && (
                            <Icons
                                size={20}
                                style={{
                                    right: 0,
                                    color: isDragging ? "white" : "gray",
                                }}
                                name={"menu"}
                            />
                        )}
                    </View>
                </Pressable>
            </View>
            <View
                className={`flex-1 items-center ${
                    isReordering ? "opacity-0" : "opacity-100"
                }`}
            >
                {stop.onRemove && (
                    <ButtonIcon icon="close" onPress={stop.onRemove} />
                )}
            </View>
        </View>
    );
}
