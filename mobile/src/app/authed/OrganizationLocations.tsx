import { GetMeQuery, GetOrgLocationsQuery, map_style, q, useGetMeQuery, useGetOrgLocationsQuery, useUpdateLocationMutation } from "@/shared";
import { createRef, useCallback, useContext, useEffect, useState } from "react";
import { Dimensions, Image, SafeAreaView, ScrollView, Text, View, Animated, Alert } from "react-native"
import { AuthContext } from "../state";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthedParamList } from "../Authed";
import { CalendarIcon, CarIcon, HomeIcon, LogOutIcon, MoreHorizontalIcon, MoreVerticalIcon, PlusSquareIcon, UsersRoundIcon } from "lucide-react-native";
import MapView, { Marker, PROVIDER_GOOGLE, UserLocationChangeEvent } from "react-native-maps";

interface GLatLng {
    latitude: number;
    longitude: number;
}

const { width } = Dimensions.get("window");

const CARD_HEIGHT = 250;
const CARD_WIDTH = width * .8;
const CARD_SPACING = 10;
const SPACING_FOR_CARD_INSET = width * .1 - CARD_SPACING;

type PropsOrg = NativeStackScreenProps<AuthedParamList, "OrganizationLocations">;
export const OrganizationLocations = ({ route }: PropsOrg) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();
    const { params } = route;
    const { id } = params;

    const [position, setPosition] = useState<GLatLng>();

    const { data } = useGetOrgLocationsQuery(client, { id }, {
        onSuccess(data) {
            console.log("got loca");
            centerCamera();
        },
    });

    const mapRef = createRef<MapView>();


    const centerCamera = () => {
        console.log("centering...");

        const locations = data?.orgs.get.locations.map(l => ({ latitude: l.locationLat, longitude: l.locationLng }));
        const location = locations?.at(0);

        if (!location) {
            mapRef.current?.animateCamera({
                center: position!,
                zoom: 14,
            });
        }


        

        console.log("Balls!");
        mapRef.current?.animateCamera({
            center: location,
            zoom: 14,
        });
    }

    useEffect(() => {
        centerCamera();
    }, [data])

    let mapIndex = 0;
    let mapAnimation = new Animated.Value(0);

    useEffect(() => {
        mapAnimation.addListener(({ value }) => {
            const locations = data?.orgs.get.locations;

            if (!locations) return;

            let index = Math.floor(value / CARD_WIDTH + 0.3); // animate 30% away from landing on the next item
            if (index >= locations.length) {
                index = locations.length - 1;
            }
            if (index <= 0) {
                index = 0;
            }


              const regionTimeout = setTimeout(() => {
                if( mapIndex !== index ) {
                  mapIndex = index;
                  const location = locations[index];

                  mapRef.current?.animateToRegion(
                    {
                      latitudeDelta: 0.04864195044303443,
                      longitudeDelta: 0.040142817690068,
                      latitude: location.locationLat,
                      longitude: location.locationLng,
                    },
                    350
                  );
                }
              }, 10);

            return () => clearTimeout(regionTimeout);
        })

    }, [data])

    return <View className="flex-1">
        <SafeAreaView className="z-10 absolute bottom-0 w-full">
            <Animated.ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={1}
                pagingEnabled
                snapToInterval={CARD_WIDTH + CARD_SPACING * 2}
                snapToAlignment="center"
                decelerationRate={0}
                contentInset={{
                    left: SPACING_FOR_CARD_INSET,
                    right: SPACING_FOR_CARD_INSET,
                }}
                contentOffset={{ x: -SPACING_FOR_CARD_INSET, y: 0 }}
                onScroll={Animated.event([
                    {
                        nativeEvent: {
                            contentOffset: {
                                x: mapAnimation
                            }
                        }
                    }
                ], { useNativeDriver: true })}
            >
                {data?.orgs.get.locations.map(l => <LocationCard key={l.id} location={l} idOrg={id} />)}
            </Animated.ScrollView>
        </SafeAreaView>
        <MapView
            provider={PROVIDER_GOOGLE}
            ref={mapRef}
            // onMapReady={centerCamera}
            showsUserLocation
            customMapStyle={map_style}
            className="h-screen"
        >
            {data?.orgs.get.locations.map(l => <Marker key={l.id} coordinate={{ latitude: l.locationLat, longitude: l.locationLng }} />)}
        </MapView>
    </View>

}

interface LocationCardProps {
    idOrg: string;
    location: GetOrgLocationsQuery["orgs"]["get"]["locations"][number];
}
const LocationCard = ({ idOrg, location }: LocationCardProps) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();

    const uri = `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${location.locationLat},${location.locationLng}&key=AIzaSyDnTQtziC5eId93Qn8v5HNz8Ygis5SHXpc`;


    const { mutate: updateLocation } = useUpdateLocationMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetOrgLocations"]);
        },
    })



    const onPress = () => {
        Alert.alert("Edit Property", "", [
            {
                text: "Change Name",
                onPress: () => {
                    Alert.prompt("Change Name", "Enter the new name for this property", name => {
                        updateLocation({
                            idOrg,
                            idLocation: location.id,
                            form: {
                                locationLat: location.locationLat,
                                locationLng: location.locationLng,
                                imageUrl: "",
                                label: name,
                            }
                        });

                    })

                }
            },
            {
                text: "Delete Property",
                style: "destructive",
                onPress: () => {
                    Alert.alert("Delete Property?", "Are you sure you want to delete " + location.label + "?", [
                        {
                            text: "Cancel",
                            isPreferred: true,
                        },
                        {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => {
                                updateLocation({
                                    idOrg,
                                    idLocation: location.id,
                                    form: {
                                        locationLat: location.locationLat,
                                        locationLng: location.locationLng,
                                        imageUrl: "",
                                        label: location.label,
                                        obsoleteAt: Math.floor(new Date().getTime() / 1000)
                                    }
                                });
                            },
                        }
                    ])

                }
            },
            {
                text: "Cancel",
                isPreferred: true,
            },
        ])

    }

    return <View className="bg-zinc-900 rounded-lg overflow-hidden" style={{ elevation: 2, width: CARD_WIDTH, height: CARD_HEIGHT, marginHorizontal: CARD_SPACING }}>
        <Image className="w-full h-40" source={{ uri }} resizeMode="cover" />
        <View className="p-4 flex-row justify-between">
            <Text className="text-white text-lg">{location.label}</Text>
            <TouchableOpacity onPress={onPress}>
                <MoreHorizontalIcon color="gray" />
            </TouchableOpacity>
        </View>
    </View>
}
