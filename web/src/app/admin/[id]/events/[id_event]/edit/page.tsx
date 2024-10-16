"use client";

import View from "@/components/View";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FC, useContext, useEffect, useState } from "react";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns";
import Text from "@/components/Text";
import { Event, useGetEventQuery, useUpdateEventMutation, useGetMeQuery, useGetOrgQuery, FormEvent, FormLocation, OrgLocation, useUpdateLocationMutation } from "@/shared";
import EventInvite from "@/components/EventInvite";
import { DeviceFrameset } from 'react-device-frameset'
import 'react-device-frameset/styles/marvel-devices.min.css'
import client from "@/client";
import Icon from "@mdi/react";
import { mdiLoading } from "@mdi/js";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { DevTool } from "@hookform/devtools";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Skeleton from "react-loading-skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { now } from "@/lib";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { constrainedMemory } from "process";
import { queryClient } from "@/app/ReactQueryProvider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LocationFormView, { LocationForm } from "../../../locations/form";
import { v4 } from "uuid";
import { ContextDebug } from "@/app/admin/debug/state";
import { Timer } from "../map/ActiveStop";
import { Clock } from "../components/Clock";


interface FormValues {
    name: string;
    bio: string;
    date: Date;
    timeStart: string;
    timeEnd: string;
    publicStart: string;
    location: string;
    published: boolean;
} 

interface PageProps {
    params: { id: string, id_event: string }
}

function formatTime(d: Date): string {
    const hours = formatHours(d);
    const min = formatMin(d);
    const mer = d.getHours() > 12 ? "pm" : "am";
    return hours + min + mer;
}

function formatMin(d: Date): string {
    const min = d.getMinutes();
    if (min == 0) return "";
    return `:${min < 10 ? "0" + min : min}`;
}

function formatHours(d: Date): number {
    const hours = d.getHours();
    if (hours == 0) return 12;
    if (hours > 12) return hours - 12;
    return hours;
}

function addTimeToDate(d: Date, timeStr: string, start?: Date): Date {
    let date = new Date(d.getTime());

    // Extract hour, possibly minutes, and AM/PM from the string
    const match = timeStr.match(/(\d+)(?::(\d+))?([ap]m)/i);
    if (!match) {
        throw new Error('Invalid time format');
    }

    let hour = +match[1];
    const minutes = +match[2] || 0;
    const isPM = match[3].toLowerCase() === 'pm';

    if (hour === 12) { hour = 0; }

    if (isPM) { hour += 12; }

    date.setHours(hour, minutes, 0, 0);

    if (start && date.getTime() < start.getTime()) {
        date = new Date(date.getTime() + 1000 * 60 * 60 * 24);
        date.setHours(hour, minutes, 0, 0);
    }


    return date;
}

const TAB_KEY = "tab";
const INITIAL_TAB = "general";

