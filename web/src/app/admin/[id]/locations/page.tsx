"use client";

import client from "@/client";
import View from "@/components/View";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormLocation, GetOrgLocationsQuery, map_style, useGeoSearchQuery, useGeocodeMutation, useGetOrgLocationsQuery, useUpdateLocationMutation } from "@/shared";
import { Loader2, Pencil, PlusSquare, Search, Trash } from "lucide-react";
import { FC, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { v4 } from "uuid";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { GoogleMap, LoadScript, MarkerF } from "@react-google-maps/api";
import { googleMapsApiKey } from "@/const";
import Text from "@/components/Text";
import { now, useDebounce } from "@/lib";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { queryClient } from "@/app/ReactQueryProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LocationFormView, { LocationForm } from "./form";

interface EventsProps {
    params: { id: string };
}

type OrgLocation = GetOrgLocationsQuery["orgs"]["get"]["locations"][0];

const locations: FC<EventsProps> = ({ params }) => {
    const { id } = params;
    const form = useForm<LocationForm>();
    const [editLocation, setEditLocation] = useState<Partial<OrgLocation>>()
    const [removeLocation, setRemoveLocation] = useState<OrgLocation>();
    const { toast } = useToast();

    const onNewLocation = () => {
        form.reset();
        setEditLocation({
            id: v4(),
        })
    };

    const { mutate: update, isLoading: isUpdating } = useUpdateLocationMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetOrgLocations", { id }])
        },
    });

    const error = (description: string) => toast({ variant: "destructive", title: "Something went wrong", description });

    const onSubmit = (form: FormLocation) => {
        if (!editLocation) return error("Can not update without selecting a location first.");

        update({
            idOrg: id,
            idLocation: editLocation.id,
            form: {...form, imageUrl: ""}
        });
        setEditLocation(undefined);
    }
    
    const onRemoveLocation = (location: OrgLocation) => {
        if (!removeLocation) return error("Can not update without selecting a location first.");

        update({
            idOrg: id,
            idLocation: location.id,
            form: {
                label: location.label,
                locationLat: location.locationLat,
                locationLng: location.locationLng,
                imageUrl: "",
                obsoleteAt: now(),
            }
        })
        setRemoveLocation(undefined);
    }

    const onEditLocation = (location: OrgLocation) => {
        setEditLocation(location);
        form.setValue("label", location.label);
        form.setValue("locationLat", location.locationLat);
        form.setValue("locationLng", location.locationLng);
    }

    const { data: locations, isLoading } = useGetOrgLocationsQuery(client, { id });




    return <View className="max-w-3xl mx-auto py-8">
        <Card>
            <CardHeader>
                <CardTitle>Organization Properties</CardTitle>
                <CardDescription>Manage all your organization properties.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={onNewLocation}>
                    <PlusSquare className="mr-2 h-4 w-4" /> New Property
                </Button>
                <View className="mt-4">
                {(isLoading && !locations) ? <View className="flex text-gray-600 space-x-2 items-center justify-center"><Loader2 className="animate-spin" /> <View>Loading Locations</View></View>
                : <Table>
                  <TableCaption>All properties registered for the organization.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property Name</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations && locations.orgs.get.locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell>{location.label}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger><Button variant="outline">...</Button></DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onEditLocation(location)}><Pencil className="mr-2 w-4 h-4" />Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setRemoveLocation(location)} className="text-destructive"><Trash className="mr-2 w-4 h-4" />Remove</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>}
            </View>
            </CardContent>
        </Card>

            <LocationFormView editingId={editLocation?.id} setEditingId={setEditLocation} form={form} onSubmit={onSubmit} isUpdating={isUpdating} />

            <AlertDialog open={removeLocation != undefined}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove the location from the organization?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setRemoveLocation(undefined)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRemoveLocation(removeLocation!)}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </View>
    
}


export default locations;

