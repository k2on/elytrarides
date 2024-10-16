import { TextInput } from "react-native";

interface InputProps {
    value: string;
    placeholder: string;
    setValue: (v: string) => void;
}
export function Input({ value, placeholder, setValue }: InputProps) {
    return (
        <TextInput
            value={value}
            onChangeText={setValue}
            className="text-white flex-1"
            autoFocus
            placeholderTextColor="gray"
            placeholder={placeholder}
        />
    );
}
