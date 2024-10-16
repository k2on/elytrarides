"use client";

import client from "@/client";
import View from "@/components/View";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GetOrgMembersQuery, GetOrgVehiclesQuery, Membership, useGetOrgMembersQuery, useGetOrgVehiclesQuery, useInviteCreateMutation, useInviteRevokeMutation, useUpdateGroupMembershipMutation, useUpdateGroupMutation, useUpdateMembershipMutation } from "@/shared";
import { Check, Circle, Clipboard, Copy, FileUp, Pencil, PlusSquare, Trash, UserPlus } from "lucide-react";
import { FC, useReducer, useState } from "react";
import { formatVehicleName } from "@/lib";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { v4 } from "uuid";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DataTable } from "./data-table";
import { Member, Role, columns } from "./columns";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContextManageMembers, ContextManageMembersDispatch, ManageMembersActionType, ManageMembersState, reducer } from "./state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Row } from "@tanstack/react-table";
import { useToast } from "@/components/ui/use-toast";
import { queryClient } from "@/app/ReactQueryProvider";
import Skeleton from "react-loading-skeleton";
import { Separator } from "@/components/ui/separator";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";

interface GroupColor {
    label: string;
    hex: string;
}
const GROUP_COLORS: GroupColor[] = [
    { label: "Gray", hex: "#a8a4a8" },
    { label: "Red", hex: "#f00" },
    { label: "Orange", hex: "#f97516" },
    { label: "Yellow", hex: "#fcf802" },
    { label: "Green", hex: "#98fc02" },
    { label: "Blue", hex: "#02cafc" },
    { label: "Purple", hex: "#f802fc" },
]

interface MembersProps {
    params: { id: string };
}

interface FormMember {
    phone: string;
    name: string;
}

function makeRoles(membership: GetOrgMembersQuery["orgs"]["get"]["memberships"][0]): Role[] {
    const roles: Role[] = [];
    if (membership.isAdmin) roles.push(Role.ADMIN);
    return roles;
}

export function makeFlags(roles: Role[]): number {
    let flags = 1;
    if (roles.includes(Role.ADMIN)) flags += 4;
    return flags;
}

