"use client";

import client from "@/client";
import { GOOGLE_MAPS_LIBRARIES } from "@/components/ScreenMap";
import Text from "@/components/Text";
import View from "@/components/View";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { googleMapsApiKey } from "@/const";
import { GetOrgEventsQuery, GetOrgEventsWithPassengersQuery, useGetOrgEventsQuery, useGetOrgEventsWithPassengersQuery, useGetOrgQuery, useGetOrgReservationsQuery } from "@/shared";
import { GoogleMap, HeatmapLayerF, Libraries, LoadScript } from "@react-google-maps/api";
import { Info, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { FC, createRef, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { EventCard } from "./events/page";

const G_LIBS: Libraries = ["geometry", "visualization"];

interface PageProps {
    params: { id: string };
}
const page: FC<PageProps> = ({ params }) => {
    const { id } = params;
    const [center, setCenter] = useState({ lat: 34.68130016406218, lng: -82.83417853444037 });
    const { data, isLoading } = useGetOrgQuery(client, { id }, {
        onSuccess(data) {
            if (!data.orgs.get.college) return;
            const college = data.orgs.get.college;
            setCenter({ lat: college.locationLat, lng: college.locationLng });
        },
    });

    const { data: events } = useGetOrgEventsWithPassengersQuery(client, { id });

    const dates = events?.orgs.get.events.map(e => new Date(e.timeStart * 1000));
    const eventsSorted = events?.orgs.get.events.sort((a, b) => b.timeStart - a.timeStart);

    return <View className="p-4">
        <View className="max-w-5xl mx-auto grid grid-cols-5 gap-4">
            <View className="col-span-3 flex flex-col space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-serif font-normal">{data?.orgs.get.label || <Skeleton width={50} />}</CardTitle>
                        <CardDescription>{data?.orgs.get.bio || <Skeleton width={100} />}</CardDescription>
                    </CardHeader>
                </Card>
                {eventsSorted?.map(e => <EventCard event={e} />)}
            </View>
            <View className="col-span-2 flex flex-col space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Calendar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Calendar selected={dates} className="table mx-auto" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Turnout</CardTitle>
                        <CardDescription>See the turnout of recent events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EventsTurnout events={eventsSorted?.slice(0, 3) || []} />
                    </CardContent>
                </Card>
                <Card className="relative h-[300px]">
                    <LoadScript mapIds={["e054b907b2c2d1b6"]} googleMapsApiKey={googleMapsApiKey} libraries={G_LIBS}>
                        <Heatmap />
                    </LoadScript>
                    <View className="absolute z-5 bottom-0 w-full bg-gradient-to-t from-black to-transparent h-32">
                        <View className="bottom-0 absolute p-4 flex flex-col space-y-2">
                            <Text className="text-xl font-semibold">Reservation Heatmap</Text>
                            <Text className="text-gray-200">A map of common pickup spots</Text>
                        </View>
                    </View>
                    <View className={`absolute z-1 bottom-0 bg-black h-full w-full flex items-center justify-center ${!isLoading && "hidden"}`}>
                        <Loader2 className="animate-spin" />
                    </View>
                </Card>
            </View>
        </View>
    </View>
};

export default page;

function sum(numbers: number[]): number {
  return numbers.reduce((accumulator, currentValue) => {
    return accumulator + currentValue;
  }, 0);
}


interface EventsTurnout {
    events: GetOrgEventsWithPassengersQuery["orgs"]["get"]["events"]
}
const EventsTurnout: FC<EventsTurnout> = ({ events }) => {
    const max = Math.max(...events.map(e => sum(e.reservations.filter(r => !r.isDropoff).map(r => r.passengerCount))));
    return <View className="flex flex-col space-y-2">{events.map(event => <EventTurnout event={event} max={max} />)}</View>
}

interface EventTurnout {
    event: GetOrgEventsWithPassengersQuery["orgs"]["get"]["events"][number],
    max: number
}
const EventTurnout: FC<EventTurnout> = ({ event, max }) => {
    const turnout = sum(event.reservations.filter(r => !r.isDropoff).map(r => r.passengerCount));
    return <View>
        <View className="flex flex-row">
            <View className="w-full flex items-center">
                <View style={{ width: `${Math.floor((turnout / max) * 100)}%` }} className="h-2 bg-purple-400 rounded-full"></View>
            </View>
            <View className="w-10 text-right">{turnout}</View>
        </View>
        <View className="text-gray-400">
            {event.name}
        </View>
    </View>
}

function Heatmap() {
    const [center, setCenter] = useState({ lat: 34.68130016406218, lng: -82.83417853444037 });
    const { id } = useParams();
    const { data, isLoading } = useGetOrgQuery(client, { id }, {
        onSuccess(data) {
            if (!data.orgs.get.college) return;
            const college = data.orgs.get.college;
            setCenter({ lat: college.locationLat, lng: college.locationLng });
        },
    });
    const [map, setMap] = useState<google.maps.Map>();

    const { data: res } = useGetOrgReservationsQuery(client, { id });

    const points = useMemo(() => {
        if (!res) return [];
        const points = res.orgs.get.events.flatMap(e => e.reservations.flatMap(r => r.stops.map(s => ({ lat: s.locationLat, lng: s.locationLng }))))
            .map(p => new google.maps.LatLng(p.lat, p.lng));

        if (map) {
            const bounds = new window.google.maps.LatLngBounds();

            points.map((p) => bounds.extend(p));
                
            map.fitBounds(bounds, {
                top: 50,
                left: 50,
                right: 50,
                bottom: 100,
            });
        }
        


        return points;
  }, [res])

    return <GoogleMap
                onLoad={(e) => setMap(e)}
                mapContainerStyle={{ outline: "none" }}
                // onLoad={(e) => setMap(e)}
                mapContainerClassName="h-[300px] remove-border"
                // center={center}
                zoom={12}
                options={{
                    disableDefaultUI: true,
                    mapId: "e054b907b2c2d1b6",
                }}
            >
                <HeatmapLayerF data={points} key={points.length} />
            </GoogleMap>

}
