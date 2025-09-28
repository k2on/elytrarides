"use client"

import View from "@/components/View"
import Text from "@/components/Text"
import { Event, useGetEventEstimateWithoutLocationQuery, useGetMeAccountQuery, useGetMeMembershipsQuery } from "@/shared"
import BGEffect from "./BGEffect";
import { formatTime } from "@/app/admin/[id]/events/[id_event]/map/ActiveStop";
import { useEffect, useState } from "react";
import { ArrowRight, Calendar, Check, Clock, Share, Users2 } from "lucide-react";
import client from "@/client";
import Skeleton from "react-loading-skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Account from "@/app/[id]/ride/Account";
import { AccountWelcome } from "@/app/[id]/ride/reserve/ReservationTypePicker";
import { auth_token_get } from "@/store";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "./ui/use-toast";

function getDateStr(start: Date) {
    const now = new Date();

    if (now.toLocaleDateString() == start.toLocaleDateString()) return "Today";
    return start.toLocaleDateString();
}

interface InviteEventProps {
    event: Event;
}
export default function EventInvite({ event }: InviteEventProps) {
    const now = Math.floor(new Date().getTime() / 1000);
    const [seconds, setSeconds] = useState(event.timeStart - now);
    const [isClient, setIsClient] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { data: me, isLoading } = useGetMeMembershipsQuery(client);
    const { toast } = useToast();

    const isMember = me && me.users.me.memberships.some(membership => membership.org.id == event.idOrg) || false;

    const isStarted = seconds <= 0;
    const isEnded = now > event.timeEnd;
    const isActive = isStarted && !isEnded;
    
    const showMemberLogin = !isEnded && !isStarted;

    const imageUrl = "https://pastorjeffdavis.com/wp-content/uploads/2020/07/oakwood.jpeg";

    const start = new Date(event.timeStart * 1000);
    const startPublic = new Date(event.reservationsStart * 1000);
    const dateStr = getDateStr(start);
    const timeStr = isMember ? start.toLocaleTimeString() : startPublic.toLocaleTimeString();

    const { data } = useGetEventEstimateWithoutLocationQuery(client, { id: event.id }, { enabled: isActive, refetchInterval: 1000 * 30 });

    const est = data?.events.get.estimateWithoutLocation;
    const stopsEta = est && est.stopEtas.at(-1)?.eta;
    const timeEst = stopsEta && Math.round(stopsEta) + " min wait";

    useEffect(() => {
        setIsClient(true);

        const updateSeconds = () => {
            const now = Math.floor(new Date().getTime() / 1000);
            const secondsBetween = (isMember ? event.timeStart : event.reservationsStart) - now;
            setSeconds(secondsBetween);
        };

        updateSeconds();

        const intervalId = setInterval(updateSeconds, 1000);

        return () => clearInterval(intervalId); 
    }, [isMember]);

    if (!isClient) {
        return <div>Loading...</div> // show some card information
    }

    const onShare = () => {
        if (navigator.share) {
            navigator.share({
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href).then(() => {
                toast({ description: "Link copied to clipboard" });
                setIsCopied(true);
                setTimeout(() => {
                    setIsCopied(false);
                }, 2000);
            })
        }
    }

    return (
        <View className="w-full p-4 max-w-lg">
            <View className="z-10 relative bg-zinc-950 border rounded">
                {false && <View className="h-52 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }}></View>}
                <View className="p-4">
                    <View className="text-gray-400 text-sm"><span className="font-serif">{event.org.label}</span> · {event.org.bio}</View>
                    <View className="text-xl mt-2">{event.name}</View>
                    <View className="text-gray-400">{event.bio}</View>
                    <ul className="mt-4 space-y-2">
                        <li className="text-gray-400 flex flex-row items-center space-x-2"><Calendar className="w-4 h-4" /> <span>{dateStr} · {timeStr}</span></li>
                        {isActive && <>
                            <li className="text-gray-400 flex flex-row items-center space-x-2"><Clock className="w-4 h-4" /> <span>{est ? timeEst : <Skeleton width={100} />}</span></li>
                            <li className="text-gray-400 flex flex-row items-center space-x-2"><Users2 className="w-4 h-4" /> <span>{est ? <>{est.queuePosition} {est.queuePosition == 1 ? "person" : "people"} in queue</> : <Skeleton width={140} />}</span></li>
                        </>}
                    </ul>
                    <View className="mt-4 flex space-x-2">
                        {isEnded ? (
                            <Button disabled={true} className="w-full">Event has ended</Button>
                        ) : isStarted ? (
                            <>
                                <Link className="w-full" href={event.id + "/ride"}>
                                    <Button className="w-full bg-purple-800 hover:bg-purple-900 text-white hover:text-gray-200">Get a Ride</Button>
                                </Link>
                                <Button onClick={onShare} disabled={isCopied} variant="outline" className="border-2">{isCopied ? <Check className="w-6 h-6"/> : <Share className="w-6 h-6"/>}</Button>
                            </>
                        ) : (
                            <Button disabled={true} className="w-full">Starts in {formatTime(seconds)}</Button>
                        )}
                    </View>
                </View>
            </View>
            <View className="fixed left-0 z-20 bottom-8 w-full text-center">
                {auth_token_get() ? (
                    <Account trigger={<AccountWelcome />} />
                ) : showMemberLogin && (
                    <Link href={`/auth?r=${window.location.href}`}>
                        <View className="w-fit mx-auto flex flex-col space-y-2">
                            <View>
                                Member of {event.org.bio || "this organization"}?
                            </View>
                            <View>
                                <ArrowRight className="mx-auto" />
                            </View>
                        </View>
                    </Link>
                )}
            </View>
            <BGEffect />
        </View>
    );
}

