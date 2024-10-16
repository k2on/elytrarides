import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ColumnDef, ColumnFiltersState, SortingState, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowRightCircle, Car, Check, CheckCircle2, ChevronsUpDown, CircleDotDashed, Clock4, User2, XCircle } from "lucide-react";
import { useContext, useState } from "react";
import { ContextAdmin, ContextAdminDispatch } from "../context";
import { Reservation, ReservationStatus } from "../types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import View from "@/components/View";
import { formatPhoneNumber } from "react-phone-number-input";
import { ANY } from "./columns";
import { AdminActionType } from "../actions";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

type Reserver = Reservation["reserver"];
type Phone = string;

export function getReservers(reservations: Reservation[]): Reserver[] {
    const phones = new Set<Phone>();
    const reservers = [];
    for (const res of reservations) {
        if (phones.has(res.reserver.phone)) continue;
        phones.add(res.reserver.phone);
        reservers.push(res.reserver);
    }
    return reservers;
}

export default function DateTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
    const { event, filter } = useContext(ContextAdmin)!;
    const dispatch = useContext(ContextAdminDispatch)!;

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
        {id: "status", value: filter.status},
    ]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
            columnVisibility: { id: false },
        },
    });

    const reservers = event && getReservers(event.reservations) || [];
    
    const [open, setOpen] = useState(false);

    const filteredDriver = table.getColumn("driver")?.getFilterValue() as number ?? -1;
    const filteredDriverLabel = filteredDriver == -1 ? "Any Driver" : filteredDriver == 0 ? "No Driver" : event?.drivers.find(driver => driver.id == filteredDriver)?.user.name;
    const onFilteredDriverChange = (driver: string) => {
        console.log("driver", driver);
        table.getColumn("driver")?.setFilterValue(driver);
    }

    const filteredStatusLabel = filter.status == ANY ? "Any Status" : filter.status == ReservationStatus.ACTIVE ? "Active" : filter.status == ReservationStatus.WAITING ? "Waiting" : filter.status == ReservationStatus.COMPLETE ? "Complete" : "Cancelled";
    const onFilteredStatusChange = (statusStr: string) => {
        const status = parseInt(statusStr);
        table.getColumn("status")?.setFilterValue(status);
        dispatch({ type: AdminActionType.SET_FILTER_STATUS, status });
    }

    const filteredReserver = table.getColumn("reserver")?.getFilterValue() as string ?? "";
    const filteredReserverLabel = filteredReserver ? reservers.find((reserver) => reserver.phone === filteredReserver)?.name : "Any Reserver";

    return <View className="px-4">
        <View className="flex space-x-2">
            <DropdownMenu>
                <DropdownMenuTrigger><Button variant={filteredDriver == -1 ? "outline" : "default"}><Car className="w-4 h-4 mr-2" /> {filteredDriverLabel}</Button></DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Driver</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={filteredDriver.toString()} onValueChange={onFilteredDriverChange}>
                        <DropdownMenuRadioItem value="-1">Any</DropdownMenuRadioItem>
                        {event?.drivers?.map(driver => <DropdownMenuRadioItem value={driver.id.toString()}>{driver.user.name}</DropdownMenuRadioItem>)}
                        <DropdownMenuRadioItem value="0">None</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger><Button variant={filter.status == ANY ? "outline" : "default"}>{filter.status == ANY
                ? <CircleDotDashed className="w-4 h-4 mr-2" />
                : filter.status == ReservationStatus.COMPLETE
                ? <CheckCircle2 className="w-4 h-4 mr-2" />
                : filter.status == ReservationStatus.CANCELLED
                ? <XCircle className="w-4 h-4 mr-2" />
                : filter.status == ReservationStatus.WAITING
                ? <Clock4 className="w-4 h-4 mr-2" />
                : <ArrowRightCircle className="w-4 h-4 mr-2" />} {filteredStatusLabel}</Button></DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={filter.status.toString()} onValueChange={onFilteredStatusChange}>
                        <DropdownMenuRadioItem value="-1">Any</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value={ReservationStatus.CANCELLED.toString()}>Cancelled</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value={ReservationStatus.COMPLETE.toString()}>Complete</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value={ReservationStatus.ACTIVE.toString()}>Active</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value={ReservationStatus.WAITING.toString()}>Waiting</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant={filteredReserver == "" ? "outline" : "default"}><User2 className="w-4 h-4 mr-2" /> {filteredReserverLabel}</Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command filter={(filteredReserver, search) => {
                    if (filteredReserver.includes(search)) return 1;
                    return 0;
                }}>
                  <CommandInput placeholder="Name or number..." />
                  <CommandEmpty>No user found.</CommandEmpty>
                  <CommandGroup>
                    {reservers.map((reserver) => (
                      <CommandItem
                        key={reserver.phone}
                        value={`${reserver.name} - ${reserver.phone}`}
                        onSelect={(currentValue) => {
                          const current = currentValue.split(" - ")[1];
                          table.getColumn("reserver")?.setFilterValue(current == filteredReserver ? "" : current);
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filteredReserver === reserver.phone ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span>{reserver.name}</span><span className="text-gray-400 ml-2">{" · " + formatPhoneNumber(reserver.phone)}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
        </View>
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
                    </TableRow>))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    onClick={() => dispatch({ type: AdminActionType.SET_FOCUSED, id: row.getValue("id") })}
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
    </View>
}
