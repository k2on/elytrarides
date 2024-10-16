import { Alert, SafeAreaView, ScrollView, View } from "react-native"
import { Input } from "./reservations/ride/reserve/search/Input"
import { useContext, useState } from "react"
import Clear from "./reservations/ride/reserve/search/Clear";
import Result from "./reservations/ride/reserve/search/Result";
import { useDebounce } from "../lib";
import { GeoSearchQuery, SearchResultType, SearchStateResult, q, useGeoSearchQuery, useGeocodeMutation, useUpdateLocationMutation } from "@/shared";
import { AuthContext } from "../state";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthedParamList } from "../Authed";
import { useNavigation } from "@react-navigation/native";
import uuid from "react-native-uuid";


type PropsSearch = NativeStackScreenProps<AuthedParamList, "LocationSearch">;
export const LocationSearch = ({ route }: PropsSearch) => {
    const { getClient, signOut, getToken } = useContext(AuthContext)!;
    const client = getClient();

    const [searchText, setSearchText] = useState("");
    const [results, setResults] = useState<SearchStateResult[]>([]);

    const debounced = useDebounce(searchText);

    useGeoSearchQuery(
        client,
        { query: debounced },
        {
            enabled: !!debounced,
            keepPreviousData: true,
            onSuccess(data) {
                const res = data?.geo.search.map(
                    (res) => ({
                        icon: SearchResultType.POI,
                        main: res.main,
                        sub: res.sub,
                        placeId: res.placeId,
                    })
                );
                setResults(res);
            },
        },
    );

    return <SafeAreaView className="w-screen h-screen bg-zinc-950">
            <View className="flex-row items-center border-gray-900 border-b-2 pb-2 pt-4">
                <View className="flex-grow">
                    <View className="bg-zinc-800 flex-row items-center flex-grow mx-2 p-2 rounded">
                        <Input placeholder="Search Location..." value={searchText} setValue={setSearchText} />
                        <Clear onPress={() => {
                            setSearchText("")
                            setResults([]);
                        }} />
                    </View>
                </View>
            </View>
            <ScrollView className="h-full">
                {results?.map((result) => (
                    <LocationResult name={route.params.name} key={result.placeId} result={result} idOrg={route.params.idOrg} />
                ))}
            </ScrollView>
        </SafeAreaView>

}

interface ResultProps {
    result: SearchStateResult;
    name: string;
    idOrg: string;
}
const LocationResult = ({ result, name, idOrg }: ResultProps) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();

    const navigation = useNavigation<NativeStackNavigationProp<AuthedParamList, "LocationSearch", undefined>>();

    const { mutate: createLocation } = useUpdateLocationMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetOrgLocations"]);
            navigation.pop();
        },
    })


    const { mutate } = useGeocodeMutation(client, {
        onSuccess(data, variables, context) {
            createLocation({
                idOrg,
                idLocation: uuid.v4(),
                form: {
                    label: name,
                    locationLat: data.geo.geocode.location.lat,
                    locationLng: data.geo.geocode.location.lng,
                    imageUrl: "",
                }
            });
        },
    });

    const onPress = () => mutate({ placeId: result.placeId });

    return <Result key={result.placeId} result={result} onPress={onPress} />
}