const members: FC<MembersProps> = ({ params }) => {
    const form = useForm<FormMember>();
    const { id } = params;
    const { toast } = useToast();
    const [isAddOpen, setIsAddOpen] = useState(false);

    const { mutate: createInvite } = useInviteCreateMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetOrgMembers", { id }]);
        },
    });

    const onCreateNewInvite = () => {
        createInvite({
            id: v4(),
            idOrg: id,
        });
    }

    const { mutate } = useUpdateMembershipMutation(client, {
        onSuccess(data, variables, context) {
            setIsAddOpen(false);
            toast({ description: "Member(s) updated" })
            queryClient.invalidateQueries(["GetOrgMembers", { id }]);
        },
        onError(error, variables, context) {
            alert("ERROR" + error);
            
        },
    });

    const { mutate: updateGroupMember } = useUpdateGroupMembershipMutation(client, {
        onSuccess(data, variables, context) {
          queryClient.invalidateQueries(["GetOrgMembers", { id }]);
        },
    });

    const { mutate: updateGroup } = useUpdateGroupMutation(client, {
        onSuccess(data, variables, context) {
            if (!state.creatingGroup) return;
            for (const phone of state.creatingGroup.phones) {
                updateGroupMember({
                    idOrg: id,
                    idGroup: variables.idGroup,
                    phone,
                    isRemoved: false,
                })
            }
            dispatch({ type: ManageMembersActionType.SET_SHOW_NEW_GROUP, creatingGroup: null });
            toast({ description: "Created user group" });
        },
    })

    const addRole = (row: Row<Member>, role: Role) => {
        const roles = row.getValue("roles") as Role[];
        roles.push(role);
        const flags = makeFlags(roles);
        mutate({ idOrg: id, phone: row.getValue("phone"), flags })
    }

    const removeRole = (row: Row<Member>, role: Role) => {
        const roles = row.getValue("roles") as Role[];
        const idx = roles.indexOf(role);
        if (idx === -1) return;
        roles.splice(idx, 1);
        const flags = makeFlags(roles);
        mutate({ idOrg: id, phone: row.getValue("phone"), flags })
    }

    const initial: ManageMembersState = {
        idOrg: id,
        removePhones: [],
        creatingGroup: null,
        addRole,
        removeRole,
    }

    const [state, dispatch] = useReducer(reducer, initial);

    const { data: members } = useGetOrgMembersQuery(client, { id });

    const onSubmit = (form: FormMember) => {
        mutate({ idOrg: id, phone: form.phone, flags: 1 });
    };

    const data: Member[] = [];
    const memberMap: {[k: string]: Member} = {};    

    members?.orgs.get.memberships.forEach(membership => {
        const member = {
            name: membership.user.name,
            image_url: membership.user.imageUrl,
            phone: membership.user.phone,
            roles: makeRoles(membership),
        };
        data.push(member);
        memberMap[member.phone] = member;
    });

    const onRemove = (phones: string[]) => {
        phones.forEach(phone => {
            mutate({ idOrg: id, phone, flags: 0 });
        });
    }

    const onColorSelect = (hex: string) => {
        if (!state.creatingGroup) return;
        updateGroup({
            idOrg: id,
            idGroup: v4(),
            form: {
                label: state.creatingGroup?.label,
                color: hex,
            }
        })
    }

    return <ContextManageMembers.Provider value={state}>
        <ContextManageMembersDispatch.Provider value={dispatch}>
            <View className="max-w-3xl mx-auto px-6 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Organization Members</CardTitle>
                        <CardDescription>Manage your organization's members</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <View className="flex space-x-2 mb-8">
                            {!members
                            ? <Skeleton width={200} height={40} />
                            : members.orgs.get.invites.length == 0
                            ? <Button onClick={onCreateNewInvite}><PlusSquare className="w-4 h-4 mr-2" />Create Invite Link</Button>
                            : members.orgs.get.invites.map(invite => <Invite org={id} invite={invite} />)}
                        </View>
                        <Separator />
                        <DataTable columns={columns} data={data} />
                    </CardContent>
                </Card>
            </View>

        <CommandDialog open={state.creatingGroup != null} onOpenChange={() => dispatch({ type: ManageMembersActionType.SET_SHOW_NEW_GROUP, creatingGroup: null })}>
            <CommandInput placeholder="Pick a color for the group" />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                    {GROUP_COLORS.map(c => <CommandItem onSelect={() => onColorSelect(c.hex)}><Circle style={{ fill: c.hex }} className="w-1 h-1 mr-2 text-transparent p-1" /> {c.label}</CommandItem>)}
                </CommandGroup>
              </CommandList>
        </CommandDialog>

        <AlertDialog open={state.removePhones.length > 0} onOpenChange={(open) => !open && dispatch({ type: ManageMembersActionType.RESET_REMOVE })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove these people as members of your organization?
                <Card className="p-4 mt-2">
                    <ul>
                        {state.removePhones.map(phone => {
                            const member = memberMap[phone];
                            return <li>{member.name} - {member.phone}</li>
                        })}
                    </ul>
                </Card>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRemove(state.removePhones)}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </ContextManageMembersDispatch.Provider>
    </ContextManageMembers.Provider>
}

interface InviteProps {
    org: string;
    invite: GetOrgMembersQuery["orgs"]["get"]["invites"][0]
}
function Invite({ org, invite }: InviteProps) {
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    const { mutate: createInvite } = useInviteCreateMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetOrgMembers", { id: org }]);
        },
    });

    const { mutate: revokeInvite } = useInviteRevokeMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetOrgMembers", { id: org }]);
            createInvite({
                idOrg: org,
                id: v4()
            })
            toast({ description: "New link created! "});
        },
    });

    const onCopy = async () => {
        setIsCopied(true);
        const link = `${window.location.origin}/i/${invite.id}`;
        await navigator.clipboard.writeText(link);
        toast({ description: "Invitation link copied" });
        setTimeout(() => {
            setIsCopied(false);
        }, 1000);
    }

    const onNewLink = async () => {
        revokeInvite({ id: invite.id });
    }

    return <View>
        <View className="text-gray-400 text-sm">Anyone with this link can join your organization. <Button onClick={onNewLink} variant="link">Create a new link</Button></View>
        <View key={invite.id} className="flex flex-row border items-center rounded">
            <Button onClick={onCopy} disabled={isCopied} variant="ghost" className="rounded-none border-r">{isCopied
                ? <Check className="w-4 h-4" />
                : <Copy className="w-4 h-4" />}
            </Button>
            <View className="font-mono text-sm px-4 text-gray-400">elytra.to/i/{invite.id}</View>
        </View>
    </View>
}

export default members;


