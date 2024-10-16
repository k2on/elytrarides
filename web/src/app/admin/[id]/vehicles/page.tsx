"use client";

import client from "@/client";
import View from "@/components/View";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GetOrgVehiclesQuery, useGetOrgMembersQuery, useGetOrgVehiclesQuery, useGetVehicleColorsQuery, useGetVehicleMakesQuery, useGetVehicleModelsQuery, useGetVehicleYearsQuery, useUpdateVehicleMutation } from "@/shared";
import { Pencil, PlusSquare, Trash } from "lucide-react";
import { FC, useState } from "react";
import { formatVehicleName, now } from "@/lib";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { v4 } from "uuid";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UseFormReturn, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { queryClient } from "@/app/ReactQueryProvider";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import Skeleton from "react-loading-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EventsProps {
    params: { id: string };
}

type Vehicle = GetOrgVehiclesQuery["orgs"]["get"]["vehicles"][0];

interface FormVehicle {
    year: number;
    make: string;
    model: string;
    color: string;
    license: string;
    capacity: number;
    imageUrl: string;
    owner: string;
}

function makeImage(year: number, make: string, model: string, color: string): string {
    return `https://raw.githubusercontent.com/k2on/BasedCarAPI/main/data/years/${year}/${make}/${model}/colors/${color}.png`;
}

const vehicles: FC<EventsProps> = ({ params }) => {
    const { id } = params;
    const { data: members } = useGetOrgMembersQuery(client, { id });
    const [editVehicle, setEditVehicle] = useState<Partial<Vehicle>>()
    const [removeVehicle, setRemoveVehicle] = useState<Vehicle>();
    const form = useForm<FormVehicle>();
    const { toast } = useToast();

    const error = (description: string) => toast({ variant: "destructive", title: "Something went wrong", description });

    const onNewVehicle = () => {
        form.reset();
        setEditVehicle({
            id: v4(),
        })
    };

    const onRemoveVehicle = (idVehicle: any) => {
        if (!removeVehicle) return error("Must select a vehicle to remove");
        setRemoveVehicle(undefined);
        mutate({
            idOrg: id,
            idVehicle: idVehicle,
            form: {
                year: parseInt(removeVehicle.year.toString()),
                make: removeVehicle.make,
                model: removeVehicle.model,
                color: removeVehicle.color,
                license: removeVehicle.license,
                capacity: parseInt(removeVehicle.capacity.toString()),
                imageUrl: removeVehicle.imageUrl,
                obsoleteAt: now(),
            }
        });
    }

    const { data: vehicles } = useGetOrgVehiclesQuery(client, { id });


    const { mutate } = useUpdateVehicleMutation(client, {
        onSuccess(data, variables, context) {
            setEditVehicle(undefined);
            toast({ description: "Vehicle Updated" })
            queryClient.invalidateQueries(["GetOrgVehicles", { id }]);
        },
    });

    const onSubmit = (form: FormVehicle) => {
        if (!editVehicle) return error("Must select a vehicle to edit");
        console.log(form);
        const { year: yearStr, make, model, color, license, capacity: capacityStr, owner } = form;
        const year = parseInt(yearStr.toString());
        const capacity = parseInt(capacityStr.toString());
        const imageUrl = makeImage(year, make, model, color);
        mutate({
            idOrg: id,
            idVehicle: editVehicle.id,
            form: {
                year,
                make,
                model,
                color,
                license,
                capacity,
                imageUrl,
                owner,
            }
        })
    }

    const onEdit = (vehicle: Vehicle) => {
        setEditVehicle(vehicle);
        form.setValue("year", vehicle.year);
        form.setValue("make", vehicle.make);
        form.setValue("model", vehicle.model);
        form.setValue("color", vehicle.color);
        form.setValue("license", vehicle.license);
        form.setValue("capacity", vehicle.capacity);
        form.setValue("owner", vehicle.ownerPhone);
        // form.setValue("imageUrl", vehicle.imageUrl);
    }

    return <View className="max-w-3xl mx-auto px-6 py-8">
        
        <Card>
            <CardHeader>
                <CardTitle>Organization Vehicles</CardTitle>
                <CardDescription>Manage your organization's vehicles</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={onNewVehicle}>
                    <PlusSquare className="mr-2 h-4 w-4" /> New Vehicle
                </Button>
                <br />
                <br />
                <Table>
                  <TableCaption>All vehicles registered for the organization.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Vehicle Owner</TableHead>
                      <TableHead>Vehicle Name</TableHead>
                      <TableHead>License Plate</TableHead>
                      <TableHead>Vehicle Capacity</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles && vehicles.orgs.get.vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell><img className="flip-y" src={vehicle.imageUrl} /></TableCell>
                        <TableCell>{members?.orgs.get.memberships.find(membership => membership.user.phone == vehicle.ownerPhone)?.user.name}</TableCell>
                        <TableCell>{formatVehicleName(vehicle)}</TableCell>
                        <TableCell>{vehicle.license}</TableCell>
                        <TableCell>{`${vehicle.capacity} ${vehicle.capacity == 1 ? "passenger" : "passengers"}`}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger><Button variant="outline">...</Button></DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onEdit(vehicle)}><Pencil className="mr-2 w-4 h-4" />Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setRemoveVehicle(vehicle)} className="text-destructive"><Trash className="mr-2 w-4 h-4" />Remove</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </CardContent>
        </Card>

      <Dialog open={!!editVehicle} onOpenChange={(_open) => setEditVehicle(undefined)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Vehicle</DialogTitle>
              <DialogDescription>
                Fill out the vehicle information. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                    <FormContent id={id} key={form.watch("color")} form={form} />
                </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={removeVehicle != undefined}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove the vehicle from the organization?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRemoveVehicle(undefined)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRemoveVehicle(removeVehicle!.id)}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </View>
}

