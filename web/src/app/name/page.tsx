"use client";

import { FC, useEffect, useState } from "react";
import client from "@/client";
import View from "@/components/View";
import Text from "@/components/Text";
import Button from "@/components/Button";
import ViewCentered from "@/components/ViewCentered";
import { en, useGetMeAccountQuery, useUpdateAccountMutation } from "@/shared";
import MessageError from "@/components/MessageError";
import ScreenLoading from "@/components/ScreenLoading";
import { getImageId } from "@/lib";

const NO_NAME = "Anonymous";

const isValidName = (name: string) => name.trim().length > 0

interface PageProps {}
const Page: FC<PageProps> = ({}) => {
    const [name, setName] = useState("");

    const { data, isLoading, error } = useGetMeAccountQuery(client, undefined, {
        onSuccess(data) {
            const name = data.users.me.name;
            if (name != NO_NAME) setName(name);
        },
    });
    const { mutate, isLoading: isLoadingMutation } = useUpdateAccountMutation(client, {
        onSuccess() {
            const location = window.location.href.includes("?r=")
                ? window.location.href.split("?r=")[1]
                : "/";

            window.location.href = location;
        },
    })

    const onClick = () => mutate({ name, profileImage: getImageId(data?.users.me.imageUrl) });

    return isLoading ? <ScreenLoading /> : <ViewCentered>
            <View className="w-[80%] md:w-64">
                <Text className="block text-white font-semibold text-center text-2xl mb-8">
                    {data?.users.me.name == NO_NAME ? en.NAME_ENTER : en.NAME_CHANGE}
                </Text>
                <View className="mb-4">
                    <View className="bg-zinc-800 p-2 rounded-sm">
                        <input placeholder="Name..." className="bg-transparent w-full" value={name} onChange={(e) => setName(e.target.value)} />
                    </View>
                </View>
                {!!error && <MessageError msg={en.NAME_BAD} />}
                <Button
                    title={
                        isLoading || isLoadingMutation ? en.NAME_LOADING : en.NAME_NEXT
                    }
                    onClick={onClick}
                    disabled={isLoading || isLoadingMutation || !isValidName(name || "")}
                />
            </View>
        </ViewCentered>
};

export default Page;
