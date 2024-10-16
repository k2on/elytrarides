import React from "react";
import { Pressable, Text } from "react-native";
import Icons from "react-native-vector-icons/MaterialCommunityIcons";

interface ButtonIconProps {
    icon: string;
    color?: string;
    colorPressed?: string;
    size?: number;
    className?: string;
    onPress: () => void;
}
export default function ButtonIcon({
    icon,
    color,
    colorPressed,
    size,
    onPress,
    className
}: ButtonIconProps) {
    return (
        <Pressable onPress={onPress}>
            {({ pressed }) => (
                <Text>
                    <Icons
                        name={icon}
                        color={
                            pressed ? colorPressed || "gray" : color || "white"
                        }
                        size={size || 25}
                    />
                </Text>
            )}
        </Pressable>
    );
}
