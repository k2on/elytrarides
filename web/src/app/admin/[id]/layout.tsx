"use client"

import View from "@/components/View";
import Text from "@/components/Text";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/toaster";
import { COLOR_GRAY_500, COLOR_PURPLE_500 } from "@/const";
import { Logo, getAvatarLetters, useGetMeAccountQuery, useGetMeMembershipsQuery, useGetMeQuery, useGetOrgQuery, useGetOrgsQuery } from "@/shared";
import { mdiCar, mdiHome, mdiCalendar, mdiAccountMultiple, mdiMapMarker, mdiCog } from "@mdi/js";
import Icon from "@mdi/react";
import { ArrowLeftRight, ArrowLeftSquare, ArrowLeftToLine, Bitcoin, Bug, Calendar, CalendarPlus, Car, Gauge, HelpCircle, Home, LucideIcon, MapPin, Settings, User2, Users2 } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from 'next/navigation'
import { createElement, useContext, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import client from "@/client";
import Skeleton from "react-loading-skeleton";
import Account from "@/app/[id]/ride/Account";
import { AccountAvatar } from "@/app/[id]/ride/reserve/AccountAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { auth_token_remove } from "@/store";
import { NotAnAdmin } from "../page";
import { Separator } from "@/components/ui/separator";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { v4 } from "uuid";
import { ActionTypeDebug, ContextDebug, ContextDebugDispatch } from "../debug/state";
import { Switch } from "@/components/ui/switch";

function LinkOrg({ href, children, icon, id }: { href: string, children: string, icon: LucideIcon, id: string }) {
    const pathFull = usePathname();
    const path = pathFull.split(id).at(1) || "/";
    const isSelected = href == "/" ? path == href : path.startsWith(href);

    return (
        <li>
            <Link className={`flex gap-2 items-center px-4 border-purple-400 ${isSelected ? "border-r-2" : "navbar-item"}`} href={`/admin/${id}${href}`}>
                {createElement(icon, { className: `navbar-icon ml-2 absolute w-4 h-4 ${isSelected ? "text-purple-400" : "text-gray-500"}`})}
                <span className={`${isSelected ? "text-white": "text-gray-400"} ml-8 navbar-text transition-opacity`}>{children}</span>
            </Link>
        </li>
    );
}


interface Props {
    children: React.ReactNode;
    params: { id: string };
}
export default function({ children, params }: Props) {
    const { data, isLoading: isLoadingMe } = useGetMeQuery(client);
    const { id } = params;
    const { data: org } = useGetOrgQuery(client, { id });

    const [isMin, setIsMin] = useState(true);

    const onSignout = () => {
        auth_token_remove();
        window.location.href = "";
    }

    const isSuperuser = data && data.users.me.memberships.some(m => m.org.id == "12cc7767-8831-4a06-9621-b5a71dd8d9f1") || false;
    const notAdmin = data && !data.users.me.memberships.some(m => m.org.id == id) || false;
    if (notAdmin && !isSuperuser) return <NotAnAdmin desc="You are not an admin for this organization" />;

    const openAccount = () => {
        window.location.href = "/account?r=" + window.location.href;
    }

    return <View className="flex overflow-x-hidden">
        <div onMouseEnter={() => setIsMin(false)} onMouseLeave={() => setIsMin(true)} className={`bg-zinc-950 h-screen border-r border-zinc-800 justify-between flex flex-col fixed transition-all navbar overflow-hidden ${isMin ? "w-16 is-min" : "w-52"}`}>
            <View className="flex flex-col">
                <View className="flex item py-4">
                    <View className="flex flex-col space-y-1 mx-auto w-full">
                        <View className="relative h-8">
                            <View className={`absolute left-1/2 -translate-x-1/2 flex gap-2 mx-auto transition-opacity ${isMin ? "opacity-0" : "opacity-1"}`}>
                                <Logo size={25} />
                                <span className="font-semibold text-lg">Elytra</span>
                            </View>
                            <View className={`absolute left-1/2 -translate-x-1/2 flex gap-2 mx-auto transition-opacity ${isMin ? "opacity-1" : "opacity-0"}`}>
                                <Logo size={25} />
                            </View>
                        </View>
                        <Text className="mx-auto font-serif">
                            {org?.orgs.get.label}
                        </Text>
                        {false && <Text className="mx-auto">
                            <Badge variant="outline">Trial</Badge>
                        </Text>}
                    </View>
                </View>

                <View className="pt-4 flex flex-col space-y-2">
                    <span className={`text-gray-400 text-xs font-semibold px-4 transition-opacity ${isMin ? "opacity-0" : "opacity-1"}`}>Home</span>
                    <ul className="pt-2 space-y-4">
                        <LinkOrg href="/" icon={Home} id={id}>Dashboard</LinkOrg>
                        <LinkOrg href="/events" icon={Calendar} id={id}>Events</LinkOrg>
                    </ul>
                </View>

                <Separator className="mx-4 mt-8"  style={{ width: "calc(100% - 32px)" }}/>
                <View className="pt-4 flex flex-col space-y-2">
                    <span className={`text-gray-400 text-xs font-semibold px-4 transition-opacity ${isMin ? "opacity-0" : "opacity-1"}`}>Organization</span>
                    <ul className="pt-2 space-y-4">
                        <LinkOrg href="/members" icon={Users2} id={id}>Members</LinkOrg>
                        <LinkOrg href="/vehicles" icon={Car} id={id}>Vehicles</LinkOrg>
                        <LinkOrg href="/locations" icon={MapPin} id={id}>Properties</LinkOrg>
                    </ul>
                </View>

                <Separator className="mx-4 mt-8"  style={{ width: "calc(100% - 32px)" }}/>
                <View className="pt-4 flex flex-col space-y-2">
                    <span className={`text-gray-400 text-xs font-semibold px-4 transition-opacity ${isMin ? "opacity-0" : "opacity-1"}`}>Support</span>
                    <ul className="pt-2 space-y-4">
                        <LinkOrg href="/billing" icon={Bitcoin} id={id}>Billing</LinkOrg>
                        <LinkOrg href="/help" icon={HelpCircle} id={id}>Help</LinkOrg>
                        <LinkOrg href="/settings" icon={Settings} id={id}>Settings</LinkOrg>
                    </ul>
                </View>
            </View>
            <View>
                <View className="m-2 pt-4 flex flex-row space-x-2 items-center border-t">
                    <Avatar onClick={openAccount} className="w-8 h-8 ml-[8px]">
                        <AvatarImage src={data?.users.me.imageUrl || ""} alt={data?.users.me.name} />
                        <AvatarFallback>{getAvatarLetters(data?.users.me.name || "")}</AvatarFallback>
                    </Avatar>
                    <View className={`text-xs whitespace-nowrap transition-opacity ${isMin ? "opacity-0" : "opacity-1"}`}>
                        <Text className="text-xs">{data ? <Button className="p-0 h-fit" onClick={openAccount} variant="link">{data?.users.me.name}</Button> : <Skeleton width={60} />}</Text>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className="p-0 h-fit text-xs block font-normal text-gray-400" variant="link">Sign out</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sign out?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to sign out?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={onSignout}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </View>
                </View>
            </View>
        </div>
        <View className={`w-full h-screen transition-all ${isMin ? "pl-[63px]" : "pl-[207px]"}`}>
            {children}
        </View>
        <CommandMenu />
    </View>

}

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [openOrgSwitcher, setOpenOrgSwicher] = useState(false)

  const { debugTZ } = useContext(ContextDebug)!;
  const dispatch = useContext(ContextDebugDispatch)!;

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

  const { data: me } = useGetMeMembershipsQuery(client);

  const isOp = me && me.users.me.memberships.some(membership => membership.org.id == "12cc7767-8831-4a06-9621-b5a71dd8d9f1") || false;
  const isDebugEnabled = isOp;

  const { data: orgs } = useGetOrgsQuery(client, undefined, { enabled: isOp });

  const { id } = useParams();
  const router = useRouter();

  const onRedirect = (name: string) => {
    setOpen(false);
    router.push(`/admin/${id}/${name}`);
  }

  const onSwichOrg = (id: string) => {
    setOpen(false);
    router.push(`/admin/${id}/events`);
  }

  const onSwitchOrgs = () => {
      setOpen(false);
      setOpenOrgSwicher(true);
  }

  const onNewEvent = () => {
    setOpen(false);
    router.push(`/admin/${id}/events/${v4()}/edit`);
  }

  const onToggleDebugTZ = () => {
      setOpen(false);
      dispatch({ type: ActionTypeDebug.UPDATE_DEBUG_TZ, val: !debugTZ });
  }

  return (
    <div>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {isOp && <CommandGroup heading="Admin Actions">
              <CommandItem onSelect={onSwitchOrgs}><ArrowLeftRight className="mr-2 h-4 w-4" /><span>Switch Organization</span></CommandItem>
              <CommandItem onSelect={() => router.push("/admin")}><Gauge className="mr-2 h-4 w-4" /><span>Dashboard</span></CommandItem>
            </CommandGroup>}
            <CommandGroup heading="Suggestions">
              <CommandItem onSelect={onNewEvent}><CalendarPlus className="mr-2 h-4 w-4" /><span>New Event</span></CommandItem>
              <CommandItem onSelect={() => onRedirect("events")}><Calendar className="mr-2 h-4 w-4" /><span>Events</span></CommandItem>
              <CommandItem onSelect={() => onRedirect("members")}><Users2 className="mr-2 h-4 w-4" /><span>Members</span></CommandItem>
              <CommandItem onSelect={() => onRedirect("vehicles")}><Car className="mr-2 h-4 w-4" /><span>Vehicles</span></CommandItem>
              <CommandItem onSelect={() => onRedirect("locations")}><MapPin className="mr-2 h-4 w-4" /><span>Properties</span></CommandItem>
            </CommandGroup>
            {isDebugEnabled && <CommandGroup heading="Debug">
              <CommandItem onSelect={onToggleDebugTZ}><Bug className="mr-2 h-4 w-4" /><div className="flex flex-row justify-between items-center w-full"><span>Debug Timestamps</span><Switch className={debugTZ ? "!bg-green-400" : "!bg-red-400"} checked={debugTZ} /></div></CommandItem>
            </CommandGroup>}
          </CommandList>
        </CommandDialog>
        {isOp && <CommandDialog open={openOrgSwitcher} onOpenChange={setOpenOrgSwicher}>
          <CommandInput placeholder="Search organizations..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
                {orgs?.orgs.all.map(org => <CommandItem key={org.id} onSelect={() => onSwichOrg(org.id)}>
                    <img src={org.college?.logoUrl} className="mr-2 h-8 w-8" />
                    <div className="flex flex-col">
                        <span>{org.bio}</span>
                        <span className="text-gray-400">{org.college?.name || ""}</span>
                    </div>
                </CommandItem>)}
            </CommandGroup>
          </CommandList>
        </CommandDialog>}
    </div>
  )
}

