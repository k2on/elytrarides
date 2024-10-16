import { GetMeQuery, q, useGetMeQuery } from "@/shared";
import { useContext } from "react";
import { ScrollView, Text, View } from "react-native"
import { AuthContext } from "../state";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthedParamList } from "../Authed";

export const Memberships = () => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();


    const { data } = useGetMeQuery(client);


    return <ScrollView contentInsetAdjustmentBehavior="automatic" className="pt-4">
        {data?.users.me.memberships.map(m => <MembershipPreview key={m.org.id} membership={m} />)}
    </ScrollView>
}

interface MembershipPreviewProps {
    membership: GetMeQuery["users"]["me"]["memberships"][number];
}
const MembershipPreview = ({ membership }: MembershipPreviewProps) => {
    const navigation = useNavigation<NativeStackNavigationProp<AuthedParamList, "Home", undefined>>();

    const org = membership.org;

    const onPress = () => {
        navigation.navigate("Organization", { id: org.id, label: org.bio || "Organization" })
    }

    return <View className="py-2 px-2">
        <TouchableOpacity onPress={onPress}>
            <View className="bg-zinc-900 p-4 rounded border-[1px] border-zinc-800">
                <Text className="text-gray-400 font-[Georgia]">{org.label}</Text>
                <Text className="text-white text-lg">{org.bio}</Text>
            </View>
        </TouchableOpacity>
    </View>
}