interface FormContentProps {
    id: string;
    form: UseFormReturn<FormVehicle>
}
function FormContent({ id, form }: FormContentProps) {
    const { data: members, isLoading } = useGetOrgMembersQuery(client, { id });
    const { color, license, capacity } = form.watch();
    const disabled = !color || !license || !capacity;

    return color
        ? <>

        <VehiclePreview form={form} />

        <FormField
          control={form.control}
          name="owner"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Owner</FormLabel>
              <FormControl>
                {isLoading ? <Skeleton height={40} /> : <Select onValueChange={(e) => {
                    field.onChange(e);
                }} value={field.value?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Owner" />
                  </SelectTrigger>
                  <SelectContent className="overflow-y-auto max-h-64">
                    <SelectGroup>
                      <SelectLabel>Members</SelectLabel>
                      {members?.orgs.get.memberships.map(membership => (
                          <SelectItem key={membership.user.phone} value={membership.user.phone}>{membership.user.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>}
              </FormControl>
              <FormDescription>
                Owner of the vehicle
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="license"
          render={({ field }) => (
            <FormItem>
              <FormLabel>License</FormLabel>
              <FormControl>
                <Input placeholder="License..." {...field} />
              </FormControl>
              <FormDescription>
                License plate of the vehicle
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity</FormLabel>
              <FormControl>
                <Input placeholder="Capacity..." {...field} />
              </FormControl>
              <FormDescription>
                Capacity of the vehicle
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
            <Button disabled={disabled} type="submit">Save changes</Button>
        </DialogFooter>

        </>
        : <VehicleSelection form={form} />
    }

interface VehicleSelectionProps {
    form: UseFormReturn<FormVehicle>
}
function VehiclePreview({ form }: VehicleSelectionProps) {
    const { year, make, model, color } = form.getValues();
    return <View className="text-center flex flex-col">
        <View>
            <img className="block h-32 mx-auto" src={makeImage(year, make, model, color)} />
        </View>
        <span>{color} {year} {make} {model}</span>
        <Button type="button" onClick={() => form.setValue("color", "")} variant="link">Change</Button>
    </View>

}

interface VehicleSelectionProps {
    form: UseFormReturn<FormVehicle>
}
function VehicleSelection({ form }: VehicleSelectionProps) {
    const { data: years } = useGetVehicleYearsQuery(client, {}, { keepPreviousData: true });
    const { data: makes } = useGetVehicleMakesQuery(client, { year: form.getValues("year")?.toString() }, { enabled: !!form.getValues("year"), keepPreviousData: true });
    const { data: models } = useGetVehicleModelsQuery(client, { year: form.getValues("year")?.toString(), make: form.getValues("make") }, { enabled: !!form.getValues("make"), keepPreviousData: true });
    const { data: colors } = useGetVehicleColorsQuery(client, { year: form.getValues("year")?.toString(), make: form.getValues("make"), model: form.getValues("model") }, { enabled: !!form.getValues("model"), keepPreviousData: true });

    return <>
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl>
                {!years ? <Skeleton height={40} /> : <Select onValueChange={(e) => {
                    field.onChange(e);
                    form.resetField("make");
                }} value={field.value?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vehicle year" />
                  </SelectTrigger>
                  <SelectContent className="overflow-y-auto max-h-64">
                    <SelectGroup>
                      <SelectLabel>Year</SelectLabel>
                      {years.vehicles.years.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>}
              </FormControl>
              <FormDescription>
                Year of the vehicle
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.getValues("year") && <FormField
          control={form.control}
          name="make"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Make</FormLabel>
              <FormControl>
                {!makes ? <Skeleton height={40} /> : <Select key={form.watch("make")} onValueChange={(e) => {
                    form.resetField("model");
                    form.resetField("color");
                    field.onChange(e);
                }} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vehicle Make" />
                  </SelectTrigger>
                  <SelectContent className="overflow-y-auto max-h-64">
                    <SelectGroup>
                      <SelectLabel>Make</SelectLabel>
                      {makes.vehicles.makes.map(make => (
                          <SelectItem value={make}>{make}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>}
              </FormControl>
              <FormDescription>
                Manufacturer of the vehicle
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />}
        {form.getValues("make") && <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl>
                {!models ? <Skeleton height={40} /> : <Select onValueChange={(e) => {
                    form.resetField("color");
                    field.onChange(e);
                }} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vehicle Model" />
                  </SelectTrigger>
                  <SelectContent className="overflow-y-auto max-h-64">
                    <SelectGroup>
                      <SelectLabel>Model</SelectLabel>
                      {models.vehicles.models.map(model => (
                          <SelectItem value={model}>{model}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>}
              </FormControl>
              <FormDescription>
                Model of the vehicle
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />}
        {form.getValues("model") && <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                {!colors ? <Skeleton height={40} /> : <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vehicle Color" />
                  </SelectTrigger>
                  <SelectContent className="overflow-y-auto max-h-64">
                    <SelectGroup>
                      <SelectLabel>Color</SelectLabel>
                      {colors.vehicles.colors.map(color => (
                          <SelectItem value={color}>{color}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>}
              </FormControl>
              <FormDescription>
                Color of the vehicle
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />}
    </>;
}

export default vehicles;

