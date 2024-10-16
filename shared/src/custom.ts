"use client"

import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import {
    GeocodeDocument,
    GeocodeQuery,
    GeocodeQueryVariables,
    GetAvaliableReservationDocument,
    GetAvaliableReservationQuery,
    GetAvaliableReservationQueryVariables,
    SubscribeToEventDocument,
    SubscribeToEventSubscription,
    SubscribeToEventSubscriptionVariables,
    SubscribeToReservationDocument,
    SubscribeToReservationSubscription,
    SubscribeToReservationSubscriptionVariables,
} from "./generated/graphql";
import { GraphQLClient } from "graphql-request";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { useMemo } from "react";

function fetcher<TData, TVariables extends { [key: string]: any }>(
    client: GraphQLClient,
    query: string,
    variables?: TVariables,
    requestHeaders?: RequestInit["headers"],
) {
    return async (): Promise<TData> =>
        client.request({
            document: query,
            variables,
            requestHeaders,
        });
}

const queryToMutation = <T, V extends {[k: string]: any}>(key: string, document: string) => (
    client: GraphQLClient,
    options?: UseMutationOptions<T, T, V>,
    headers?: RequestInit["headers"],
    ) => useMutation<T, any, V>(
        [key],
        (variables?: V) =>
            fetcher<T, V>(
                client,
                document,
                variables,
                headers
            )(),
            options
)

export const useGeocodeMutation = queryToMutation<GeocodeQuery, GeocodeQueryVariables>("Geocode", GeocodeDocument);
export const useGetAvaliableReservationMutation = queryToMutation<GetAvaliableReservationQuery, GetAvaliableReservationQueryVariables>("GetAvaliableReservation", GetAvaliableReservationDocument);

interface SubscriptionOptions<T> {
    onData: (d: T) => void;
    onError: (e: any) => void;
    onComplete: () => void;
}
export const useSubscribeToReservation = (
    makeWSClient: () => SubscriptionClient,
    variables: SubscribeToReservationSubscriptionVariables,
    options: SubscriptionOptions<SubscribeToReservationSubscription>
) => {
    useMemo(() => {
        const client = makeWSClient();
        const observable = client.request({ query: SubscribeToReservationDocument, variables });

        const subscription = observable.subscribe({
            next: (result) => {
                if (result.data) {
                    let data = result.data as SubscribeToReservationSubscription;
                    options.onData(data);
                }
            },
            error: options.onError,
            complete: options.onComplete,
        });

        return () => {
            // Cleanup function - unsubscribe when component unmounts
            subscription.unsubscribe();
        };
    }, []);
}

export const useSubscribeToEvent = (
    makeWSClient: () => SubscriptionClient,
    variables: SubscribeToEventSubscriptionVariables,
    options: SubscriptionOptions<SubscribeToEventSubscription>
) => {
    useMemo(() => {
        const client = makeWSClient();
        const observable = client.request({ query: SubscribeToEventDocument, variables });

        const subscription = observable.subscribe({
            next: (result) => {
                if (result.data) {
                    let data = result.data as SubscribeToEventSubscription;
                    options.onData(data);
                }
            },
            error: options.onError,
            complete: options.onComplete,
        });

        return () => {
            // Cleanup function - unsubscribe when component unmounts
            subscription.unsubscribe();
        };
    }, []);
}

export function getAvatarLetters(nameRaw: string): string {
    const name = nameRaw.toUpperCase();
    if (name == "") return "..";
    const words = name.split(" ");
    if (words.length == 1) return name.substring(0, 2);
    return words[0].substring(0, 1) + words[1].substring(0, 1);
}

export function makeRequest<T, V>(url: string, document: string, token?: string) {
    return async (variables: V) => {
        const resp = await fetch(url, {
            method: "POST",
            body: JSON.stringify({
                query: document,
                variables,
            }),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: token || "",
            },
        });
        return await resp.json() as T;
    }
}
