"use client";

import client from "@/client";
import { useGetMeQuery, } from "@/shared";

export default function Home() {
    const { data, isLoading, error } = useGetMeQuery(client);

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div>
                {isLoading ? "loading..." : data?.users.me.phone || `${error}`}
            </div>
        </main>
    );
}
