import { Pressable, Text } from "react-native";
import { Colors } from "@/app/colors";

interface BigButtProps {
    title: string;
    disabled?: boolean;
    is_loading?: boolean;
    on_click?: () => void;
}
export default function BigButt({ title, is_loading, on_click, disabled }: BigButtProps) {
    return <Pressable style={{
            backgroundColor: disabled ? "#555" : Colors.PRIMARY,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 100,
            marginHorizontal: 32,
        }} disabled={is_loading || disabled} onPress={on_click}><Text style={{
                color: disabled ? "#aaa": "white",
                padding: 20,
                fontWeight: 'bold',
                fontSize: 20,
            }}>{is_loading ? "loading..." : title}</Text></Pressable>
}
