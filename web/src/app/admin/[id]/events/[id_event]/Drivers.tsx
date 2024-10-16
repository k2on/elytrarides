import client from "@/client";
import View from "@/components/View";
import { Button } from "@/components/ui/button";
import { Exact, FormEventDriver, GetAdminEventQuery, UpdateEventDriverMutation, getAvatarLetters, useGetDriversQuery, useGetEventQuery, useGetOrgQuery, useUpdateEventDriverMutation, useUpdateEventDriversMutation } from "@/shared";
import { Home, MapPinOff, MoreHorizontal, PlusCircle, Star, Trash, User2, UserCog2 } from "lucide-react";
import { useContext, useState } from "react";
import { ContextAdmin, ContextAdminDispatch } from "./context";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { UseFormReturn, useForm } from "react-hook-form";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/router";
import { queryClient } from "@/app/ReactQueryProvider";
import Skeleton from "react-loading-skeleton";
import { formatVehicleName, now } from "@/lib";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDriverColor, isEventActive, isEventEnded } from "./util";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UseMutateFunction } from "@tanstack/react-query";
import Link from "next/link";
import { AdminActionType } from "./actions";
import { formatTime } from "./map/ActiveStop";
import { DriversTable } from "./drivers/data-table";
import { useParams } from "next/navigation";


interface DriverForm {
    phone: string;
}

type MutateFn = UseMutateFunction<UpdateEventDriverMutation, unknown, Exact<{
    idEvent: any,
    phone: any,
    form: FormEventDriver
}>, unknown>;

export default function ManageDrivers() {
    const { event, strategy } = useContext(ContextAdmin)!;
    const form = useForm<DriverForm>();
    const [showForm, setShowForm] = useState(false);
    const [removeDriverId, setRemoveDriverId] = useState<number>();
    const { toast } = useToast();
    const isActiveEvent = event && isEventActive(event);
    const isEnded = event && isEventEnded(event);
    const { id_event } = useParams();

    const error = (description: string) => toast({ variant: "destructive", title: "Something went wrong", description });


    const { mutate } = useUpdateEventDriverMutation(client);
    const { mutate: updateDrivers } = useUpdateEventDriversMutation(client, {
        onSuccess(data, variables, context) {
            setShowForm(false);
            queryClient.invalidateQueries();
            toast({ description: "Drivers updated" });
        },
    });

    const onRemoveDriver = (id: number) => {
        if (!event) return error("Please wait for the drivers to load");

        const driver = event.drivers.find(driver => driver.id == id);
        if (!driver) return error("Driver not found");

        mutate({
            idEvent: event.id,
            phone: driver.phone,
            form: {
                // idVehicle: driver.vehicle.id,
                obsoleteAt: now(),
            }
        }, {
            onSuccess(data, variables, context) {
                setRemoveDriverId(undefined);
                queryClient.invalidateQueries(["GetAdminEvent", { id: event.id }]);
                // queryClient.invalidateQueries(["GetDrivers", { id: event.id }]);
                toast({ description: "Driver removed "});
            },
        });
    }


    const onSave = (phones: string[]) => {
        updateDrivers({
            phones,
            idEvent: id_event,
        });
    }

    return <View>
        {event?.drivers.length == 0
        ? <NoDrivers />
        : <Drivers setRemoveDriverId={setRemoveDriverId} />}
        {!isEnded && <View className="text-center">
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                    <Button className="mx-auto mt-4 rounded-full"><UserCog2 className="w-4 h-4 mr-2" />Edit Drivers</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Drivers</DialogTitle>
                        <DialogDescription>Edit the drivers for this event.</DialogDescription>
                    </DialogHeader>
                    <DriversTable onSave={onSave} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={removeDriverId != undefined}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove the driver from the event?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setRemoveDriverId(undefined)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRemoveDriver(removeDriverId!)}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </View>}
    </View>
}

