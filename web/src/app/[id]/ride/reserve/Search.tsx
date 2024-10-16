import View from "@/components/View";
import { useContext } from "react";
import {
    ActionType,
    ReservationType,
    SearchResultType,
    SearchStateResult,
    StateReserve,
    en,
    useGeoSearchQuery,
    useGetMeCommonStopsQuery,
} from "@/shared";
import { ContextRide, ContextRideDispatch } from "../context";
import Back from "./search/Back";
import Clear from "./search/Clear";
import Input from "./search/Input";
import Result from "./search/Result";
import { useDebounce } from "@/lib";
import client from "@/client";

interface SearchProps {}
export default function Search({}: SearchProps) {
    const { step, reservationType } = useContext(ContextRide)!;
    const dispatch = useContext(ContextRideDispatch)!;

    const { searchText, event } = step as StateReserve;

    const debounced = useDebounce(searchText);

    const setSearchText = (searchText: string) =>
        dispatch({
            type: ActionType.SearchSet,
            searchText,
        });

    const { data: common } = useGetMeCommonStopsQuery(client, {}, {
        enabled: !searchText,
        keepPreviousData: true,
    });

    const { data } = useGeoSearchQuery(
        client,
        { idEvent: event.id, query: debounced },
        { enabled: !!debounced, keepPreviousData: true },
    );
    const searchResults: SearchStateResult[] | undefined = (searchText && data?.geo.search.map(
        (res) => ({
            icon: SearchResultType.POI,
            main: res.main,
            sub: res.sub,
            placeId: res.placeId,
        }),
    )) || common?.users.me.commonStops.map(res => ({
            icon: SearchResultType.RECENT,
            main: res.main,
            sub: res.sub || "Recent search",
            placeId: res.placeId,
    }));

    const onBack = () =>
        dispatch({ type: ActionType.BackFromSearch });

    const placeholder = reservationType == ReservationType.PICKUP
        ? en.RIDE_RESERVATION_SEARCH_PICKUP
        : en.RIDE_RESERVATION_SEARCH_DROPOFF;

    return (
        <View className="absolute z-20 h-screen w-full bg-zinc-950 pt-4">
            <View className="flex flex-row px-4 items-center border-gray-900 border-b-2 pb-2">
                <Back onPress={onBack} />
                <View className="flex-grow">
                    <View className="flex bg-zinc-800 flex-row items-center flex-grow mx-2 p-2 rounded">
                        <Input placeholder={placeholder} value={searchText} setValue={setSearchText} />
                        <Clear />
                    </View>
                </View>
            </View>
            <View className="">
                {searchResults?.map((result) => (
                    <Result key={result.placeId} result={result} />
                ))}
            </View>
        </View>
    );
}
