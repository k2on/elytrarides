import { Metadata } from "next";
import { Invite } from "@/shared";
import ViewCentered from "@/components/ViewCentered";
import { URL_GRAPHQL } from "@/const";
import EventInvite from "@/components/EventInvite";
import { unstable_cache } from "next/cache";
import View from "@/components/View";
import { Button } from "@/components/ui/button";
import OrgInvite from "./OrgInvite";

async function getInvite(id: string): Promise<[Invite | null, string | null]> {
    try {
        const resp = await fetch(URL_GRAPHQL, {
            method: "POST",
            body: JSON.stringify(makeBody(id)),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            next: { tags: ['invite-' + id] }
        });
        const json = await resp.json();
        const event = json.data.invites.get;
        return [event, null];
    } catch (e) {
        console.error("Error fetching: ", makeBody(id), URL_GRAPHQL, e);
        return [null, "Could not get invitation"]
    }
}

const makeBody = (id: string) => ({
    operationName: "GetInvite",
    variables: { id },
    query: `query GetInvite($id: Uuid!) {
        invites {
            get(id: $id) {
                id
                isValid
                org {
                    id
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
    const [invite, error] = await getInvite(params.id);
    if (error || !invite) return {
        title: "Elytra Rides",
        description: "Elytra Rides",
    };
    if (!invite.isValid) return {
        title: "Elytra Rides",
        description: "Expired invitation link",
    };
    return {
        title: `Join ${invite.org!.bio}`,
        description: "Use this link to join the organization."
    };
}

export default async function EventInviteScreen({ params }: Props) {
    const { id } = params;

    const [invite, error] = await getInvite(id);
    if (error || !invite) {
        console.error("Error: ", error);
        return <ViewCentered>Error getting invitation.</ViewCentered>
    }

    return <ViewCentered>
            <OrgInvite invite={invite} />
        </ViewCentered>;
}

