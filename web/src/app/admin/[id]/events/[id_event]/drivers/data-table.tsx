"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EditDriversColumn, columns } from "./columns"
import { Group, useGetAdminEventQuery, useGetOrgMembersDriversQuery, useGetOrgMembersQuery, useUpdateEventDriverMutation } from "@/shared"
import client from "@/client"
import { useParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Circle } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

type OnSaveFn = (phones: string[]) => void;

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onSave: OnSaveFn,
}

function DataTable<TData, TValue>({
  columns,
  data,
  onSave,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState("")


  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getColumnCanGlobalFilter: (col) => ["name", "groupsStr"].includes(col.id),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      globalFilter,
      rowSelection,
      columnVisibility: {
          "groups": false,
      }
    }
  })

  const { id, id_event } = useParams();
  const { data: members } = useGetOrgMembersQuery(client, { id });

  const selectPhones = (phones: string[]) => {
      const overwrite = Object.keys(rowSelection).length == 0;
      const selection = rowSelection;
      data.forEach((row, idx) => {
          const member = row as EditDriversColumn;
          const shouldSelect = phones.includes(member.phone);
          // console.log(member.phone, shouldSelect);
          selection[idx.toString()] = overwrite ? shouldSelect : shouldSelect || rowSelection[idx.toString()];

      })
      setRowSelection({...selection});
  }


  const { data: adminEvent } = useGetAdminEventQuery(client, { id: id_event }, {
      refetchOnWindowFocus: false,
  });

  useEffect(() => {
      if (!members || !adminEvent || data.length == 0) return;
      const phones = adminEvent.events.get.drivers.map(d => d.phone);
      selectPhones(phones);
  }, [data, members, adminEvent])

  const onSelectGroup = (group: Pick<Group, "id" | "label">) => {
      toast({ description: "Selected all members of " + group.label });
      const userPhones: string[] = [];
      for (const member of members?.orgs.get.memberships || []) {
          if (member.groups.some(g => g.group.id == group.id)) userPhones.push(member.user.phone);
      }
      // console.log("phones", userPhones)
      selectPhones(userPhones);
  }

  const onSaveClick = () => {
      const phones = data.filter((_, idx) => rowSelection[idx.toString()]).map((r: any) => r.phone);
      onSave(phones);
  }

  return (
    <div>
      <div className="flex py-4 flex-col">
        <Input
          autoFocus
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.currentTarget.value)}
          className="max-w-sm"
        />
        <ScrollArea className="max-w-[486px] whitespace-nowrap">
            <div className="py-2 gap-x-2 flex w-max py-4">
                {members?.orgs.get.groups.map(g => <Badge onClick={() => onSelectGroup(g)} key={g.id} variant="outline" className="text-sm hover:bg-zinc-800 cursor-pointer"><Circle style={{ fill: g.color }} className="w-3 h-3 text-transparent mr-2" />{g.label}</Badge>)}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    <div className="rounded-md border mr-6 max-h-[60vh] overflow-y-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
        <DialogFooter className="pr-6 pt-4">
            <Button onClick={onSaveClick}>Save Drivers</Button>
        </DialogFooter>
    </div>
  )
}

interface DriversTableProps {
    onSave: OnSaveFn,
}
export function DriversTable({ onSave }: DriversTableProps) {
    const { id } = useParams();

    const { data } = useGetOrgMembersDriversQuery(client, { id });
    const drivers: EditDriversColumn[] = data?.orgs.get.memberships.map(m => ({
        phone: m.user.phone,
        name: m.user.name,
        groups: m.groups.map(g => g.group),
        groupsStr: m.groups.map(g => g.group.label),
        lastEvent: m.recentDrive,
        totalDrives: m.totalDrives,
    })) || [];

    return <DataTable columns={columns} data={drivers} onSave={onSave} />
}
