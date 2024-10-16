import Text from "@/components/Text";
import View from "@/components/View";
import { ActionType, SearchStateResult, useGeocodeMutation } from "@/shared";
import ResultIcon from "./result/Icon";
import { useContext } from "react";
import { ContextRideDispatch } from "../../context";
import client from "@/client";
import sendEvent, { EVENT_SELECT_LOCATION } from "@/app/analytics";

interface ResultProps {
    result: SearchStateResult;
}
export default function Result({ result }: ResultProps) {
    const dispatch = useContext(ContextRideDispatch)!;

    const { mutate } = useGeocodeMutation(client, {
        onSuccess(data, variables, context) {
            dispatch({
                type: ActionType.SearchSelect,
                result: {
                    main: result.main,
                    sub: result.sub,
                    placeId: result.placeId,
                    location: data.geo.geocode.location,
                },
            });
        },
    });

    const onClick = () => {
        sendEvent(EVENT_SELECT_LOCATION);
        mutate({ placeId: result.placeId });
    }

    return (
        <View
            onClick={onClick}
            className="flex border-gray-900 border-b-2 items-center px-4 active:bg-zinc-900"
        >
            <ResultIcon result={result} />
            <View className="pl-2 py-1">
                <View>
                    <Text className="text-white">{result.main}</Text>
                </View>
                <View>
                    <Text className="text-gray-400">{result.sub}</Text>
                </View>
            </View>
        </View>
    );
}