interface DriveProps {
    mutate: MutateFn;
    form: UseFormReturn<DriverForm>;
    showForm: boolean;
    setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
}
function DriverForm({ mutate, form, showForm, setShowForm }: DriveProps) {
    // const { query } = useRouter();
    // const { id, id_event } = query;
    const { toast } = useToast();
    const { event, strategy } = useContext(ContextAdmin)!;
    const id = event!.idOrg;
    const id_event = event!.id;


    const { isLoading: isLoadingOrg, data: org } = useGetOrgQuery(client, { id });
    const { isLoading: isLoadingDrivers, data: drivers } = useGetDriversQuery(client, { id: id_event });
    const isLoading = isLoadingOrg || isLoadingDrivers;

    // const driverVehicleIds = drivers && drivers.events.get.drivers.map(driver => driver.idVehicle);
    const driverPhones = drivers && drivers.events.get.drivers.map(driver => driver.phone);

    // const remainingVehicles = org && drivers && org.orgs.get.vehicles.filter(vehicle => !driverVehicleIds!.includes(vehicle.id));
    const remainingDrivers = org && drivers && org.orgs.get.memberships.filter(membership => !driverPhones!.includes(membership.user.phone));


    const onNewDriver = (data: DriverForm) => {
        mutate({
            idEvent: id_event,
            phone: data.phone,
            form: {}
        }, {
            onSuccess(data, variables, context) {
                queryClient.invalidateQueries(["GetDrivers", { id: id_event }]);
                queryClient.invalidateQueries(["GetAdminEvent", { id: id_event }]);
                toast({ description: "Driver updated "});
                form.reset();
                setShowForm(false);
            },
        });
    }


    const { phone } = form.watch();
    const disabled = !phone;
    const noMoreDrivers = !remainingDrivers || remainingDrivers.length == 0;
    // const noMoreVehicles = !remainingVehicles || remainingVehicles.length == 0;

    return <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onNewDriver)}>
            <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Driver</FormLabel>
                        {isLoading ? <Skeleton height={40} /> : <Select key={form.watch("phone")} onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger disabled={noMoreDrivers}>
                            <SelectValue placeholder="Select a driver" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {remainingDrivers?.map(driver => (
                                  <SelectItem value={driver.user.phone}>{driver.user.name}</SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>}
                        <FormDescription>{noMoreDrivers ? <span className="text-red-400">No more members left to add. You can add more <Link target="_blank" className="underline" href="../members">here</Link></span> : "Select the member for the event."}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <DialogFooter>
                <Button disabled={disabled} type="submit">Save changes</Button>
            </DialogFooter>
        </form>
    </Form>
}

interface DriversProps {
    setRemoveDriverId: React.Dispatch<React.SetStateAction<number | undefined>>;
}
function Drivers({ setRemoveDriverId }: DriversProps) {
    const { event, strategy } = useContext(ContextAdmin)!;

    return <View>
        <ul>
            {event?.drivers.map((driver, idx) => <Driver setRemoveDriverId={setRemoveDriverId} key={driver.id} idx={idx} driver={driver} />)}
        </ul>

    </View>
}

interface DriverProps {
    idx: number;
    driver: GetAdminEventQuery["events"]["get"]["drivers"][0]
    setRemoveDriverId: React.Dispatch<React.SetStateAction<number | undefined>>;
}
function Driver({ driver, idx, setRemoveDriverId }: DriverProps) {
    const { strategy, event } = useContext(ContextAdmin)!;
    const dispatch = useContext(ContextAdminDispatch)!;
    const user = driver.user;
    const color = getDriverColor(idx);
    const isOnline = strategy?.drivers.some(d => d.driver.id == driver.id);
    const driver_strategy = strategy?.drivers.find(d => driver.id == d.driver.id);

    const activeEvent = event && isEventActive(event);

    const reservations = event?.reservations.filter(res => res.idDriver == driver.id);
    const complete = reservations?.filter(res => res.isComplete);
    const cancelled = reservations?.filter(res => res.isCancelled);

    const waits = complete?.map(res => res.completeAt! - res.madeAt);
    const wait = waits && waits.length > 0 && formatTime(Math.round(waits.reduce((a, b) => a + b, 0) / waits.length));

    const ratings = reservations?.filter(res => res.rating).map(res => res.rating!);
    const ratingRaw = ratings && ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const rating = ratingRaw && (Math.floor(ratingRaw * 100) / 100);

    return <li className="grid grid-cols-3">
        <View>
            <View className="relative overflow-hidden h-20">
                {driver.vehicle && <img style={{ transform: "rotateY(180deg) translateY(-20px)" }} className="h-32" src={driver.vehicle.imageUrl} />}
                <Avatar className="border-2 absolute bottom-3 ml-4 w-12 h-12" style={{ borderColor: color }}>
                    <AvatarImage src={user.imageUrl || ""} alt={user.name} />
                    <AvatarFallback>{getAvatarLetters(user.name || "")}</AvatarFallback>
                </Avatar>
            </View>
            <View className="flex flex-col pl-4">
                <View className="flex flex-row items-center space-x-2">
                    <span>{user.name}</span>
                    {activeEvent && <Status isOnline={isOnline} />}
                    {activeEvent && <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Button className="w-4 h-8 px-0" variant="ghost"><MoreHorizontal className="w-4 text-gray-400" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Edit Driver</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setRemoveDriverId(driver.id)}><Trash className="w-4 h-4 mr-2" /> Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>}
                </View>
                {driver.vehicle ? <span className="text-gray-400 text-sm">{formatVehicleName(driver.vehicle)}</span> : <span className="text-red-400 text-sm">No Vehicle Selected</span>}
            </View>
        </View>
        {activeEvent ? (
            <>
                <View className="flex items-center justify-center">
                    <View className="w-2/3">
                        <Skeleton duration={2} enableAnimation={!!driver_strategy?.dest} highlightColor="#0f0" className="w-full h-1" width="100%" />
                    </View>
                </View>
                <View className="p-4">
                    <View className={`bg-zinc-900 h-full rounded border flex items-center justify-center flex-col space-y-2 ${driver_strategy?.dest?.__typename == "DriverStopEstimationReservation" ? "cursor-pointer hover:bg-zinc-800 animate-pulse-border" : ""}`} onClick={() => driver_strategy?.dest?.__typename == "DriverStopEstimationReservation" ? dispatch({ type: AdminActionType.SET_FOCUSED, id: driver_strategy.dest.idReservation }) : undefined}>
                        {driver_strategy == undefined || !driver_strategy.dest
                        ? <>
                            <MapPinOff className="text-gray-400 w-4 h-4" />
                            <span className="text-gray-400 text-sm">No Destination</span>
                        </> : driver_strategy.dest.__typename == "DriverStopEstimationReservation"
                        ? <>
                            <User2 className="text-gray-400 w-4 h-4" />
                            <span className="text-sm">{driver_strategy.dest.reservation.reserver.name}</span>
                            <span className="text-sm text-gray-400">{driver_strategy.dest.location.address.main}</span>
                        </>
                        : <>
                            <Home className="text-gray-400 w-4 h-4" />
                            <span>Event</span>
                        </>}
                    </View>
                </View>
            </>
        ) : (
            <>
                <View className="col-span-2 pr-8 flex items-center">
                    <View className="w-full">
                        <View className="flex flex-row w-full">
                            <View className="w-full">
                                <View className="text-gray-400 text-xs">Complete</View>
                                <View className="text-xl">{complete?.length}</View>
                            </View>
                            <View className="w-full text-center">
                                <View className="text-gray-400 text-xs">Avg Wait</View>
                                <View className="text-xl">{wait || "--:--"}</View>
                            </View>
                            <View className="w-full text-right">
                                <View className="text-gray-400 text-xs">Cancelled</View>
                                <View className="text-xl">{cancelled?.length}</View>
                            </View>
                        </View>
                        <View className="relative bg-zinc-900 w-full h-1 rounded-full overflow-hidden mt-2">
                            {complete && cancelled && reservations && <>
                                <View style={{ width: (complete.length / reservations.length) * 100 + "%" }} className="absolute bg-green-400 h-full"></View>
                                <View style={{ width: (cancelled.length / reservations.length) * 100 + "%" }} className="absolute bg-red-400 right-0 h-full"></View>
                            </>}
                        </View>
                    </View>
                </View>
            </>
        )}
    </li>
}

interface StatusProps {
    isOnline: boolean | undefined;
}
function Status({ isOnline }: StatusProps) {
    const isLoading = isOnline == undefined;
    return <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
        <span className="relative inline-flex h-3 w-3">
          {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-3 w-3 ${isLoading ? 'bg-gray-400' : isOnline ? 'bg-lime-500' : 'bg-red-500'}`}></span>
        </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isLoading ? "Loading..." : isOnline ? "Online" : "Offline"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
}

function NoDrivers() {
    return <View className="text-center my-32">
        <span className="text-gray-400">No drivers for this event</span>
    </View>

}

interface DriverRatingProps {
    rating: number;
}
function DriverRating({ rating }: DriverRatingProps) {
    return <span className="text-xs flex flex-row bg-zinc-900 rounded-full px-2 py-1 items-center absolute bottom-0 ml-[10px]">{rating} <Star className="w-3 h-3 fill-white ml-1" /></span>
}
