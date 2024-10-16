import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState, useContext, useMemo, useEffect } from "react";
import { View, TextInput, Image, Text, KeyboardAvoidingView, Platform, SafeAreaView, Linking, ActivityIndicator } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { en, useSendOtpMutation } from "@/shared";
import { URL_BASE, URL_PROD } from "@/app/state";
import IMAGES from "@/images";
import { AuthContext } from "@/app/state";
import { StackRootParamList } from "@/app/navigation";
import { MessageError, Button, ViewCentered } from "@/components";
import { TouchableOpacity } from "react-native-gesture-handler";
import Icons from "react-native-vector-icons/MaterialCommunityIcons";
import usePhoneNumberInput, { PhoneNumberInput } from "./phone/PhoneNumberInput";

type PropsNumberEnter = NativeStackScreenProps<
    StackRootParamList,
    "NumberEnter"
>;
export function Phone({ navigation }: PropsNumberEnter) {
    const { getClient, onLoad } = useContext(AuthContext)!;
    const client = getClient();

    const manager = usePhoneNumberInput({ darkMode: true });
    const phone = manager.getNumber();

    const { mutate, error, isLoading } = useSendOtpMutation(client, {
        onSuccess(data, variables, context) {
            if (!phone) return;
            navigation.navigate("NumberVerfiy", { phone });
        },
    });


    const onSendCode = () => {
        if (!phone) return;
        mutate({ phone });
    };

    const openURL = () => {
      const url = "https://elytrarides.com/legal";
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            console.log(`Don't know how to open this URL: ${url}`);
          }
        })
        .catch((err) => console.error('An error occurred', err));
    };

    useEffect(() => {
        setTimeout(() => {
            onLoad();
        }, 100)
    }, []);

    return (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS == "ios" ? 'padding' : 'height'}>
            <SafeAreaView className="flex-1 justify-between">
                <ViewCentered className="mx-8">
                    <MessageDevBuild />
                    <View className="mb-4">
                        <Logo size={70} />
                    </View>
                    <View>
                        <Text className="text-white text-center text-3xl mb-8">
                            {"What's your "}
                            <Text className="font-bold italic">number?</Text>
                        </Text>
                    </View>
                    <View className="mb-4">
                        <PhoneNumberInput manager={manager} />
                    </View>
                    {!!error && <MessageError msg={en.AUTH_PHONE_BAD} />}
                </ViewCentered>
                <View className="flex flex-row w-full items-center px-4 py-2">
                    <View className="w-5/6 flex">
                        <Text className="text-gray-400 text-xs">By tapping the next arrow you agree to our <Text onPress={openURL} className="text-xs text-gray-400 font-bold">Terms of Service & Privacy Policy</Text></Text>
                    </View>
                    <View className="w-1/6">
                            <TouchableOpacity onPress={onSendCode} className="ml-auto">
                                <View className={`rounded-full justify-around h-10 w-10 p-2 ${manager.isValid() ? 'bg-purple-800' : 'bg-gray-800'}`}>
                                    {isLoading ? <ActivityIndicator size="small" /> : <Icons
                                       name="arrow-right"
                                        color="white"
                                        size={25}
                                    />}
                                </View>
                            </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

function Logo({ size }: { size: number }) {
    return (
        <Image
            className="mx-auto"
            source={IMAGES.logo}
            style={{ width: size, height: size }}
        />
    );
}

function MessageDevBuild() {
    if (URL_BASE == URL_PROD) return null;
    return (
        <Text className="text-yellow-400 text-center">
            DEV BUILD @ {URL_BASE}
        </Text>
    );
}

