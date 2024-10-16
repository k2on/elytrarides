import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useContext } from "react";
import { AuthContext } from "@/app/state";
import { AuthedParamList } from "@/app/Authed";
import { GetMeQuery, useDeleteAccountMutation, useGetMeQuery } from "@/shared";
import {
    SafeAreaView,
    Text,
    ScrollView,
    Button,
    Alert,
    Image,
    View,
} from "react-native";
import { NativeStackNavigationProp, NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack";
import { UserRound, Building2Icon, HistoryIcon, CarIcon, LogOutIcon, StarIcon } from "lucide-react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import parsePhoneNumberFromString from "libphonenumber-js";
import { useNavigation } from "@react-navigation/native";
import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { DEFAULT_IMAGE_URL } from "@/const";


export const Account = () => {
    const { getClient, signOut } = useContext(AuthContext)!;
    const client = getClient();

    const { data } = useGetMeQuery(client);

    const navigation = useNavigation<NativeStackNavigationProp<AuthedParamList, "Home", undefined>>();
    const { dismiss } = useBottomSheetModal();

    const adminMemberships = data?.users.me.memberships.filter(m => m.isAdmin);

    const showConfirmDialog = () => {
        return Alert.alert(
            "Logout?",
            "Are you sure you want to logout?",
            [
                {
                    text: "Logout",
                    onPress: () => {
                        signOut();
                    },
                    style: "destructive",
                },
                {
                    text: "No",
                    isPreferred: true,
                },
            ],
        );
    };


    const onEditAccount = () => {
        dismiss();
        navigation.navigate("EditAccount");
    }

    const onManageMemberships = () => {
        dismiss();
        navigation.navigate("ManageMemberships");
    }

    const onManageMembership = (org: GetMeQuery["users"]["me"]["memberships"][number]["org"]) => {
        dismiss();
        const { id, label } = org;
        navigation.navigate("Organization", { id, label });
    }

    const onPastReservations = () => {
        dismiss();
        navigation.navigate("Reservations");
    }

    const uri = data?.users.me.imageUrl || DEFAULT_IMAGE_URL;

    return <View>
        <View className="pt-4">
            <Image className="w-16 h-16 rounded-full mx-auto" source={{ uri }} />
            <View className="pt-2 gap-2">
                <Text className="font-semibold text-2xl text-white text-center">{data?.users.me.name}</Text>
                {false && <Text className="text-gray-400 text-center">{parsePhoneNumberFromString(data?.users.me.phone || "")?.format("NATIONAL") }</Text>}
                <Text className="text-gray-400 text-center">{data?.users.me.memberships.at(0)?.org.label || "Unaffiliated"}</Text>
            </View>
        </View>

        {false && <View className="px-2 pt-4">
            <View className="bg-zinc-800 rounded py-2">
                <TouchableOpacity>
                    <View className="flex-row items-center gap-4 px-4">
                        <View className="bg-green-600 rounded-lg p-1"><HistoryIcon size={20} color="white" /></View>
                        <Text className="text-gray-100 text-lg">Past Reservations</Text>
                    </View>
                </TouchableOpacity>
                <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                <TouchableOpacity>
                    <View className="flex-row items-center gap-4 px-4">
                        <View className="bg-yellow-600 rounded-lg p-1"><StarIcon size={20} color="white" /></View>
                        <Text className="text-gray-100 text-lg">Favorite Locations</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>}

        {false && <View className="px-2 pt-4">
            <View className="bg-zinc-800 rounded py-2">
                <TouchableOpacity>
                    <View className="flex-row items-center gap-4 px-4">
                        <View className="bg-yellow-600 rounded-lg p-1"><CarIcon size={20} color="white" /></View>
                        <Text className="text-gray-100 text-lg">Driving History</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>}

        <View className="px-2 pt-4">
            <View className="bg-zinc-800 rounded py-2">
                <TouchableOpacity onPress={onEditAccount}>
                    <View className="flex-row items-center gap-4 px-4">
                        <View className="bg-purple-600 rounded-lg p-1"><UserRound size={20} color="white" /></View>
                        <Text className="text-gray-100 text-lg">Edit Account</Text>
                    </View>
                </TouchableOpacity>
                <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                {adminMemberships?.length == 1
                ? <>
                    <TouchableOpacity onPress={() => onManageMembership(adminMemberships.at(0)!.org)}>
                        <View className="flex-row items-center gap-4 px-4">
                            <View className="bg-blue-600 rounded-lg p-1"><Building2Icon size={20} color="white" /></View>
                            <Text className="text-gray-100 text-lg">Manage {adminMemberships.at(0)!.org.bio || "Organization"}</Text>
                        </View>
                    </TouchableOpacity>
                    <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                </>
                : adminMemberships?.length != 0 
                ? <>
                    <TouchableOpacity onPress={onManageMemberships}>
                        <View className="flex-row items-center gap-4 px-4">
                            <View className="bg-blue-600 rounded-lg p-1"><Building2Icon size={20} color="white" /></View>
                            <Text className="text-gray-100 text-lg">Manage Memberships</Text>
                        </View>
                    </TouchableOpacity>
                    <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                </>
                : null}
                <TouchableOpacity onPress={showConfirmDialog}>
                    <View className="flex-row items-center gap-4 px-4">
                        <View className="bg-red-600 rounded-lg p-1"><LogOutIcon size={20} color="white" /></View>
                        <Text className="text-gray-100 text-lg">Logout</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    </View>
}
