"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CarFront, ArrowUpDown, MoreHorizontal, ShieldAlert, Trash, Shield, Plus, Circle, Check } from "lucide-react"
 
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import View from "@/components/View";
import { Badge } from "@/components/ui/badge";
import Text from "@/components/Text";
import { createRef, useContext, useRef, useState } from "react";
import { ContextManageMembers, ContextManageMembersDispatch, ManageMembersActionType } from "./state";
import { formatPhoneNumber } from "react-phone-number-input";
import client from "@/client";
import { useGetOrgMembersQuery, useUpdateGroupMembershipMutation, useUpdateMembershipMutation } from "@/shared";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { queryClient } from "@/app/ReactQueryProvider";
import { useToast } from "@/components/ui/use-toast";

export enum Role {
    ADMIN,
}

export interface Member {
    phone: string;
    name: string;
    image_url: string | undefined | null;
    roles: Role[];
}

export const columns: ColumnDef<Member>[] = [
  {
    id: "select",
    header: ({ table }) => {
      return;
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: any) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "roles",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    filterFn: (row, colId, value: Role[]) => {
        for (const role of value) {
            if (!(row.getValue("roles") as Role[]).includes(role)) return false;
        }

        return true;

    },
    cell({ row }) {
        const roles = row.getValue("roles") as Role[];
        const { idOrg } = useContext(ContextManageMembers)!;
        const { data } = useGetOrgMembersQuery(client, { id: idOrg });
        const member = data && data.orgs.get.memberships.find(m => m.user.phone == row.getValue("phone"));
        return <View className="flex space-x-2">{roles.includes(Role.ADMIN) && <Badge variant="destructive">Admin</Badge>}{member?.groups.map(g => <Badge key={g.group.id} variant="outline" className="text-sm hover:bg-zinc-800 cursor-pointer"><Circle style={{ fill: g.group.color }} className="w-3 h-3 text-transparent mr-2" />{g.group.label}</Badge>)}</View>
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell({ row }) {
        const phone = row.getValue("phone") as string;
        return <span>{formatPhoneNumber(phone)}</span>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
        const { toast } = useToast();
      const roles = row.getValue("roles") as Role[];

      const isAdmin = roles.includes(Role.ADMIN);

      const { idOrg, addRole, removeRole } = useContext(ContextManageMembers)!;
      const dispatch = useContext(ContextManageMembersDispatch)!;

      const { data } = useGetOrgMembersQuery(client, { id: idOrg })
      const member = data && data.orgs.get.memberships.find(m => m.user.phone == row.getValue("phone"));

      const [isOpen, setIsOpen] = useState(false);

      const { mutate } = useUpdateGroupMembershipMutation(client, {
          onSuccess(data, variables, context) {
                queryClient.invalidateQueries(["GetOrgMembers", { id: idOrg }]);
                setIsOpen(false);
                toast({ description: "Updated user group" });
          },
      });

      const [search, setSearch] = useState("");

      const showNewGroup = search.length > 0 && (data && ["admin", "remove", ...data.orgs.get.groups.map(g => g.label.toLowerCase())].every(g => !g.includes(search.toLowerCase())));

      const onRemove = () => {
        setIsOpen(false);
        dispatch({ type: ManageMembersActionType.SET_REMOVE, phones: [row.getValue("phone")] })
      }

      const onRemoveAdmin = () => {
          setIsOpen(false);
          removeRole(row, Role.ADMIN);
      }

      const onMakeAdmin = () => {
          setIsOpen(false);
          addRole(row, Role.ADMIN);
      }

      const onNewGroup = () => {
          setIsOpen(false);
          dispatch({ type: ManageMembersActionType.SET_SHOW_NEW_GROUP, creatingGroup: {
                label: search,
                phones: [row.getValue("phone") as string],
              }
          });
      }

      const onAddToGroup = (idGroup: string) => {
          const phone = row.getValue("phone") as string;
          mutate({
              idOrg,
              idGroup,
              phone,
              isRemoved: false,
          })
      }

      const onRemoveFromGroup = (idGroup: string) => {
          const phone = row.getValue("phone") as string;
          mutate({
              idOrg,
              idGroup,
              phone,
              isRemoved: true,
          })
      }

      return (
        <DropdownMenu open={isOpen} onOpenChange={() => {
            setSearch("");
            setIsOpen(!isOpen);
        }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Command filter={(value, search) => {
                if (value == "new" && search.length > 0) return 1;
                if (value.toLowerCase().includes(search.toLowerCase())) return 1
                return 0
            }}>
              <CommandInput onChangeCapture={(e) => setSearch(e.currentTarget.value)} autoFocus placeholder="Create Group..." />
              <CommandList>
                <CommandEmpty>No results.</CommandEmpty>
                <CommandGroup heading="Groups">
                  {isAdmin
                  ? <CommandItem onSelect={onRemoveAdmin}><Check className="mr-2 w-4 h-4" /> Admin</CommandItem>
                  : <CommandItem onSelect={onMakeAdmin}><Shield className="mr-2 w-4 h-4" /> Admin</CommandItem>}
                  {data?.orgs.get.groups.map(g => member?.groups.some(memberGroup => memberGroup.group.id == g.id)
                  ? <CommandItem onSelect={() => onRemoveFromGroup(g.id)}><Check className="mr-2 w-4 h-4" />{g.label}</CommandItem>
                  : <CommandItem onSelect={() => onAddToGroup(g.id)}><Circle style={{ fill: g.color }} className="w-4 h-4 mr-2 text-transparent" />{g.label}</CommandItem>)}
                  {showNewGroup && <CommandItem onSelect={onNewGroup} value="new"><Plus className="pr-1 w-4 h-4" /> Create group: <span className="pl-1 text-gray-400">{search}</span></CommandItem>}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Actions">
                  <CommandItem onSelect={onRemove} className="text-destructive"><Trash className="mr-2 w-4 h-4" /> Remove</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
]
