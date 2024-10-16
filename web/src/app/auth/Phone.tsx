"use client";

import { useEffect, useRef, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { FnSendCode, PhoneType } from "./page";
import Button from "@/components/Button";
import { Logo, en, useSendOtpMutation } from "@/shared";
import client from "@/client";
import View from "@/components/View";
import ViewCentered from "@/components/ViewCentered";
import Text from "@/components/Text";
import MessageError from "@/components/MessageError";
import { ArrowRight } from "lucide-react";
import React from "react";

interface AuthEnterPhoneProps {
    onNext: (phone: string) => void;
}
export default function AuthEnterPhone({ onNext }: AuthEnterPhoneProps) {
    const [phone, setPhone] = useState("");
    const bottomRef = React.createRef<HTMLDivElement>();

    const { mutate, error, isLoading } = useSendOtpMutation(client, {
        onSuccess(data, variables, context) {
            onNext(phone!);
        },
    });

    const onSendCode = () => {
        if (!phone) return;
        mutate({ phone });
    };

    // const bottomBar = document.getElementById("bottombar");
    const viewport = typeof window !== "undefined" ? window.visualViewport : undefined;

    function viewportHandler() {
      if (!bottomRef.current) return;
      if (!viewport) return;
      const layoutViewport = document.getElementsByTagName("body")![0];

      // Since the bar is position: fixed we need to offset it by the visual
      // viewport's offset from the layout viewport origin.
      const offsetLeft = viewport.offsetLeft;
      const offsetTop =
        viewport.height -
        layoutViewport.getBoundingClientRect().height +
        viewport.offsetTop;

      // You could also do this by setting style.left and style.top if you
      // use width: 100% instead.
        bottomRef.current.style.transform = `translate(${offsetLeft}px, ${offsetTop}px) scale(${
            1 / viewport.scale
        })`;
    }

    if (typeof window != "undefined") {
        window.visualViewport!.addEventListener("resize", viewportHandler);
        window.visualViewport!.addEventListener("scroll", viewportHandler);
    }


    useEffect(() => {
        viewportHandler();
    }, [])

    const isDisabled = isLoading || !isValidPhoneNumber(phone || "");

    return (
        <View className="h-fill">
        <ViewCentered>
            <View className="mx-8 text-center">
                <View className="mb-8">
                    <Logo className="mx-auto" size={50} />
                </View>
                <Text className="text-white text-center text-2xl mb-8">
                    What's your <span className="font-semibold italic">number?</span>
                </Text>
                <View className="flex flex-row items-center">
                    <View className="mb-4 mt-4 mx-auto w-[80%]">
                        <View className="p-2 bg-black font-bold text-xl rounded-full border-2 border-purple-800">
                            <PhoneNumberInput
                                onFocus={viewportHandler}
                                isLoading={isLoading}
                                phone={phone}
                                setPhone={setPhone}
                            />
                        </View>
                    </View>
                    <View className="hidden sm:block">
                        <button disabled={isDisabled} onClick={onSendCode} className={`rounded-full p-1 ${isDisabled ? 'bg-gray-800' : 'bg-purple-800'}`}><ArrowRight /></button>
                    </View>
                </View>
                <View className="hidden sm:block text-center absolute w-[300px] left-1/2 -translate-x-1/2">
                    <Text className="text-gray-400 text-xs">By tapping the next arrow you argree to our <a href="https://elytrarides.com/legal" target="_black" className="font-semibold">Terms of Service & Privacy Policy</a></Text>
                </View>
                {!!error && <MessageError msg={en.AUTH_PHONE_BAD} />}
            </View>
        </ViewCentered>
        <div ref={bottomRef} id="bottombar" className="absolute bottom-0 sm:hidden bg-black flex flex-row items-center px-2">
            <View>
                <Text className="text-gray-400 text-xs">By tapping the next arrow you argree to our <a href="https://elytrarides.com/legal" target="_black" className="font-semibold">Terms of Service & Privacy Policy</a></Text>
            </View>
            <View>
                <button disabled={isDisabled} onClick={onSendCode} className={`rounded-full p-1 ${isDisabled ? 'bg-gray-800' : 'bg-purple-800'}`}><ArrowRight /></button>
            </View>
        </div>
        </View>
    );
}

interface PhoneNumberInputProps {
    isLoading: boolean;
    phone: string;
    setPhone: (p: string) => void;
    onFocus: () => void;
}
function PhoneNumberInput({
    isLoading,
    phone,
    onFocus,
    setPhone,
}: PhoneNumberInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <PhoneInput
            disabled={isLoading}
            ref={inputRef}
            placeholder={en.AUTH_PHONE_ENTER_PLACEHOLDER}
            value={phone}
            onChange={setPhone}
            onFocus={onFocus}
            onBlur={onFocus}
            international={false}
            defaultCountry="US"
            countrySelectProps={{ unicodeFlags: true }}
        />
    );
}
