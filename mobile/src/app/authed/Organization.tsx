import { GetMeQuery, q, useGetMeQuery } from "@/shared";
import { useContext } from "react";
import { ScrollView, Text, View } from "react-native"
import { AuthContext } from "../state";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthedParamList } from "../Authed";
import { CalendarIcon, CarIcon, HomeIcon, LogOutIcon, UsersRoundIcon } from "lucide-react-native";

type PropsOrg = NativeStackScreenProps<AuthedParamList, "Organization">;
export const Organization = ({ route }: PropsOrg) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();
    const { params } = route;
    const { id, label } = params;

    const navigation = useNavigation<NativeStackNavigationProp<AuthedParamList, "Home", undefined>>();

    const onEvents = () => { navigation.navigate("OrganizationEvents", { id, searchValue: "" }) }
    const onLocations = () => { navigation.navigate("OrganizationLocations", { id }) }
    const onMembers = () => { navigation.navigate("OrganizationMembers", { id, searchValue: "" }) }
    const onVehicles = () => { navigation.navigate("OrganizationVehicles", { id, searchValue: "", editing: null }) }

    return <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View className="px-2 pt-4">
            <View className="bg-zinc-900 rounded py-2">
                <TouchableOpacity onPress={onEvents}>
                    <View className="flex-row items-center gap-4 px-4">
                        <View className="bg-purple-600 rounded-lg p-1"><CalendarIcon size={20} color="white" /></View>
                        <Text className="text-gray-100 text-lg">Events</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>

        <View className="px-2 pt-4">
            <View className="bg-zinc-900 rounded py-2">
                <TouchableOpacity onPress={onMembers}>
                    <View className="flex-row items-center gap-4 px-4">
                        <View className="bg-orange-600 rounded-lg p-1"><UsersRoundIcon size={20} color="white" /></View>
                        <Text className="text-gray-100 text-lg">Members</Text>
                    </View>
                </TouchableOpacity>
                <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                <TouchableOpacity onPress={onLocations}>
                    <View className="flex-row items-center gap-4 px-4">
                        <View className="bg-green-600 rounded-lg p-1"><HomeIcon size={20} color="white" /></View>
                        <Text className="text-gray-100 text-lg">Properties</Text>
                    </View>
                </TouchableOpacity>
                <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                <TouchableOpacity onPress={onVehicles}>
                    <View className="flex-row items-center gap-4 px-4">
                        <View className="bg-blue-600 rounded-lg p-1"><CarIcon size={20} color="white" /></View>
                        <Text className="text-gray-100 text-lg">Vehicles</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>

        {false && <View className="px-2 pt-4">
            <View className="bg-zinc-900 rounded py-2">
                <TouchableOpacity>
                    <View className="flex-row items-center gap-4 px-4">
                        <View className="bg-red-600 rounded-lg p-1"><LogOutIcon size={20} color="white" /></View>
                        <Text className="text-red-600 text-lg">Leave {label}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>}
    </ScrollView>
}

