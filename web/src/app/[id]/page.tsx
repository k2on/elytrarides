import { Metadata } from "next";
import { Event } from "@/shared";
import ViewCentered from "@/components/ViewCentered";
import { URL_GRAPHQL } from "@/const";
import EventInvite from "@/components/EventInvite";
import { unstable_cache } from "next/cache";
import View from "@/components/View";

async function getEvent(id: string): Promise<[Event | null, string | null]> {
    try {
        const resp = await fetch(URL_GRAPHQL, {
            method: "POST",
            body: JSON.stringify(makeBody(id)),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            next: { tags: ['event-' + id] }
        });
        const json = await resp.json();
        const event = json.data.events.get;
        return [event, null];
    } catch (e) {
        console.error("Error fetching: ", makeBody(id), URL_GRAPHQL, e);
        return [null, "Could not get invitation"]
    }
}

const makeBody = (id: string) => ({
    operationName: "GetEvent",
    variables: { id },
    query: `query GetEvent($id: Uuid!) {
        events {
            get(id: $id) {
                id
                idOrg
                name
                bio
                timeStart
                timeEnd
                reservationsStart
                reservationsEnd
                org {
                    label
                    bio
                }
            }
        }
    }`,
});

interface Props {
    params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const [event, error] = await getEvent(params.id);
    if (error || !event) return {
        title: "Elytra Rides",
        description: "Elytra Rides",
    };
    return {
        title: `${event.org.bio} Invites you to ${event.name}`,
        description: event.bio,
    };
}

export default async function EventInviteScreen({ params }: Props) {
    const { id } = params;

    const [event, error] = await getEvent(id);
    if (error || !event) {
        console.error("Error: ", error);
        return <ViewCentered>
            <View className="text-center">
                <View className="text-2xl font-bold">
                    Could not load invite
                </View>
                <View className="text-gray-400 mt-4">
                    Please retry later.<br />If this keeps happening, contact the event planner.
                </View>
            </View>
        </ViewCentered>
    }

    return <ViewCentered>
            <EventInvite event={event} />
        </ViewCentered>;
}

