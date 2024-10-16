import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState, useContext, useEffect } from "react";
import { View, TextInput, Text, KeyboardAvoidingView, Platform, SafeAreaView, Alert, Keyboard } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { OTP_LENGTH, en, useVerifyOtpMutation } from "@/shared";
import { AuthContext } from "@/app/state";
import { StackRootParamList } from "@/app/navigation";
import { ViewCentered, MessageError } from "@/components";
import useCodeInput, { CodeInput } from "./code/CodeInput";
import parsePhoneNumberFromString, { formatNumber, parsePhoneNumber } from "libphonenumber-js";

type PropsCodeEnter = NativeStackScreenProps<
    StackRootParamList,
    "NumberVerfiy"
>;
export function Code({ navigation, route }: PropsCodeEnter) {
    // const [code, setCode] = useState("");
    const phone = route.params.phone;

    const manager = useCodeInput();
    const code = manager.getCode();

    const { getClient, setToken } = useContext(AuthContext)!;
    const client = getClient();

    const { mutate, error, isLoading } = useVerifyOtpMutation(client, {
        onSuccess(data, variables, context) {
            const token = data.auth.verifyOtp;
            setToken(token);
        },
        onError(error) {
            Alert.alert("Invalid code, please try again.")
            // manager.dispatch({ type: 'processInput', payload: '' });
        }
    });

    useEffect(() => {
        if (manager.isValid()) {
            Keyboard.dismiss();
            mutate({ phone, code });
        }
    }, [manager.isValid()])

    const resendOTP = () => {
        Alert.alert("This feature is in progress, please restart the app to send another code.");
    }

    return (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS == "ios" ? 'padding' : 'height'}>
            <SafeAreaView className="flex-1 justify-between">
                <ViewCentered>
                    <View className="mx-8">
                        <Text className="text-white text-center text-3xl">
                            {"Enter your "}
                            <Text className="font-bold italic">code</Text>
                        </Text>
                        <Text className="text-gray-400 text-center text-sm mb-8 mt-2">
                            {`${en.AUTH_CODE_SENT}${formatPhoneNumber(phone)}!`}
                        </Text>
                        <View className="mb-4">
                            <CodeInput isLoading={isLoading} manager={manager} />
                        </View>
                    </View>
                </ViewCentered>
                <View className="flex flex-row w-full items-center px-4 py-4">
                    <View className="flex">
                        <Text className="text-gray-400 text-xs">Did't get a code? <Text onPress={resendOTP} className="text-xs text-gray-400 font-bold">Tap to resend</Text></Text>
                    </View>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

function formatPhoneNumber(number: string) {
    const phone = parsePhoneNumberFromString(number);
    if (phone) {
        return phone.formatNational();
    } else {
        return number;
    }
}

const isValidCode = (code: string) => code.length == OTP_LENGTH;

