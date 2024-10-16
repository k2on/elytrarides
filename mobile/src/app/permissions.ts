import * as Location from "expo-location";

export async function assertPermissions() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status == Location.PermissionStatus.GRANTED;
}
