import { Text, TouchableOpacity } from "react-native";

interface ButtonProps {
    title: string;
    onClick: () => void;
    disabled?: boolean;
}
export default function Button({ title, disabled, onClick }: ButtonProps) {
    return (
        <TouchableOpacity
            className={`w-full py-2 rounded-sm
        ${disabled ? "bg-zinc-800" : "bg-purple-800"}`}
            disabled={disabled}
            onPress={onClick}
        >
            <Text
                className={`text-center ${
                    disabled ? "text-gray-500" : "text-white"
                }`}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
}
