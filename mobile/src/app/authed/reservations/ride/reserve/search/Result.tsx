import { Pressable, Text, View } from "react-native";
import {
    ActionType,
    SearchStateResult,
    useGeocodeMutation,
} from "@/shared";
import ResultIcon from "./result/Icon";
import { useContext } from "react";
import { ContextRideDispatch } from "../../context";
import { AuthContext } from "@/app/state";

interface ResultProps {
    result: SearchStateResult;
    onPress: () => void;
}
export default function Result({ result, onPress }: ResultProps) {
    return (
        <Pressable onPress={onPress}>
            {({ pressed }) => (
                <View
                    className={`flex flex-row border-gray-900 border-b-2 items-center px-2 ${
                        pressed ? "bg-zinc-900" : ""
                    }`}
                >
                    <ResultIcon result={result} />
                    <View className="pl-2 py-2">
                        <View>
                            <Text className="text-white">{result.main}</Text>
                        </View>
                        <View>
                            <Text className="text-gray-400">{result.sub}</Text>
                        </View>
                    </View>
                </View>
            )}
        </Pressable>
    );
}
