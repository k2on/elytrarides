import { Text } from "react-native";

interface MessageErrorProps {
    msg: string;
}
export default function MessageError({ msg }: MessageErrorProps) {
    return <Text className="text-xl text-red-600">{msg}</Text>;
}

