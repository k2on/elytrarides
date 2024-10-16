import { useContext, useEffect, useState } from "react";
import { Linking, Platform, Text } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { LatLng } from "@/shared";
import { ContextDrive } from "./context";
import Icons from "react-native-vector-icons/MaterialCommunityIcons";
import { NAVIGATION_APP_KEY, NavigationApp } from "@/const";
import { getItemAsync } from "expo-secure-store";

export default function Navigate() {

    const { dest, event } = useContext(ContextDrive)!;
    const [navigationApp, setNavigationApp] = useState(NavigationApp.APPLE);

    if (!dest) throw Error("unreachable");
    if (!event) return <Text>Loading...</Text>

    const location = { lat: dest.stop.lat, lng: dest.stop.lng };

    useEffect(() => {
        getItemAsync(NAVIGATION_APP_KEY).then(result => {
            const app = result ? parseInt(result) : NavigationApp.APPLE;
            setNavigationApp(app);
        });
    }, [])

    return <TouchableOpacity onPress={() => location_open(navigationApp, location, "Destination")} style={{ paddingHorizontal: 20, paddingVertical: 15, backgroundColor: "black", borderRadius: 25, flexDirection: "row", alignItems: "center" }}>
        
        <Icons name="navigation" color="white" size={18} style={{ marginRight: 5 }} />
        <Text style={{ fontWeight: "bold", fontSize: 18, color: "white" }}>NAVIGATE</Text>
    </TouchableOpacity>

}

function location_open(
    navigation: NavigationApp,
    location: LatLng,
    label?: string,
) {
    const { lat, lng } = location;
    const latLng = `${lat},${lng}`;

    const scheme = Platform.select({
        ios: "maps:0,0?q=",
        android: "geo:0,0?q=",
    });

    function get_url() {
        if (Platform.OS == "ios" && navigation == NavigationApp.GOOGLE) {
            const query = encodeURIComponent(`${latLng}`);
            return `https://www.google.com/maps/search/?api=1&query=${query}`;
        } else if (navigation == NavigationApp.WAZE) {
            const query = encodeURIComponent(`${latLng} ${label || ''}`.trim());
            return `https://waze.com/ul?ll=${query}&navigate=yes`;
        } else {
            return Platform.select({
                ios: `${scheme}${label}@${latLng}`,
                android: `${scheme}${latLng}(${label})`,
            })!;
        }
    }

    const url = get_url();
    Linking.openURL(url);
}
