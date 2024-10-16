import View from "@/components/View";
import Text from "@/components/Text";
import { GetCollegesQuery, GetOrgsQuery, getAvatarLetters, useGetCollegesQuery, useGetOrgQuery, useGetOrgsQuery, useSearchOrgsQuery, useUpdateOrgMutation } from "@/shared";
import client from "@/client";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GOOGLE_MAPS_LIBRARIES } from "@/components/ScreenMap";
import { googleMapsApiKey } from "@/const";
import { GoogleMap, LoadScript, MarkerClusterer, MarkerClustererF, MarkerF } from "@react-google-maps/api";
import { useContext, useEffect, useReducer, useState } from "react";
import { Input } from "@/components/ui/input";
import { Building2Icon, ChevronDownIcon, ChevronUpIcon, Loader2, PlusCircleIcon, User2, XIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { v4 } from "uuid";
import { ContextOp, ContextOpDispatch, OpActionType, OpState, reducer } from "./state";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import Skeleton from "react-loading-skeleton";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { queryClient } from "../ReactQueryProvider";



export function OP() {
    const [map, setMap] = useState<google.maps.Map>();
    const [center, setCenter] = useState({ lat: 40.47943394367743, lng: -97.08491759844307 });
    const [isMin, setIsMin] = useState(false);


    const { data } = useGetCollegesQuery(client);

    const initial: OpState = {
        updateOrgId: null,
    }
    const [state, dispatch] = useReducer(reducer, initial);

    return <ContextOp.Provider value={state}>
        <ContextOpDispatch.Provider value={dispatch}><LoadScript mapIds={["e054b907b2c2d1b6"]} googleMapsApiKey={googleMapsApiKey} libraries={GOOGLE_MAPS_LIBRARIES}>
            <GoogleMap
                onLoad={(e) => setMap(e)}
                mapContainerClassName="h-screen"
                mapContainerStyle={{ height: "-webkit-fill-available" }}
                center={center}
                zoom={5}
                options={{
                    disableDefaultUI: true,
                    mapId: "e054b907b2c2d1b6",
                }}
            >
                {data?.colleges.all.map(college => <MarkerClusterer
                    key={college.id}
                    options={{
                        imagePath: college.logoUrl,

                    }}
                >
                    {cluster => <>
                        {college.orgs.map(org => org.locations.map(l => <MarkerF
                            position={{ lat: l.locationLat, lng: l.locationLng }}
                            clusterer={cluster}
                        />))}
                    </>}
                </MarkerClusterer>)}
            </GoogleMap>
            <View className="pl-4">
                <View className="fixed top-4">
                    <View className="w-[30vw]"><Search /></View>
                </View>
                <View className="fixed bottom-0 flex flex-row space-x-4">
                    <View className="min-w-[500px]">
                        {state.updateOrgId ? <Card className="rounded-b-none">
                            <CardHeader>
                                <CardTitle>Organization</CardTitle>
                                <CardDescription>Organization information.</CardDescription>
                                <Button variant="outline" onClick={() => dispatch({ type: OpActionType.UPDATE_ORG_ID, id: null })} className="absolute right-4 top-4">{<XIcon className="w-4" />}</Button>
                            </CardHeader>
                            <CardContent>
                                <OrgForm id={state.updateOrgId} />
                            </CardContent>
                        </Card>
                        : <Card className="rounded-b-none">
                            <CardHeader>
                                <CardTitle>No Active Events</CardTitle>
                                <CardDescription>There are no events scheduled this week.</CardDescription>
                                <Button variant="outline" onClick={() => setIsMin(!isMin)} className="absolute right-4 top-4">{isMin ? <ChevronUpIcon className="w-4" /> : <ChevronDownIcon className="w-4" />}</Button>
                            </CardHeader>
                            <CardContent className={`transition-[height] ${isMin ? "h-0 py-0" : "h-[400px]"}`}>
                                <EventCalendar />
                            </CardContent>
                        </Card>}
                    </View>
                </View>

            </View>
        </LoadScript>
        </ContextOpDispatch.Provider>
    </ContextOp.Provider>
}

export interface OrgForm {
    id: string;
    label: string;
    bio: string;
    college?: string;
}

interface OrgFormProps {
    id: string;
}
function OrgForm({ id }: OrgFormProps) {
    const form = useForm<OrgForm>({ defaultValues: { id: id } });

    const { toast } = useToast();

    const dispatch = useContext(ContextOpDispatch)!;

    const { data: colleges, isLoading: isLoadingColleges } = useGetCollegesQuery(client);
    const { data: org } = useGetOrgQuery(client, { id: id }, {
        onSuccess(data) {
            form.setValue("label", data.orgs.get.label);
            if (data.orgs.get.bio) form.setValue("bio", data.orgs.get.bio);
            if (data.orgs.get.college) form.setValue("college", data.orgs.get.college.id);
        },
    });
    const { mutate, isLoading: isUpdating } = useUpdateOrgMutation(client, {
        onSuccess(data, variables, context) {
            toast({ description: "Organization updated" });
            queryClient.invalidateQueries(["GetOrg", id]);
            queryClient.invalidateQueries(["GetOrgs"]);
        },
    });

    const onSubmit = (form: OrgForm) => {
        mutate({
            idOrg: id,
            form: {
                label: form.label,
                bio: form.bio,
                college: form.college,
            }
        });
    }

    return <View>
        {org && <View className="pb-4">
            <Link href={"admin/" + id}>
                <Button variant="outline">Admin Page</Button>
            </Link>
        </View>}
        <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl><Input disabled {...field} /></FormControl>
                            <FormDescription>Organization identifier</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Symbol</FormLabel>
                            <FormControl><Input placeholder="Organization symbol..." {...field} /></FormControl>
                            <FormDescription>The symbol of the organization</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl><Input placeholder="Organization name..." {...field} /></FormControl>
                            <FormDescription>The name of the organization</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="college"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Property</FormLabel>
                            {isLoadingColleges ? <Skeleton height={40} /> : <Select onValueChange={(value) => form.setValue("college", value)} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a college" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>College</SelectLabel>
                                  {colleges?.colleges.all.map(c => (
                                      <SelectItem value={c.id}>{c.name}</SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>}
                            <FormDescription>The college of the organization</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    {isUpdating ? <Button type="submit" disabled><Loader2 className="pr-1 w-2 h-2"/> Saving...</Button> : <Button type="submit">Save changes</Button>}
                </DialogFooter>
            </form>
        </Form>
    </View>
}

function getDates(orgs: GetOrgsQuery["orgs"]["all"]): Date[] {
    const dates: Date[] = [];
    for (const org of orgs) {
        for (const event of org.events) {
            dates.push(new Date(event.timeStart * 1000));
        }
    }
    return dates;
}

interface EventByCollegeData {
    ts: number;
    college: string;
    events: number;
}

function getEventsByCollege(orgs: GetOrgsQuery): EventByCollegeData[] {
    const data: EventByCollegeData[] = [];

    const today = new Date();

    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    let ts = today.getTime();

    for (let i = 0; i < 7; i++) {
        const collegeGroup = getEventsByCollegeForTS(orgs, ts);
        for (const group of collegeGroup) {
            data.push({
                ts,
                college: group.college,
                events: group.events,
            })
        }

        ts -= 1000 * 60 * 60 * 24;
    }
    return data;
}

function getEventsByCollegeForTS(orgs: GetOrgsQuery, ts: number): { college: string, events: number }[] {
    return [];

}

function EventsByCollege() {
    const { data: orgs } = useGetOrgsQuery(client);
    const { data: colleges } = useGetCollegesQuery(client);

    const data = orgs && getEventsByCollege(orgs);


    const data2 = [
      {
        name: 'Page A',
        uv: 4000,
        pv: 2400,
        amt: 2400,
      },
      {
        name: 'Page B',
        uv: 3000,
        pv: 1398,
        amt: 2210,
      },
    ];

    return <View className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
              width={500}
              height={300}
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ts" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
            </LineChart>
        </ResponsiveContainer>
    </View>
}




function EventCalendar() {
    const { data } = useGetOrgsQuery(client);

    const dates = data && getDates(data.orgs.all);
    return <Calendar selected={dates} />

    return <View className="grid grid-cols-7">
        <View className="text-center">M</View>
        <View className="text-center">T</View>
        <View className="text-center">W</View>
        <View className="text-center">T</View>
        <View className="text-center">F</View>
        <View className="text-center">S</View>
        <View className="text-center">S</View>
        <View className="text-center bg-green-400">29</View>
        <View className="text-center bg-green-400">30</View>
        <View className="text-center bg-yellow-400">31</View>
        <View className="text-center bg-orange-400">1</View>
        <View className="text-center bg-red-400">2</View>
        <View className="text-center bg-red-400">3</View>
        <View className="text-center bg-green-400">4</View>
    </View>
}

function Search() {
    const [open, setOpen] = useState(false)
    const [editCollegeId, setEditCollegeId] = useState<string>();

    const dispatch = useContext(ContextOpDispatch)!;

    const { data } = useGetOrgsQuery(client);
 
      useEffect(() => {
        const down = (e: KeyboardEvent) => {
          if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            setOpen((open) => !open)
          }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
      }, [])

    const onClick = (idOrg: string) => {
        dispatch({ type: OpActionType.UPDATE_ORG_ID, id: idOrg })
        setOpen(false);
    }

    const onNewCollege = () => {
        setOpen(false);
        setEditCollegeId(v4());
    }

    const onNewOrg = () => {
        setOpen(false);
        dispatch({ type: OpActionType.UPDATE_ORG_ID, id: v4() });
    }

    return <>
        <Button
            variant="outline"
            className={cn(
              "relative h-8 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
            )}
            onClick={() => setOpen(true)}
          >
            <span className="hidden lg:inline-flex">Search organizations...</span>
            <span className="inline-flex lg:hidden">Search...</span>
            <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <Dialog open={!!editCollegeId} onOpenChange={() => setEditCollegeId(undefined)}>
            <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update College</DialogTitle>
                  <DialogDescription>
                    Update a college.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="id" className="text-right">
                      Id
                    </Label>
                    <Input
                      id="id"
                      disabled
                      value={editCollegeId}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      defaultValue=""
                      placeholder="College Name"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="logo" className="text-right">
                      Logo
                    </Label>
                    <Input
                      id="logo"
                      defaultValue=""
                      placeholder="URL of the logo"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>

        <CommandDialog open={open} onOpenChange={setOpen} filter={(value, search) => {
            if (value.toLowerCase().includes(search.toLowerCase())) return 1
            return 0
          }}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Organizations">
                {data?.orgs.all.map(result => <CommandItem onSelect={() => onClick(result.id)}>
                    <Building2Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                    <span>{result.bio}</span>
                    <span className="text-gray-400">{result.college?.name || ""}</span>
                    </div>
                </CommandItem>)}
                </CommandGroup>
                <CommandGroup heading="Admin Actions">
                    <CommandItem onSelect={onNewCollege}>
                        <PlusCircleIcon className="mr-2 h-4 w-4" />
                        <span>New College</span>
                    </CommandItem>
                    <CommandItem onSelect={onNewOrg}>
                        <PlusCircleIcon className="mr-2 h-4 w-4" />
                        <span>New Organization</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    </>

    // <View className="mt-4 bg-zinc-950 rounded-xl">
    //     <Input className="rounded-xl" placeholder="Search" value={value} onChange={(e) => setValue(e.target.value)} onBlur={onBlur} />
    //     <View className="flex flex-col">
    //         {data?.orgs.search.map(result => <View onClick={() => onClick(result.id)} className="flex flex-row items-center hover:bg-zinc-900">
    //             <View>
    //                 <View>{result.bio}</View>
    //                 <View className="text-gray-400">{result.college?.name || ""}</View>
    //             </View>
    //         </View>)}
    //     </View>
    // </View>
}
// <View className="max-w-lg mx-auto">
//         <Text className="text-3xl mt-4 mb-2 block">Active Organizations</Text>
//         <ul className="flex flex-col space-y-4">{data?.orgs.all.map(org => <Org org={org} />)}</ul>
//     </View>

interface OrgProps {
    org: GetOrgsQuery["orgs"]["all"][0]
}
function Org({ org }: OrgProps) {
    return <Link href={"admin/" + org.id}>
        <Card>
            <CardHeader>
                <CardTitle>{org.label}</CardTitle>
                <CardDescription>{org.bio}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="list-disc pl-4">
                    <li>{org.memberships.length} member(s)</li>
                    <li>{org.events.length} events</li>
                    <li>{org.vehicles.length} vehicles</li>
                    <li>{org.locations.length} properties</li>
                </ul>
            </CardContent>
        </Card>
    </Link>
}


