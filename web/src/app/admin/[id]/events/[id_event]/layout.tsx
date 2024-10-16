"use client";

import client from "@/client";
import View from "@/components/View";
import { Button } from "@/components/ui/button";
import { COLOR_GRAY_500, COLOR_PURPLE_500 } from "@/const";
import { useGetEventQuery } from "@/shared";
import { mdiCar, mdiDatabase, mdiGauge } from "@mdi/js";
import { Car, Check, Clipboard, Globe, Home, Lock, LucideIcon, Ticket, Users2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, createElement, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { Timer } from "./map/ActiveStop";


interface Props {
    children: React.ReactNode;
    params: { id: string, id_event: string };
}
export default function({ children, params }: Props) {
    const { id, id_event } = params;
    const pathFull = usePathname();
    const path = pathFull.split(id_event).at(1) || "/";
    const [isCopied, setIsCopied] = useState(false);

    const LinkEvent = ({ href, children, icon }: { href: string, children: string, icon: LucideIcon }) => {
        const isSelected = href == "/" ? path == href : path.startsWith(href);

        return <Link className={`flex items-center gap-2 pb-2 border-purple-500 ${isSelected ? "border-b-2" : ""}`} href={`/admin/${id}/events/${id_event}${href}`}>
            {createElement(icon, { className: "h-4 w-4", color: isSelected ? COLOR_PURPLE_500 : COLOR_GRAY_500 })}
            <span className={`${isSelected ? "text-white" : "text-gray-200"} hover:text-white`}>{children}</span>
        </Link>;
    }

    const { data, isLoading, isError, error } = useGetEventQuery(client, { id: id_event }, {
        retry(failureCount, error) {
            if ((error as any).response?.errors[0].message == "Record not found") return false;
            return failureCount < 3;
        },
        staleTime: Infinity,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
    });

    const onCopy = () => {
        navigator.clipboard.writeText(`${window.location.origin}/${id_event}`);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1000);
    }

    const isNewEvent = !isLoading && isError;

    
    const start = data && new Date(data.events.get.timeStart * 1000);
    const end = data && new Date(data.events.get.timeEnd * 1000);
    const now = new Date();

    const isUpcoming = data?.events.get.publishedAt && end && start?.getDate() == now.getDate() && now.getTime() < end.getTime();
    const inProgress = data?.events.get.publishedAt && start && start.getTime() < now.getTime() && end && now.getTime() < end.getTime();

    return <View>
        <View>
            <View className="w-full border-b border-zinc-900 px-6 pt-4">
                <View className="flex items-center gap-4">
                    <h1 className="text-2xl">{isLoading ? <Skeleton width={140} /> : isNewEvent ? "New Event" : data!.events.get.name}</h1>
                    <Button onClick={onCopy} variant="outline">
                        {isCopied
                        ? <><Check className="mr-2 h-4 w-4" /> Copied</>
                        : <><Clipboard className="mr-2 h-4 w-4" /> Copy Link</>}
                    </Button>
                    {isLoading ? <Skeleton width={100} /> : inProgress ? <>{"Ends in "}<Timer start={end} /></> : isUpcoming ? <>{"Starts in "}<Timer start={start} /></> : data?.events.get.publishedAt ? <View className="flex flex-row items-center space-x-2 text-gray-400"><Globe className="w-4 h-4" /> <span>Published</span></View> : <View className="flex flex-row items-center space-x-2 text-gray-400"><Lock className="w-4 h-4" /> <span>Not Published</span></View>}
                </View>

                <ul className="flex flex-row gap-8 pt-4">
                    <LinkEvent icon={Home} href="/">Overview</LinkEvent>
                    <LinkEvent icon={Ticket} href="/edit">Invitation</LinkEvent>
                </ul>
            </View>
        </View>
        <View>
            {children}
        </View>
    </View>

}
