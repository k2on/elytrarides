import client from "@/client";
import Text from "@/components/Text";
import View from "@/components/View";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { googleMapsApiKey } from "@/const";
import { useDebounce } from "@/lib";
import { FormLocation, OrgLocation, map_style, useGeoSearchQuery, useGeocodeMutation } from "@/shared";
import { GoogleMap, LoadScript, MarkerF } from "@react-google-maps/api";
import { Loader2, Search } from "lucide-react";
import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";

export interface LocationForm {
    label: string;
    locationLat: number;
    locationLng: number;
}


interface LocationFormProps {
    editingId?: string;
    setEditingId: React.Dispatch<React.SetStateAction<Partial<OrgLocation> | undefined>>
    form: UseFormReturn<LocationForm>
    onSubmit: (form: FormLocation) => void;
    isUpdating: boolean;

}
export default function LocationFormView({ editingId, setEditingId, form, onSubmit, isUpdating }: LocationFormProps) {

    const { mutate } = useGeocodeMutation(client, {
        onSuccess(data, variables, context) {
            form.setValue("locationLat", data.geo.geocode.location.lat);
            form.setValue("locationLng", data.geo.geocode.location.lng);
        },
    });

    function getEditPosition() {
        return { lat: form.getValues("locationLat"), lng: form.getValues("locationLng") }
    }


    return <Dialog open={!!editingId} onOpenChange={(_open) => setEditingId(undefined)}>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Edit Property</DialogTitle>
                  <DialogDescription>
                    Fill out the location information. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="label"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl><Input placeholder="Property name..." {...field} /></FormControl>
                                    <FormDescription>The name of the property</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>Address</FormLabel>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button className="w-full" variant="outline"><Search className="w-4 h-4 pr-1" /> Update Address</Button>
                            </PopoverTrigger>

                            <PopoverContent className="!w-[500px]">

                                <LocationSearch select={(placeId) => mutate({ placeId })} />

                            </PopoverContent>
                        </Popover>
                        </FormItem>
                        <FormDescription>The address of the property</FormDescription>
                        <FormMessage />
                        <View>
                            {form.getValues("locationLat") != undefined
                            ? <LoadScript googleMapsApiKey={googleMapsApiKey}><GoogleMap
                                mapContainerClassName="h-screen"
                                center={getEditPosition()}
                                zoom={14}
                                mapContainerStyle={{height: 300, width: "100%"}}
                                options={{
                                    disableDefaultUI: true,
                                    styles: map_style,
                                }}
                            > <MarkerF position={getEditPosition()} />
                            </GoogleMap></LoadScript>
                            : <View className="border h-[300px]">
                                <View className="flex flex-col items-center justify-center h-full">
                                    <View className="p-4 border rounded-lg">
                                        <Search className="w-6 h-6 text-gray-600" />
                                    </View>
                                    <Text className="mt-4">No location</Text>
                                    <Text className="mt-2 text-gray-400 text-sm">Please search for a location for the property</Text>
                                </View>
                            </View>}
                        </View>
                    <DialogFooter>
                        {isUpdating ? <Button type="submit" disabled><Loader2 className="pr-1 w-2 h-2"/> Saving...</Button> : <Button type="submit">Save changes</Button>}
                    </DialogFooter>
                    </form>
                </Form>
              </DialogContent>
            </Dialog>

    }

interface LocationSearchProps {
    select: (placeId: string) => void
}
function LocationSearch({select}: LocationSearchProps) {
    const [query, setQuery] = useState("");

    const debounced = useDebounce(query);

    const { data: searchResults } = useGeoSearchQuery(
        client,
        { query: debounced },
        { enabled: !!debounced, keepPreviousData: true },
    );

    return <View>
        <FormControl>
            <Input autoComplete="off" aria-autocomplete="none" placeholder="Property address..." onChange={(e) => setQuery(e.target.value)} />
        </FormControl>
        <View className="flex flex-col space-y-2 py-2">
            {searchResults?.geo.search.map(result => <View key={result.placeId} onClick={() => select(result.placeId)} className="flex flex-col hover:bg-zinc-800 cursor-pointer rounded">
                <Text>{result.main}</Text>
                <Text className="text-gray-400">{result.sub}</Text>
            </View>)}
        </View>
    </View>

}
