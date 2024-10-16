"use client";

import client from "@/client";
import View from "@/components/View";
import { Card } from "@/components/ui/card";
import { useGetAdminEventQuery, useSubscribeToEvent } from "@/shared";
import { auth_token_get } from "@/store";
import { Loader2, LocateFixed, MapPin, Ticket, User, User2, UserCheck2, UserX2, Users2 } from "lucide-react";
import { FC, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { queryClient } from "@/app/ReactQueryProvider";
import makeWSClient from "@/client-ws";
import { makeInitialState } from "./util";
import { ContextAdmin, ContextAdminDispatch } from "./context";
import { reducer } from "./reducer";
import { AdminActionType } from "./actions";
import Map from "./Map";
import All from "./All";
import Active from "./Active";
import Header from "./Header";
import ReservationView from "./ReservationView";

interface PageProps {
    params: { id_event: string }
}

const page: FC<PageProps> = ({ params }) => {
    const inital = makeInitialState(params.id_event);
    const [state, dispatch] = useReducer(reducer, inital);

    return <ContextAdmin.Provider value={state}>
        <ContextAdminDispatch.Provider value={dispatch}>
            <EventAdmin />
        </ContextAdminDispatch.Provider>
    </ContextAdmin.Provider>
};


function EventAdmin() {
    const { id, strategy, focusedReservation } = useContext(ContextAdmin)!;
    const dispatch = useContext(ContextAdminDispatch)!;


    const { data } = useGetAdminEventQuery(client, { id }, { onSuccess(data) {
        console.log("set event", data);
        dispatch({ type: AdminActionType.SET_EVENT, event: data.events.get })
    }});


    const location = data && data.events.get.location!;
    useSubscribeToEvent(makeWSClient,
    { id, token: auth_token_get() || "" },
    {
        onData({ event: message }) {
            switch (message.__typename) {
                case "MessageDriverLocation":
                    dispatch({ type: AdminActionType.UPDATE_DRIVER_LOCATION, id: message.id, location: message.location });
                    break;
                case "MessageReservationUpdate":
                    queryClient.invalidateQueries(["GetAdminEvent", { id }]);
            }
        },
        onError(e) {
            console.error("error", e);
        },
        onComplete() {
            console.log("complete");
        }
    });


    return <View className="grid grid-cols-6 grid-rows-6 gap-4 max-w-7xl mx-auto pt-8" style={{ height: "calc(100vh - 110px)" }}>
                <Header />
                <Card className="col-span-3 row-span-5 relative">
                {location ? 
                    <Map />
                : <View className="h-full w-full flex items-center justify-center flex-row"><Loader2 className="animate-spin mr-1 h-4 w-4" />Loading...</View>}
                </Card>
                <Card className="row-span-5 col-span-3 overflow-y-auto h-full">
                    {focusedReservation != null ? <ReservationView id={focusedReservation} /> : <All />}
                </Card>
            </View>
}

export default page;
