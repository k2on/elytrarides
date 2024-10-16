import { SafeAreaView, ScrollView, View } from "react-native";
import Clear from "./search/Clear";
import { useContext } from "react";
import {
    ActionType,
    ReservationType,
    SearchResultType,
    SearchStateResult,
    StateReserve,
    en,
    useGeoSearchQuery,
    useGeocodeMutation,
} from "@/shared";
import Back from "./search/Back";
import Result from "./search/Result";
import { Input } from "./search/Input";
import { useDebounce } from "@/app/lib";
import { AuthContext } from "@/app/state";
import { ContextRide, ContextRideDispatch } from "../context";

interface SearchProps {}
export default function Search({}: SearchProps) {
    const { getClient } = useContext(AuthContext)!;
    const { step, reservationType } = useContext(ContextRide)!;
    const dispatch = useContext(ContextRideDispatch)!;

    const client = getClient();

    const { searchText } = step as StateReserve;

    const debounced = useDebounce(searchText);

    const setSearchText = (searchText: string) =>
        dispatch({
            type: ActionType.SearchSet,
            searchText,
        });

    const onBack = () =>
        dispatch({ type: ActionType.BackFromSearch });

    const { data } = useGeoSearchQuery(
        client,
        { query: debounced },
        { enabled: !!debounced, keepPreviousData: true },
    );
    const searchResults: SearchStateResult[] | undefined = data?.geo.search.map(
        (res) => ({
            icon: SearchResultType.POI,
            main: res.main,
            sub: res.sub,
            placeId: res.placeId,
        }),
    );

    const onPress = () =>
        dispatch({
            type: ActionType.SearchClear,
        });


    return (
        <SafeAreaView className="w-screen h-screen bg-zinc-950">
            <View className="flex-row pr-4 items-center border-gray-900 border-b-2 pb-2">
                <Back onPress={onBack} />
                <View className="flex-grow">
                    <View className="bg-zinc-800 flex-row items-center flex-grow mx-2 p-2 rounded">
                        <Input placeholder={reservationType == ReservationType.PICKUP ? en.RIDE_RESERVATION_SEARCH_PICKUP : en.RIDE_RESERVATION_SEARCH_DROPOFF} value={searchText} setValue={setSearchText} />
                        <Clear onPress={onPress} />
                    </View>
                </View>
            </View>
            <ScrollView className="h-full">
                {searchResults?.map((result) => (
                    <StopResult result={result} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

interface ResultProps {
    result: SearchStateResult;
}
const StopResult = ({ result }: ResultProps) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();

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

    const onPress = () => mutate({ placeId: result.placeId });

    return <Result key={result.placeId} result={result} onPress={onPress} />
}
