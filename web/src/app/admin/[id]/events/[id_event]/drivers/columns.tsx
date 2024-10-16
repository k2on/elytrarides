"use client"

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { GetOrgMembersDriversQuery, Group } from "@/shared";
import { ColumnDef } from "@tanstack/react-table"
import { Circle } from "lucide-react";
import TimeAgo from "timeago-react";

type RecentDrive = GetOrgMembersDriversQuery["orgs"]["get"]["memberships"][number]["recentDrive"];

type MembershipGroup = Pick<Group, "id" | "label" | "color">;

export type EditDriversColumn = {
  phone: string;
  name: string;
  groups: MembershipGroup[];
  groupsStr: string[];
  lastEvent: RecentDrive;
  totalDrives: number;
}

export const columns: ColumnDef<EditDriversColumn>[] = [
    {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "groups",
        header: "Groups",
        enableHiding: true,
    },
    {
        id: "groupsStr",
        accessorFn: (row) => row.groupsStr.join(", "),
        accessorKey: "groupsStr",
        header: "Groups",
        cell({ row }) {
            const groups = row.getValue("groups") as MembershipGroup[];
            console.log("g", groups);
            return groups.map(g => <Badge key={g.id} variant="outline" className="text-sm hover:bg-zinc-800 cursor-pointer"><Circle style={{ fill: g.color }} className="w-3 h-3 text-transparent mr-2" />{g.label}</Badge>)
            
        },
    },
    {
        accessorKey: "lastEvent",
        header: "Last Drive",
        cell({ row, getValue }) {
            const drive = getValue() as RecentDrive;
            if (!drive) return;
            const { event } = drive;

            return <div className="flex flex-col gap-y-1">
                <TimeAgo live={false} datetime={event.timeStart * 1000} />
                <span className="text-gray-400 text-xs font-semibold">{event.name}</span>
            </div>
        },
    },
    {
        accessorKey: "totalDrives",
        header: "Total Drives",
    },
]

