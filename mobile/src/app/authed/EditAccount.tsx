import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack";
import { Alert, Button, Image, Text, TouchableOpacity, View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import { AuthedParamList } from "../Authed";
import { PencilLineIcon, TrashIcon } from "lucide-react-native";
import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext, URL_UPLOAD } from "../state";
import { q, useDeleteAccountMutation, useGetMeQuery, useUpdateAccountMutation } from "@/shared";
import { DEFAULT_IMAGE_URL, NAVIGATION_APP_KEY, NavigationApp } from "@/const";
import parsePhoneNumberFromString from "libphonenumber-js";
import { getImageId } from "../util";
import * as ImagePicker from "expo-image-picker";
// import RNFetchBlob from "rn-fetch-blob";
import { Buffer } from "buffer";
import { MenuView } from "@react-native-menu/menu";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";

type PropsAccount = NativeStackScreenProps<AuthedParamList, "EditAccount">;

interface MediaResponse {
    id: string;
}

export const EditAccount = ({ navigation }: PropsAccount) => {
    

    const { getClient, signOut, getToken } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();

    const [profileImage, setProfileImage] = useState<string>();

    const [navigationApp, setNavigationApp] = useState<number>();

    useEffect(() => {
        getItemAsync(NAVIGATION_APP_KEY).then(result => {
            const app = result ? parseInt(result) : NavigationApp.APPLE;
            setNavigationApp(app);
        });
    }, [])

    const { data } = useGetMeQuery(client, undefined, {
        onSuccess(data) {
            setProfileImage(getImageId(data.users.me.imageUrl))
        },
    });

    const uri = data?.users.me.imageUrl || DEFAULT_IMAGE_URL;
    const name = data?.users.me.name;


    const { mutate: confirmDelete } = useDeleteAccountMutation(client);
    const { mutate: editAccount } = useUpdateAccountMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetMe"]);
        },
    });

    const uploadPhoto = useCallback(async () => {
        if (!name) return;

        const permReq = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permReq.status != ImagePicker.PermissionStatus.GRANTED) {
            Alert.alert("Please allow Elytra to access your camera");
            return;
        }
        const resp = await ImagePicker.launchImageLibraryAsync({
            base64: true,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
        });
        if (!resp.canceled) {
            const asset = resp.assets.at(0);
            if (!asset) return Alert.alert("No image uploaded");
            const url = URL_UPLOAD + "/profile_image";
            const formData = new FormData();

            const file = {
                uri: asset.uri,
                name: "image.jpg",
                type: "image/jpeg",
            };
            formData.append("profile_image", file as any);

            try {
                const uploadResp = await fetch(url, {
                    method: "POST",
                    body: formData,
                    headers: {
                        Authorization: getToken(),
                    }
                });
                if (!uploadResp.ok) {
                    console.error(uploadResp);
                    return Alert.alert("Could not upload image");
                }
                const json = await uploadResp.json() as MediaResponse;

                editAccount({ name, profileImage: json.id });
            } catch (e) {

            }
        }
    }, [])

    const takePhoto = useCallback(async () => {
        if (!name) return;

        const permReq = await ImagePicker.requestCameraPermissionsAsync();
        if (permReq.status != ImagePicker.PermissionStatus.GRANTED) {
            Alert.alert("Please allow Elytra to access your camera");
            return;
        }
        const resp = await ImagePicker.launchCameraAsync({
            base64: true,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            cameraType: ImagePicker.CameraType.front,
        });
        if (!resp.canceled) {
            const asset = resp.assets.at(0);
            if (!asset) return Alert.alert("No image uploaded");
            const url = URL_UPLOAD + "/profile_image";
            const formData = new FormData();

            const file = {
                uri: asset.uri,
                name: "image.jpg",
                type: "image/jpeg",
            };
            formData.append("profile_image", file as any);

            try {
                const uploadResp = await fetch(url, {
                    method: "POST",
                    body: formData,
                    headers: {
                        Authorization: getToken(),
                    }
                });
                if (!uploadResp.ok) {
                    console.error(uploadResp);
                    return Alert.alert("Could not upload image");
                }
                const json = await uploadResp.json() as MediaResponse;

                editAccount({ name, profileImage: json.id });
            } catch (e) {

            }
        }
    }, [])

    const onEditProfileImage = () => {
        Alert.alert("Change Profile Image", "", [
            {
                text: "Take Photo",
                onPress: takePhoto,
            },
            {
                text: "Upload Photo",
                onPress: uploadPhoto,
            },
            {
                text: "Remove Image",
                style: "destructive",
                onPress: () => {
                    Alert.alert("Remove Profile Picture", "Are you sure you want to remove your profile picture?", [
                        {
                            text: "No",
                            isPreferred: true,
                        },
                        {
                            text: "Remove",
                            style: "destructive",
                            onPress: () => {
                                if (!name) return;
                                editAccount({ name, profileImage: null })
                            }
                        },
                    ])
                }
            },
            {
                text: "Cancel",
            },
        ])
        // navigation.navigate("EditAccountProfileImage")
    }

    const onEditName = () => {
        Alert.prompt("Change Name", "", (name: string) => {
            if (!name) return;
            editAccount({ name, profileImage })
        }, "plain-text", data?.users.me.name || "")

    }
    
    const onDeleteAccount = () => {
        return Alert.alert(
            "Delete your account?",
            "This action is irreversible",
            [
                {
                    text: "Yes",
                    onPress: () => {
                        confirmDelete({})
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

    const onNavigationAppChange = async (app: NavigationApp) => {
        await setItemAsync(NAVIGATION_APP_KEY, app.toString());
        setNavigationApp(app);
    }

    return <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View className="px-2 pt-4">
            <View className="bg-zinc-900 rounded py-2">
                <TouchableOpacity onPress={onEditProfileImage}>
                    <View className="flex-col gap-2 px-4">
                        <Image className="w-16 h-16 rounded-full" source={{ uri }} />
                        <View>
                            <Text className="text-gray-100 text-lg">Profile Image</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                <TouchableOpacity onPress={onEditName}>
                    <View className="flex-row items-center gap-4 px-4 justify-between">
                        <Text className="text-gray-100 text-lg">Name</Text>
                        <Text className="text-gray-400 text-lg">{data?.users.me.name}</Text>
                    </View>
                </TouchableOpacity>
                <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                <View className="flex-row items-center gap-4 px-4 justify-between">
                    <Text className="text-gray-100 text-lg">Phone</Text>
                    <Text className="text-gray-400 text-lg">{parsePhoneNumberFromString(data?.users.me.phone || "")?.format("NATIONAL")}</Text>
                </View>
            </View>
        </View>

        <View className="px-2 pt-4">
            <View className="bg-zinc-900 rounded py-2">
                <View className="flex-row items-center gap-4 px-4 justify-between">
                    <Text className="text-gray-100 text-lg">Navigation App</Text>
                    <MenuView
                        onPressAction={(e) => {
                            const app = parseInt(e.nativeEvent.event);
                            onNavigationAppChange(app);
                        }}
                        actions={[
                            {
                                title: "Apple Maps",
                                id: NavigationApp.APPLE.toString(),
                                state: navigationApp == NavigationApp.APPLE ? "on" : "off",
                            },
                            {
                                title: "Google Maps",
                                id: NavigationApp.GOOGLE.toString(),
                                state: navigationApp == NavigationApp.GOOGLE ? "on" : "off",
                            },
                            {
                                title: "Waze",
                                id: NavigationApp.WAZE.toString(),
                                state: navigationApp == NavigationApp.WAZE ? "on" : "off",
                            }
                        ]}
                    >
                    <Text className="text-gray-400 text-lg">{navigationApp == NavigationApp.APPLE
                    ? "Apple Maps"
                    : navigationApp == NavigationApp.GOOGLE
                    ? "Google Maps"
                    : "Waze"}</Text>
                    </MenuView>
                </View>
            </View>
        </View>

        <View className="px-2 pt-4">
            <View className="bg-zinc-900 rounded py-2">
                <TouchableOpacity onPress={onDeleteAccount}>
                    <View className="flex-row items-center gap-4 px-4">
                        <View className="bg-red-600 rounded-lg p-1"><TrashIcon size={20} color="white" /></View>
                        <Text className="text-red-600 text-lg">Delete Account</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>


    </ScrollView>
}

