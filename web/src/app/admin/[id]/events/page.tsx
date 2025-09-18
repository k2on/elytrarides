"use client";

import client from "@/client";
import AlertError from "@/components/AlertError";
import View from "@/components/View";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GetOrgEventsQuery, useGetOrgEventsQuery } from "@/shared";
import { mdiCalendarPlus } from "@mdi/js";
import Icon from "@mdi/react";
import { AlertCircle, Calendar, CalendarPlus, Clipboard, Clock, Globe, Lock, MapPin, MoreVertical, PlayCircle, XOctagon } from "lucide-react";
import Link from "next/link";
import { FC } from "react";
import Skeleton from "react-loading-skeleton";
import { v4 } from "uuid";
import { formatTime } from "./[id_event]/util";
import { Timer } from "./[id_event]/map/ActiveStop";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useParams } from "next/navigation";

interface EventsProps {
    params: { id: string };
}

const events: FC<EventsProps> = ({ params }) => {
    const { id } = params;

    const onNewEvent = () => {
        window.location.href += `/${v4()}/edit`;
    };

    return <View className="max-w-3xl mx-auto py-8">
        <Tabs defaultValue="upcoming">
            <Card>
                <CardHeader>
                    <CardTitle>Events</CardTitle>
                    <CardDescription>Manage all your events.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={onNewEvent}>
                        <CalendarPlus className="mr-2 h-4 w-4" /> New Event
                    </Button>
                    <br />
                    <br />
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                      <TabsTrigger value="past">Past</TabsTrigger>
                    </TabsList>
                </CardContent>
            </Card>
            <TabsContent value="upcoming">
                <UpcomingEvents id={id} />
            </TabsContent>
            <TabsContent value="past">
                <PastEvents id={id} />
            </TabsContent>
        </Tabs>
    </View>
};

interface UpcomingEventsParams {
    id: string;
}
function UpcomingEvents({ id }: UpcomingEventsParams) {
    const { isLoading, data, error } = useGetOrgEventsQuery(client, { id });
    const now = new Date().getTime() / 1000;
    const events = data?.orgs.get.events.filter(event => event.timeEnd > now).sort((a, b) => a.timeStart - b.timeStart);

    return <View className="py-4 flex flex-col gap-6">
        {isLoading ? Array.from({ length: 3 }).map(_ => <EventCardLoading />)
        : error ? <AlertError title="Could not load events" body={`${error}`} />
        : !!events?.length ? events.map(event => <EventCard event={event} />)
        : <NoEventsCard desc="There are no upcoming events." />}</View>
}

interface PastEventsParams {
    id: string;
}
function PastEvents({ id }: PastEventsParams) {
    const { isLoading, data, error } = useGetOrgEventsQuery(client, { id });
    const now = new Date().getTime() / 1000;
    const events = data?.orgs.get.events.filter(event => event.timeEnd < now).sort((a, b) => b.timeStart - a.timeStart);

    return <View className="py-4 flex flex-col gap-6">
        {isLoading ? Array.from({ length: 3 }).map(_ => <EventCardLoading />)
        : error ? <AlertError title="Could not load events" body={`${error}`} />
        : !!events?.length ? events.map(event => <EventCard event={event} />)
        : <NoEventsCard desc="There are no past events." />}</View>
}

function NoEventsCard({ desc }: { desc: string }) {
    return <>
      <img className="h-64 block mx-auto" src="https://i.imgur.com/2r3Pj31.png" />
      <span className="text-center text-gray-400">{desc}</span>
    </>
}

const URI_DEFAULT = "https://pastorjeffdavis.com/wp-content/uploads/2020/07/oakwood.jpeg";


interface EventCardProps {
    event: GetOrgEventsQuery["orgs"]["get"]["events"][0]
}
export function EventCard({ event }: EventCardProps) {
    const { toast } = useToast();
    const imageUrl = event.imageUrl || URI_DEFAULT;
    const start = new Date(event.timeStart * 1000);
    const end = new Date(event.timeEnd * 1000);
    const now = new Date();
    const isUpcoming = event.publishedAt && start.toLocaleDateString() == now.toLocaleDateString();
    const inProgress = start.getTime() < now.getTime() && now.getTime() < end.getTime();
    const { id } = useParams();

    const onCopy = () => {
        navigator.clipboard.writeText(`${window.location.origin}/${event.id}`);
        toast({ description: "Reservation ID copied to clipboard" });
    }

    return <Link href={`/admin/${id}/events/${event.id}`}>
        <Card className={`relative ${isUpcoming ? "border-white border-4 animate-pulse-border" : ""}`}>
            <View className="relative block w-full h-32 bg-cover bg-center text-right p-4" style={{ backgroundImage: `url(${imageUrl})` }}>
            {/** <DropdownMenu>
              <DropdownMenuTrigger><Button className="px-2" variant="outline"><MoreVertical /></Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Manage Event</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onCopy();}}><Clipboard className="mr-2 h-4 w-4" /><span>Copy Invitation</span></DropdownMenuItem>
                <DropdownMenuItem><XOctagon className="mr-2 h-4 w-4" /><span>Stop Event</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>**/}
                
            </View>
            <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>{event.bio}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul>
                    <li className="text-gray-400 flex flex-row items-center space-x-2">{inProgress ? <><PlayCircle className="w-4 h-4" /> <span className="text-white font-bold">In Progress</span></> : isUpcoming ? <><PlayCircle className="w-4 h-4" /> <span className="text-white font-bold">Starts in <Timer start={start} /></span></> : event.publishedAt ? <><Globe className="w-4 h-4" /> <span className="text-white font-bold">Published</span></> : <><Lock className="w-4 h-4" /> <span className="text-red-400 font-semibold">Not Published</span></>}</li>
                    <li className="text-gray-400 flex flex-row items-center space-x-2"><Calendar className="w-4 h-4" /> <span>{start.toLocaleDateString()}</span></li>
                    <li className="text-gray-400 flex flex-row items-center space-x-2"><Clock className="w-4 h-4" /> <span>{formatTime(start)} – {formatTime(end)}</span></li>
                    <li className="text-gray-400 flex flex-row items-center space-x-2"><MapPin className="w-4 h-4" /> <span>{event.location?.label}</span></li>
                </ul>
            </CardContent>
        </Card>
    </Link>
}

function EventCardLoading() {
    return <Card>
        <Skeleton height={128} className="!block" />
        <CardHeader className="-mt-4">
            <CardTitle><Skeleton width={250} /></CardTitle>
            <CardDescription><Skeleton width={350} /></CardDescription>
          </CardHeader>
    </Card>
}

export default events;


