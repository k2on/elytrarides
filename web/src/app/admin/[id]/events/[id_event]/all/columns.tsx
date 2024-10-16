import View from "@/components/View";
import { ColumnDef } from "@tanstack/react-table";
import { formatTime } from "../util";
import { ReservationStatus } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { useContext } from "react";
import { ContextAdmin } from "../context";
import ReservationStatusBadge from "../ReservationStatusBadge";


export const ANY = -1;
export const NONE = 0;

export interface ReservationFilter {
    reserver: string | null;
    status: ReservationStatus | typeof ANY;
    driver: number | typeof ANY | typeof NONE;
}

export interface ReservationGroupAll {
    id: string;
    madeAt: number;
    reserver: string;
    driver: number;
    status: ReservationStatus;
    wait: number;
}

export const columns: ColumnDef<ReservationGroupAll>[] = [
    {
        accessorKey: "id",
    },
    {
        accessorKey: "madeAt",
        header({ column }) {
            return <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() == "asc")}>
                Time
                <ChevronsUpDown className="ml-2 h-4 w-4 text-purple-400" />
            </Button>
        },
        cell({ row }) {
            const time = formatTime(new Date(row.getValue("madeAt") as number * 1000));
            return <View>{time}</View>
        },
    },
    {
        accessorKey: "reserver",
        header: "Name",
        cell({ cell }) {
            const { event } = useContext(ContextAdmin)!;
            let phone = cell.getValue() as string;
            const reservation = event?.reservations.find(res => res.reserver.phone == phone);
            return <View>{reservation?.reserver.name}</View>
        },
    },
    {
        accessorKey: "driver",
        header({ column }) {
            return <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() == "asc")}>
                Driver
                <ChevronsUpDown className="ml-2 h-4 w-4 text-purple-400" />
            </Button>
        },
        cell({ cell }) {
            const { event } = useContext(ContextAdmin)!;
            let id = cell.getValue() as number;
            const driver = event?.drivers.find(d => d.id == id);
            return <View>{driver?.user.name}</View>
        },
        filterFn: (row, _id, val) => {
            if (val == ANY) return true;
            let driver = row.getValue("driver");
            return driver == val;
        }
    },
    {
        accessorKey: "status",
        header({ column }) {
            return <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() == "asc")}>
                Status
                <ChevronsUpDown className="ml-2 h-4 w-4 text-purple-400" />
            </Button>
        },
        filterFn: (row, _id, val) => {
            if (val == ANY) return true;
            let driver = row.getValue("status");
            return driver == val;
        },
        cell({ row }) {
            const status = row.getValue("status") as ReservationStatus;
            return <ReservationStatusBadge status={status} />
            
        },
    },
    {
        accessorKey: "wait",
        header({ column }) {
            return <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() == "asc")}>
                Wait
                <ChevronsUpDown className="ml-2 h-4 w-4 text-purple-400" />
            </Button>
        },
        cell({ row }) {
            const wait = row.getValue("wait") as number;
            const min = Math.round(wait / 60);
            return `${min}m`
        },
    }
];