export default function Page({ params: { id, id_event } }: PageProps) {
    const form = useForm<FormValues>();

    const { debugTZ } = useContext(ContextDebug)!;

    const { mutate, isLoading: isUpdating } = useUpdateEventMutation(client, {onSuccess(data, variables, context) {
        queryClient.invalidateQueries(["GetEvent", { id: id_event }])
    }});

    const [event, setEvent] = useState<Event>({
        id: "",
        idOrg: "",
        org: null,
        name: "",
        bio: "",
        timeStart: 0,
        timeEnd: 0,
        reservationsStart: 0,
        reservationsEnd: 0
    } as any);

    const router = useRouter();
    const pathname = usePathname();

    const initialTab = new URL(window.location.href).searchParams.get(TAB_KEY) || INITIAL_TAB;
    const [tab, setTab] = useState(initialTab);
    const [isDelayedStart, setIsDelayedStart] = useState(false);

    const [editLocation, setEditLocation] = useState<Partial<OrgLocation>>();
    const formLocation = useForm<LocationForm>();

    const isNoEventLocationEnabled = false;

    const { data } = useGetOrgQuery(client, { id }, {
        onSuccess(data) {
            const org = data.orgs.get;
            setEvent(e => ({...e, org}) as any);
            const location = org.locations.at(0);
            if (!location) return;
            if (form.getValues("location")) return;

            form.setValue("location", location.id);
        },
    });

    const getForm = (): FormEvent => {
        let startDate: Date | undefined = undefined;
        let endDate: Date | undefined = undefined;
        let publicStartDate: Date | undefined = undefined;

        startDate = addTimeToDate(date, startTime);
        publicStartDate = isDelayedStart ? addTimeToDate(date, publicStart) : startDate;
        endDate = addTimeToDate(date, endTime, startDate);

        const timeStart = Math.floor(startDate.getTime() / 1000);
        const publicStartTime = Math.floor(publicStartDate.getTime() / 1000);
        const timeEnd = Math.floor(endDate.getTime() / 1000);
        return {
            name,
            bio,
            timeStart,
            timeEnd,
            idLocation: location,
            reservationsStart: publicStartTime,
            reservationsEnd: timeEnd,
            publishedAt: published ? now() : null,
        };
    }

    const onSubmit = () => {
        mutate({
            idOrg: id,
            idEvent: id_event,
            form: getForm(),
        });
    };

    const onDelete = () => {
        const form = getForm();
        form.obsoleteAt = now();

        mutate({
            idOrg: id,
            idEvent: id_event,
            form,
        }, {
            onSuccess(data, variables, context) {
                window.location.href = `/admin/${id}/events`;
            },
        });
    };

    const { isLoading, data: eventData } = useGetEventQuery(client, { id: id_event }, {
        onSuccess(data) {
            const event = data.events.get;
            form.setValue("name", event.name);
            
            let date = new Date(event.timeStart * 1000);
            form.setValue("date", date);

            form.setValue("timeStart", formatTime(date));
            form.setValue("timeEnd", formatTime(new Date(event.timeEnd * 1000)));

            form.setValue("published", !!event.publishedAt);

            form.setValue("publicStart", formatTime(new Date(event.reservationsStart * 1000)));
            setIsDelayedStart(event.timeStart != event.reservationsStart);

            if (event.bio) form.setValue("bio", event.bio);
            if (event.location) form.setValue("location", event.location.id);
        },
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry(failureCount, error) {
            if ((error as any).response?.errors[0].message == "Record not found") return false;
            return failureCount < 3;
        },
    });

    const isNewEvent = !isLoading && !eventData;

    const name = form.watch("name");
    const bio = form.watch("bio");
    const date = form.watch("date");
    const startTime = form.watch("timeStart");
    const endTime = form.watch("timeEnd");
    const location = form.watch("location");
    const published = form.watch("published");
    const publicStart = form.watch("publicStart");

    useEffect(() => {
        let start: Date | undefined = undefined;
        let end: Date | undefined = undefined;
        let publicStartTime: Date | undefined = undefined;

        if (date) {
            try {
                start = addTimeToDate(date, startTime);
                publicStartTime = isDelayedStart ? addTimeToDate(date, publicStart) : start;
                end = addTimeToDate(date, endTime, start);
            } catch (_) {}
        }

        setEvent(e => {
            const event = {...e};
            event.name = form.getValues("name");
            event.bio = form.getValues("bio");
            if (start) event.timeStart = Math.floor(start.getTime() / 1000);
            if (publicStartTime) event.reservationsStart = Math.floor(publicStartTime.getTime() / 1000)
            if (end) event.timeEnd = Math.floor(end.getTime() / 1000);
            return event;
        })
    }, [name, bio, date, startTime, endTime, location, published, publicStart]);

    const formatTimeInput = (name: "timeStart" | "timeEnd" | "publicStart") => {
        let value = form.getValues(name).toLowerCase();

        const suffix1 = value.substring(value.length - 1);
        const suffix2 = value.substring(value.length - 2);
        const noSuffix = suffix2 != "pm" && suffix2 != "am";

        if (suffix1 == "p" || suffix1 == "a") { value += "m"; }
        else if (noSuffix && (name == "timeStart" || name == "publicStart")) { value += "am" }
        else if (noSuffix && name == "timeEnd") {
            const valueStart = form.getValues("timeStart").toLowerCase();

            const matchEnd = value.match(/(\d+)(?::(\d+))?([ap]m)?/i);
            const matchStart = valueStart.match(/(\d+)(?::(\d+))?([ap]m)?/i);
            if (!matchEnd || !matchStart) {
                throw new Error('Invalid time format');
            }

            let hourStart = +matchStart[1];
            let hourEnd = +matchEnd[1];

            const suffix = hourStart > hourEnd || hourEnd == 12 ? "am" : "pm";
            value += suffix;
        }

        form.setValue(name, value);
    }

    const onTabChange = (tab: string) => {
        if (!isNewEvent) onSubmit();
        router.push(pathname + "?tab=" + tab);
        setTab(tab);
    }

    const { mutate: update, isLoading: isUpdatingLocation } = useUpdateLocationMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetEvent", { id: id_event }]);

            queryClient.invalidateQueries(["GetOrg", { id }]).then(() => {
                const locationId = variables.idLocation;

                form.setValue("location", locationId);;

                setEditLocation(undefined);
                formLocation.reset();
            })
        },
    });

    const onSubmitLocation = (form: FormLocation) => {
        if (!editLocation) return console.error("Can not update without selecting a location first.");
        update({
            idOrg: id,
            idLocation: editLocation.id,
            form: {...form, imageUrl: ""}
        });
    }

    const tryGetForm = () => {
        try {
            return getForm();
        } catch(e: any) {
            return e.toString() as string;
        }
    }

    return <View className="flex">
        <View className={`px-6 max-w-lg flex flex-col py-4 ${isLoading || isUpdating ? "pointer-events-none opacity-50" : ""}`}>
            <Form {...form}>
                <form className="h-full" onSubmit={form.handleSubmit(onSubmit)}>
                    <Tabs value={tab} onValueChange={(tab) => onTabChange(tab)} className="w-[400px] h-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="time" disabled={!name || !bio}>Time</TabsTrigger>
                            <TabsTrigger value="location" disabled={!name || !bio || !startTime || !endTime}>Location</TabsTrigger>
                            <TabsTrigger value="visibility" disabled={!name || !bio || !startTime || !endTime || !location}>Visibility</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general" className="flex flex-col justify-between data-[state=active]:h-full">
                            <View className="space-y-6 h-full">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>{isLoading ? <Skeleton height={40} /> : <Input autoFocus placeholder="Event name..." {...field} />}</FormControl>
                                            <FormDescription>The name of the event</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>{isLoading ? <Skeleton height={40} /> : <Input placeholder="Event description..." {...field} />}</FormControl>
                                            <FormDescription>A breif description to describe the event</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </View>
                            <View>
                                <Button onClick={() => onTabChange("time")} className="block ml-auto" disabled={!name || !bio}>{isLoading ? "Loading" : isNewEvent ? "Next" : "Save and continue"}</Button>
                            </View>
                        </TabsContent>
                        <TabsContent value="time" className="flex flex-col justify-between data-[state=active]:h-full">
                            <View className="space-y-6 h-full">
                                <FormField
                                  control={form.control}
                                  name="date"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel>Date</FormLabel>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            {isLoading ? <Skeleton height={40} /> : <Button
                                              variant={"outline"}
                                              className={cn(
                                                "pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                              )}
                                            >
                                              {field.value ? (
                                                format(field.value, "PPP")
                                              ) : (
                                                <span>Pick a date</span>
                                              )}
                                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>}
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      <FormDescription>The date of the event</FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <View>
                                    <FormLabel>Time</FormLabel>
                                    <View className="flex gap-4 items-center">
                                        <FormField
                                            control={form.control}
                                            name="timeStart"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormControl>{isLoading ? <Skeleton height={40} /> : <Input placeholder="Start time..." {...field} onBlur={() => formatTimeInput("timeStart")} />}</FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Text>to</Text>

                                        <FormField
                                            control={form.control}
                                            name="timeEnd"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormControl>{isLoading ? <Skeleton height={40} /> : <Input placeholder="End time..." {...field} onBlur={() => formatTimeInput("timeEnd")} />}</FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </View>
                                    <FormDescription className="mt-2">The time of the event</FormDescription>
                                </View>
                                {debugTZ && <DebugTimes form={tryGetForm()} />}
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-x-1">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                      Public Delay
                                    </FormLabel>
                                    <FormDescription>
                                      Set a different start time for people outside the organization.
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    {isLoading ? <Skeleton width={44} height={24} borderRadius="100px" /> : <Switch
                                      checked={isDelayedStart}
                                      onCheckedChange={(value) => {
                                        setIsDelayedStart(value);
                                        if (!value) {
                                            form.setValue("publicStart", form.getValues("timeStart"));
                                        }
                                      }}
                                    />}
                                  </FormControl>
                                </FormItem>
                                {isDelayedStart && <View>
                                    <FormLabel>Public Start</FormLabel>
                                    <View className="flex gap-4 items-center">
                                        <FormField
                                            control={form.control}
                                            name="publicStart"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormControl>{isLoading ? <Skeleton height={40} /> : <Input placeholder="Public start..." {...field} onBlur={() => formatTimeInput("publicStart")} />}</FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Text>to</Text>

                                        <FormField
                                            control={form.control}
                                            name="timeEnd"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormControl>{isLoading ? <Skeleton height={40} /> : <Input disabled={true} placeholder="End time..." {...field} />}</FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </View>
                                    <FormDescription className="mt-2">The start time for people outside of the organization.</FormDescription>
                                </View>}
                            </View>
                            <View className="flex flex-row justify-between">
                                <Button onClick={() => onTabChange("general")} variant="secondary">Back</Button>
                                <Button onClick={() => onTabChange("location")} disabled={!startTime || !endTime}>{isLoading ? "Loading" : isNewEvent ? "Next" : "Save and continue"}</Button>
                            </View>
                        </TabsContent>
                        <TabsContent value="location" className="flex flex-col justify-between data-[state=active]:h-full">
                            <View className="space-y-6 h-full">
                                {isNoEventLocationEnabled && <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-x-1">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                      No Event Location
                                    </FormLabel>
                                    <FormDescription>
                                      If there is no event location, then riders can select any location.
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    {isLoading ? <Skeleton width={44} height={24} borderRadius="100px" /> : <Switch
                                      disabled={true}
                                      checked={false}
                                    />}
                                  </FormControl>
                                </FormItem>}
                                <FormField
                                    key={location}
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Property</FormLabel>
                                            {isLoading ? <Skeleton height={40} /> : <Select onValueChange={(value) => {
                                                const isNewLocation = value == "new";
                                                if (isNewLocation) {
                                                    const newId = v4()
                                                    setEditLocation({
                                                        id: newId
                                                    });
                                                } else {
                                                    field.onChange(value);
                                                }
                                            }} value={field.value}>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select a property" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectGroup>
                                                  <SelectLabel>Property</SelectLabel>
                                                  {data?.orgs.get.locations.map(loc => (
                                                      <SelectItem value={loc.id}>{loc.label}</SelectItem>
                                                  ))}
                                                  <SelectItem value="new" className="font-semibold">New Property</SelectItem>
                                                </SelectGroup>
                                              </SelectContent>
                                            </Select>}
                                            <FormDescription>The property of the event</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <LocationFormView editingId={editLocation?.id} setEditingId={setEditLocation} form={formLocation} onSubmit={onSubmitLocation} isUpdating={isUpdatingLocation} />
                            </View>
                            <View className="flex flex-row justify-between">
                                <Button onClick={() => onTabChange("time")} variant="secondary">Back</Button>
                                <Button onClick={() => onTabChange("visibility")} disabled={!location}>{isLoading ? "Loading" : isNewEvent ? "Next" : "Save and continue"}</Button>
                            </View>
                        </TabsContent>
                        <TabsContent value="visibility" className="flex flex-col justify-between data-[state=active]:h-full">
                            <View className="space-y-6 h-full">
                                <FormField
                                    control={form.control}
                                    name="published"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-x-1">
                                          <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                              Published Event
                                            </FormLabel>
                                            <FormDescription>
                                              This event will show up to other people outside of the organization.
                                            </FormDescription>
                                          </div>
                                          <FormControl>
                                            {isLoading ? <Skeleton width={44} height={24} borderRadius="100px" /> : <Switch
                                              checked={field.value}
                                              onCheckedChange={field.onChange}
                                            />}
                                          </FormControl>
                                        </FormItem>
                                    )}
                                />
                                {!isNewEvent && <FormItem className="flex flex-row items-center justify-between rounded-lg border border-red-800 p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                      Delete Event
                                    </FormLabel>
                                    <FormDescription>
                                      This will perminately remove the event from the organization.
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive">Delete</Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete and stop the organization event.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={onDelete}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </FormControl>
                                </FormItem>}
                            </View>
                            <View className="flex flex-row justify-between">
                                <Button onClick={() => onTabChange("location")} variant="secondary">Back</Button>
                                <Button type="submit">{isUpdating ? "Loading" : isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving</> : published ? "Publish Event" : "Save Draft"}</Button>
                            </View>
                        </TabsContent>
                    </Tabs>
                </form>
            </Form>
            {process.env.NODE_ENV === "development" && <DevTool control={form.control} />}
        </View>
        <View style={{ height: "80vh" }} className="border-l border-zinc-800 flex items-center w-full">
            <View className="mx-auto h-full">
                <View className="px-12 py-4">
                    Invite Preview
                </View>
                <View className="scale-75 -mt-24">
                    <DeviceFrameset device="iPhone X">
                        <View className="bg-black h-full pt-16">
                            {!event.org ? <Icon size={1} className="animate-spin mx-auto mt-80" path={mdiLoading} /> : <EventInvite event={{...event, ...{ id: id_event }}} />}
                        </View>
                    </DeviceFrameset>
                </View>
            </View>
        </View>
    </View>
}

interface DebugTimesProps {
    form: FormEvent | string;

}
function DebugTimes({ form }: DebugTimesProps) {
    if (typeof form == "string") return <span className="text-red-400">{form}</span>;
    const { timeStart, timeEnd } = form;
    if (timeStart == undefined) return <span className="text-red-400">No start time given</span>
    if (timeEnd == undefined) return <span className="text-red-400">No end time given</span>
    const start = new Date(timeStart * 1000);
    const end = new Date(timeEnd * 1000);

    return <table className="text-xs">
        <tr>
            <td>Time</td>
            <td className="text-blue-400"><Clock fmtFn={(d) => d.toString()} /></td>
        </tr>
        <tr>
            <td>Start: </td>
            <td className="text-green-400">{start.toString()}</td>
        </tr>
        <tr>
            <td>End: </td>
            <td className="text-red-400">{end.toString()}</td>
        </tr>
    </table>
}

