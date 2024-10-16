import { useState } from "react";
import { formatPhoneNumber } from "react-phone-number-input";
import OTPInput from "react-otp-input";
import { OTP_LENGTH, en, useVerifyOtpMutation } from "@/shared";
import client from "@/client";
import { auth_token_set } from "@/store";
import MessageError from "@/components/MessageError";
import View from "@/components/View";
import ViewCentered from "@/components/ViewCentered";
import Text from "@/components/Text";

interface AuthEnterCodeProps {
    phone: string;
    back: () => void;
}
export default function AuthEnterPhone({ phone, back }: AuthEnterCodeProps) {
    const [code, setCode] = useState("");

    const { mutate, isLoading, error } = useVerifyOtpMutation(client, {
        onSuccess(data, variables, context) {
            const token = data.auth.verifyOtp;

            const location = window.location.href.includes("?r=")
                ? window.location.href.split("?r=")[1]
                : "/";

            console.log(location);
            console.log(decodeURI(location));

            auth_token_set(token);
            window.location.href = decodeURIComponent(location);
        },
    });

    return (
        <ViewCentered>
            <View className="mx-8 text-center">
                <Text className="text-white text-center text-2xl mb-4 block">
                    What's your <span className="font-semibold italic">code?</span>
                </Text>
                <Text className="text-gray-400 text-center text-sm mb-8 block">
                    {`${en.AUTH_CODE_SENT}${formatPhoneNumber(phone)}!`}
                </Text>
                <View className="mb-4">
                    <View className="p-2 bg-black font-bold text-xl rounded-full border-2 border-purple-800 w-fit mx-auto">
                        <input className="text-center mx-2 bg-transparent w-[90px] outline-none" placeholder="123-456" autoFocus disabled={isLoading} value={code} onChange={(e) => {
                            const code = e.target.value;
                            setCode(code);
                            if (code.length != OTP_LENGTH) return;
                            mutate({ phone, code });
                        }}
                        />
                    </View>
                </View>
                {!!error && <MessageError msg={en.AUTH_CODE_BAD} />}
            </View>
        </ViewCentered>
    );
}

interface CodeInputProps {
    isLoading: boolean;
    code: string;
    setCode: (c: string) => void;
}
function CodeInput({ isLoading, code, setCode }: CodeInputProps) {
    return (
        <OTPInput
            isDisabled={isLoading}
            value={code}
            onChange={setCode}
            numInputs={OTP_LENGTH}
            separator="-"
            shouldAutoFocus={true}
            isInputNum={true}
            inputStyle={
                {
                    fontSize: "1.5em",
                    background: "none",
                    border: "#aaa 2px solid",
                    color: "white",
                    margin: "0 .2em",
                    borderRadius: ".2em",
                } as React.CSSProperties
            }
        />
    );
}
