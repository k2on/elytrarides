import { GetOrgMembersQuery, q, useGetOrgMembersQuery, useInviteCreateMutation, useInviteRevokeMutation, useUpdateMembershipMutation } from "@/shared";
import { useContext, useRef, useState } from "react";
import { ScrollView } from "react-native-gesture-handler";
import { AuthContext } from "../state";
import { AuthedParamList } from "../Authed";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Animated, FlatList, NativeScrollEvent, NativeSyntheticEvent, SafeAreaView, SectionList, Share, Text, TouchableOpacity, View } from "react-native";
import { ArrowUp01, CarFront, ShieldIcon, StarIcon } from "lucide-react-native";
import { Phone } from "../Phone";
import uuid from "react-native-uuid";

export enum Role {
    ADMIN,
    DRIVER,
}

function makeRoles(membership: GetOrgMembersQuery["orgs"]["get"]["memberships"][0]): Role[] {
    const roles: Role[] = [];
    if (membership.isAdmin) roles.push(Role.ADMIN);
    if (membership.isDriver) roles.push(Role.DRIVER);
    return roles;
}

function makeFlags(roles: Role[]): number {
    let flags = 1;
    if (roles.includes(Role.DRIVER)) flags += 2;
    if (roles.includes(Role.ADMIN)) flags += 4;
    return flags;
}


type PropsOrg = NativeStackScreenProps<AuthedParamList, "OrganizationMembers">;
export const OrganizationMembers = ({ route }: PropsOrg) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();
    const { params } = route;
    const { id, searchValue } = params;

    const { data } = useGetOrgMembersQuery(client, { id });

    const results = data?.orgs.get.memberships
        .filter(m => m.user.name.toLowerCase().includes(searchValue.toLowerCase()))
        .sort((a, b) => {
            // Extract the last names by taking the last part after splitting by space
            let lastNameA = a.user.name.split(" ").pop()!.toLowerCase();
            let lastNameB = b.user.name.split(" ").pop()!.toLowerCase();
            // Compare the last names for sorting
            if (lastNameA < lastNameB) return -1;
            if (lastNameA > lastNameB) return 1;
            return 0;
        });

    return <FlatList
        className="px-4"
        contentInsetAdjustmentBehavior="always"
        data={results}
        renderItem={({ item }) => <MemberView idOrg={id} membership={item} />}
    />;

}

type Member = GetOrgMembersQuery["orgs"]["get"]["memberships"][number];
interface MemberProps {
    idOrg: string;
    membership: Member
}
const MemberView = ({ idOrg, membership }: MemberProps) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();

    let parts = membership.user.name.split(" ");
    const last = parts.pop()!;
    const first = parts.join(" ");

    const { mutate } = useUpdateMembershipMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetOrgMembers", { id: idOrg }]);
        },
        onError(error, variables, context) {
            alert("ERROR" + error);
        },
    });

    const getRoles = () => {
        const roles: Role[] = [];
        if (membership.isAdmin) roles.push(Role.ADMIN);
        if (membership.isDriver) roles.push(Role.DRIVER);
        return roles;
    }

    const addRole = (role: Role) => {
        const roles = getRoles();
        roles.push(role);
        const flags = makeFlags(roles);
        mutate({ idOrg, phone: membership.user.phone, flags })
    }

    const removeRole = (role: Role) => {
        const roles = getRoles();
        const idx = roles.indexOf(role);
        if (idx === -1) return;
        roles.splice(idx, 1);
        const flags = makeFlags(roles);
        mutate({ idOrg, phone: membership.user.phone, flags });
    }


    const onPress = () => {
        Alert.alert(membership.user.name, "What would you like to do with them?", [
            {
                text: membership.isAdmin ? "Remove Admin Status" : "Make Admin",
                onPress: () => {
                    if (membership.isAdmin) {
                        removeRole(Role.ADMIN);
                    } else {
                        addRole(Role.ADMIN);
                    }

                }
            },
            {
                text: "Remove Member",
                style: "destructive",
                onPress: () => {
                    Alert.alert("Remove Member", "Are you sure you want to remove this member?", [
                        {
                            text: "Cancel",
                            isPreferred: true,
                        },
                        {
                            text: "Remove",
                            style: "destructive",
                            onPress: () => {
                                mutate({ idOrg, phone: membership.user.phone, flags: 0 });
                            }
                        }
                    ])

                }
            },
            {
                text: "Close",
                isPreferred: true,
            }
        ])

    }

    return <TouchableOpacity onPress={onPress}>
        <View className="border-b-[1px] border-zinc-900 py-2 flex-row justify-between">
            <View>
                <Text className="text-lg text-white">{first} <Text className="font-semibold">{last}</Text></Text>
            </View>
            <View className="items-center flex-row">
                {membership.isAdmin && <Text className="text-gray-400">Admin</Text>}
            </View>
        </View>
    </TouchableOpacity>
}

interface AddMembersProps {
    id: string;
}
export const AddMembers = ({ id }: AddMembersProps) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();

    const { data } = useGetOrgMembersQuery(client, { id });

    const i = data?.orgs.get.invites[0];

    const { mutate: createInvite } = useInviteCreateMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetOrgMembers", { id }]);
        },
    });

    const onCreateLink = () => {
        createInvite({
            idOrg: id,
            id: uuid.v4(),
        })
    }

    return <View className="flex-1 justify-between pb-16">
        <View className="gap-y-2">
            <Text className="text-xl text-white text-center">Add Members</Text>
            <Text className="text-gray-400 text-center">Anyone with this link can join your organization.</Text>
        </View>
        <View className="px-4">
            {!i
            ? <TouchableOpacity onPress={onCreateLink} className="w-full bg-white py-2 rounded">
                <Text className="text-black text-lg text-center">Create Invite Link</Text>
              </TouchableOpacity>
            : <InviteLink  idOrg={id} invite={i} />}
        </View>
    </View>
}

interface InviteLinkProps {
    idOrg: string;
    invite: GetOrgMembersQuery["orgs"]["get"]["invites"][number];
}
const InviteLink = ({ idOrg, invite }: InviteLinkProps) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();

    const createdAt = new Date(invite.createdAt * 1000).toLocaleDateString();

    const { mutate: createInvite } = useInviteCreateMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetOrgMembers", { id: idOrg }]);
        },
    });

    const { mutate: revokeInvite } = useInviteRevokeMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetOrgMembers", { id: idOrg }]);
            createInvite({
                idOrg,
                id: uuid.v4()
            })
        },
    });

    const onNewInvite = () => {
        revokeInvite({ id: invite.id });
    }

    const onShare = () => {
        Share.share({
            url: `https://elytra.to/i/${invite.id}`,
        });
    }

    return <View>
        <View className="pt-4">
            <View className="bg-zinc-800 p-2 rounded">
                <Text className="text-white text-[12px] font-[Courier]">elytra.to/i/{invite.id}</Text>
            </View>
        </View>
        <View className="pb-6 pt-2">
            <Text className="text-gray-400" selectable>Link created on {createdAt}</Text>
        </View>
        <View className="pb-10">
            <TouchableOpacity onPress={onNewInvite}>
                <Text className="text-white font-semibold">Create New Link</Text>
            </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onShare} className="w-full bg-white py-2 rounded">
            <Text className="text-black text-lg text-center">Share Invite</Text>
        </TouchableOpacity>
    </View>
}
