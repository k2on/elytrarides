"use client"

import client from "@/client";
import View from "@/components/View";
import { Button } from "@/components/ui/button";
import { Invite, useGetMeQuery, useInviteAcceptMutation } from "@/shared";

interface InviteProps {
    invite: Invite,
}
export default function OrgInvite({ invite }: InviteProps) {
    if (!invite.isValid) return "This invite is no longer in use. Please ask an admin for the new one";
    const { data: me } = useGetMeQuery(client);
    const { mutate, isLoading } = useInviteAcceptMutation(client, {
        onSuccess(data, variables, context) {
            window.location.href = window.location.origin + "/account?r=" + window.location.href;
        },
    });

    if (!me) return "Loading...";

    const org = invite.org!;

    const isMember = me && me.users.me.memberships.some(m => m.org.id == org.id) || false;
    if (isMember) return "You have joined the " + org.label + " organization";

    const onJoin = () => {
        mutate({ id: invite.id });
    }


    return <View className="text-center">
        <View>
            {org.label}
        </View>
        <br />
        <View className="text-xl">
            Join the {org.bio} organization
        </View>
        <br />
        <br />
        <Button onClick={onJoin} disabled={isLoading} className="w-full">{isLoading ? "Joining..." : "Join"}</Button>
    </View>
    }
