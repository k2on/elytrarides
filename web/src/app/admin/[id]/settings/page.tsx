"use client"

import client from "@/client";
import View from "@/components/View";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetOrgQuery } from "@/shared";
import Link from "next/link";
import { FC } from "react";
import Skeleton from "react-loading-skeleton";

interface PageProps {
    params: { id: string };
}
const page: FC<PageProps> = ({ params }) => {
    const { id } = params;
    const { data } = useGetOrgQuery(client, { id })

    return <View className="max-w-3xl mx-auto py-8">
        <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage general information about your organization.</CardDescription>
            </CardHeader>
            <CardContent>
                <View className="flex flex-col space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="letters">Letters</Label>
                      {data ? <Input className="font-serif" disabled={true} value={data.orgs.get.label} type="text" id="letters" placeholder="Letters" /> : <Skeleton height={40} />}
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="name">Name</Label>
                      {data ? <Input disabled={true} value={data.orgs.get.bio || ""} type="text" id="letters" placeholder="Name" /> : <Skeleton height={40} />}
                    </div>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                          <Label htmlFor="collefe">College</Label>
                        {data ? <View className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-not-allowed opacity-50 flex flex-row items-center space-x-2">
                            <img className="h-6" src={data.orgs.get.college?.logoUrl} />
                            <span>{data.orgs.get.college?.name}</span>
                        </View> : <Skeleton height={40} />}
                    </div>
                </View>
                <View className="mt-4">
                    Please use contact <Link className="text-purple-400" href="help">support</Link> to change this information.
                </View>
            </CardContent>
        </Card>
    </View>
}

export default page;
