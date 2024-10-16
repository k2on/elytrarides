"use client";

import client from "@/client";
import View from "@/components/View";
import ViewCentered from "@/components/ViewCentered";
import { Button } from "@/components/ui/button";
import { useGetMeMembershipsQuery } from "@/shared";
import { auth_token_remove } from "@/store";
import { FC } from "react";
import { OP } from "./op";

interface PageProps {}

const page: FC<PageProps> = ({}) => {
    const { data } = useGetMeMembershipsQuery(client);

    if (data) {
        const memberships = data.users.me.memberships;
        const adminFor = memberships.filter(membership => membership.isAdmin);
        if (adminFor.length == 0) return <NotAnAdmin />
        if (adminFor.some(membership => membership.org.id == "12cc7767-8831-4a06-9621-b5a71dd8d9f1")) return <OP />;
        if (adminFor.length == 1) {
            window.location.href = "admin/" + adminFor.at(0)!.org.id;
            return;
        }
        return <div><ul>{adminFor.map(membership => <li>{membership.org.id} - {membership.org.label}</li>)}</ul></div>;
    }

};

interface NotAnAdminProps {
    desc?: string;
}
export function NotAnAdmin({ desc }: NotAnAdminProps) {
    return <ViewCentered>
        <View className="text-center">
            <View>{desc || "You are not an admin for any organization."}</View>
            <br />
            <Button onClick={() => {
                auth_token_remove();
                window.location.href = "";
            }}>
                Logout
            </Button>
        </View>
    </ViewCentered>
}



export default page;
