"use client";

import { useSendOtpMutation } from "@/shared";
import { FC, useState } from "react";
import client from "@/client";
import { E164Number } from "libphonenumber-js/types";
import AuthEnterPhone from "./Phone";
import AuthEnterCode from "./Code";
import View from "@/components/View";
import BGEffect from "@/components/BGEffect";

enum AuthScreen {
    Phone,
    Code,
}
export type PhoneType = E164Number | undefined;
export type FnSendCode = (phone: string) => void;

interface PageProps {}
const Page: FC<PageProps> = ({}) => {
    const def = (
        <AuthEnterPhone
            onNext={(phone) =>
                setScreen(
                    <AuthEnterCode phone={phone} back={() => setScreen(def)} />,
                )
            }
        />
    );
    const [screen, setScreen] = useState(def);

    return <div className="h-fill">
        <View className="relative z-20 h-fill">{screen}</View>
        <BGEffect />
    </div>;
};

export default Page;
