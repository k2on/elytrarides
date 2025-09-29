import View from "@/components/View";
import { Button } from "@/components/ui/button";
import { ArrowDownCircle, ArrowDownToLine, ArrowLeft, ArrowUpToLine, BadgePlus, CheckCircle, CheckCircle2, Clipboard, Clock4, HelpCircle, Home, MapPin, MoreVertical, PlusCircle, Star, Users2, XCircle } from "lucide-react";
import { AdminActionType } from "./actions";
import { useContext } from "react";
import { ContextAdmin, ContextAdminDispatch } from "./context";
import { getReservationStatus } from "./util";
import { ReservationStatus } from "./types";
import { Badge } from "@/components/ui/badge";
import ReservationStatusBadge from "./ReservationStatusBadge";
import { formatPhoneNumber } from "react-phone-number-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, formatTime } from "./map/ActiveStop";
import Text from "@/components/Text";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { CANCEL_REASONS, MAX_DRIVER_RATING } from "@/const";
import { CancelIcon } from "@/components/CancelIcon";

interface FocusedReservationProps {
    id: string;
}
export default function ReservationView({ id }: FocusedReservationProps) {
    const { event, strategy } = useContext(ContextAdmin)!;
    const dispatch = useContext(ContextAdminDispatch)!;
    const { toast } = useToast();

    const reservation = event?.reservations.find(res => res.id == id)!;
    const driver = event?.drivers.find(driver => driver.id == reservation.idDriver);
    const reserver = reservation.reserver;

    const status = getReservationStatus(reservation, strategy);

    const madeAt = new Date(reservation.madeAt * 1000);
    const cancelledAt = reservation.cancelledAt && new Date(reservation.cancelledAt * 1000);
    const completeAt = reservation.completeAt && new Date(reservation.completeAt * 1000);
    const arrivedAt = reservation.driverArrivedAt && new Date(reservation.driverArrivedAt * 1000);

    const cancelTime = reservation.cancelledAt && formatTime(reservation.cancelledAt - reservation.madeAt);
    const completeTime = reservation.completeAt && formatTime(reservation.completeAt - reservation.madeAt);

    const onCopy = () => {
        navigator.clipboard.writeText(reservation.id);
        toast({ description: "Reservation ID copied to clipboard" });
    }

    return <View className="border-b">
        <View className="flex justify-between sticky top-0 z-10 bg-zinc-900 p-4 border-b">
            <Button onClick={() => dispatch({ type: AdminActionType.SET_FOCUSED, id: null })} variant="outline"><ArrowLeft /></Button>
            <View className="flex flex-col text-center">
                <span>{reserver.name}</span>
                <span className="text-gray-400">{formatPhoneNumber(reserver.phone)}</span>
            </View>
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <Button variant="outline"><MoreVertical /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Manage Reservation</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem onClick={onCopy}>
                            <Clipboard className="mr-2 h-4 w-4" />
                            <span>Copy Reservation ID</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </View>
        
        <ol className="relative border-s mx-8 max-w-md mx-auto mt-8">
            <li className="pb-10 ms-6">            
                <span className="absolute flex items-center justify-center w-6 h-6 bg-purple-800 rounded-full -start-3">
                    <BadgePlus className="text-white w-4 h-4" />
                </span>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-zinc-900 border-b pb-4 mb-4">
                        <CardTitle className="text-sm font-medium">
                          {reserver.name} created a {reservation.isDropoff ? "dropoff" : "pickup"} reservation
                        </CardTitle>
                        <CardDescription>
                            {madeAt.toLocaleTimeString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ol className="relative">
                            <li className="pb-2 ms-4">
                                <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3"><Users2 className="w-4 h-4 text-gray-400" /></span>
                                <span>{reservation.passengerCount} {reservation.passengerCount == 1 ? "passenger" : "passengers"}</span>
                            </li>
                            {reservation.estPickup > 0 && <li className="pb-2 ms-4">
                                <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3"><Clock4 className="w-4 h-4 text-gray-400" /></span>
                                <span>~{Math.floor(reservation.estPickup / 60)} min pickup</span>
                            </li>}
                            {false && reservation.estDropoff && <li className="pb-2 ms-4">
                                <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3"><ArrowDownToLine className="w-4 h-4 text-gray-400" /></span>
                                <span>~{Math.floor(reservation.estDropoff / 60)} min dropoff</span>
                            </li>}
                        </ol>
                        <ol className={`relative border-s ${reservation.isDropoff && "mb-8"}`}>
                            {reservation.isDropoff && <li className="pb-2 ms-4">
                                <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3"><Home className="w-4 h-4 text-gray-400" /></span>
                                <span>Event</span>
                            </li>}
                            {reservation.stops.map((stop, idx) => <li className={`ms-4 pb-2 ${idx == reservation.stops.length - 1 && reservation.isDropoff? "h-0" : ""}`}>
                                <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3"><MapPin className="w-4 h-4 text-gray-400" /></span>
                                <View className="flex flex-col">
                                    <span>{stop.address.main}</span>
                                    <span className="text-gray-400">{stop.address.sub}</span>
                                </View>
                            </li>)}
                            {!reservation.isDropoff && <li className="ms-4">
                                <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3"><Home className="w-4 h-4 text-gray-400" /></span>
                                <span>Event</span>
                            </li>}
                        </ol>
                    </CardContent>
                </Card>
            </li>
            {status == ReservationStatus.WAITING && <li className="ms-6 pb-10">            
                <span className="absolute flex items-center justify-center w-6 h-6 bg-gray-800 rounded-full -start-3">
                    <Clock4 className="text-white w-4 h-4" />
                </span>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-zinc-900 border-b pb-4 mb-4">
                        <CardTitle className="text-sm font-medium">
                          Waiting for a driver
                        </CardTitle>
                        <CardDescription>
                            
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Text className="text-gray-400">Waited <Timer start={madeAt} /></Text>
                    </CardContent>
                </Card>
            </li>}
            {reservation.idDriver && driver && <li className="ms-6 pb-10">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-green-800 rounded-full -start-3">
                    <CheckCircle2 className="text-white w-4 h-4" />
                </span>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-zinc-900 border-b pb-4 mb-4">
                        <CardTitle className="text-sm font-medium">
                          {driver.user.name} accepted the reservation
                        </CardTitle>
                        <CardDescription></CardDescription>
                    </CardHeader>
                        <br />
                </Card>
            </li>}
            {arrivedAt && driver && <li className="ms-6 mb-10">            
                <span className="absolute flex items-center justify-center w-6 h-6 bg-green-800 rounded-full -start-3">
                    <CheckCircle2 className="text-white w-4 h-4" />
                </span>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-zinc-900 border-b pb-4 mb-4">
                        <CardTitle className="text-sm font-medium">
                          {driver.user.name} arrived at the pickup stop
                        </CardTitle>
                        <CardDescription>
                            {arrivedAt.toLocaleTimeString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Text className="text-gray-400">{""}</Text>
                    </CardContent>
                </Card>
            </li>}
            {completeAt && driver && <li className="ms-6 pb-10">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-green-800 rounded-full -start-3">
                    <ArrowDownCircle className="text-white w-4 h-4" />
                </span>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-zinc-900 border-b pb-4 mb-4">
                        <CardTitle className="text-sm font-medium">
                          {driver.user.name} dropped off {reserver.name}
                        </CardTitle>
                        <CardDescription>
                            {completeAt.toLocaleTimeString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Text className="text-gray-400">Complete after {completeTime}</Text>
                    </CardContent>
                </Card>
            </li>}
            {cancelledAt && <li className="ms-6 pb-10">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-red-800 rounded-full -start-3">
                    <XCircle className="text-white w-4 h-4" />
                </span>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-zinc-900 border-b pb-4 mb-4">
                        <CardTitle className="text-sm font-medium">
                          {reserver.name} cancelled the reservation.
                        </CardTitle>
                        <CardDescription>
                            {cancelledAt.toLocaleTimeString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>

                        <ol className="relative">
                            <li className="pb-2 ms-4">
                                <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3"><Clock4 className="w-4 h-4 text-gray-400" /></span>
                                <span>Watied {cancelTime}</span>
                            </li>
                            {reservation.cancelReason != null && reservation != undefined ? <li className="pb-2 ms-4">
                                <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3"><CancelIcon reason={reservation.cancelReason} className="w-4 h-4 text-gray-400" /></span>
                                <span className="italic">"{Array.from(CANCEL_REASONS).find(([reason,]) => reason == reservation.cancelReason)![1]}"</span>
                            </li> : <li className="pb-2 ms-4">
                                <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3"><HelpCircle className="w-4 h-4 text-gray-400" /></span>
                                <span className="italic text-gray-400">No reason given</span>
                            </li>}
                        </ol>
                    </CardContent>
                </Card>
            </li>}
            {reservation.ratedAt && <li className="ms-6 pb-10">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-purple-800 rounded-full -start-3">
                    <Star className="text-white w-4 h-4 fill-white" />
                </span>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-zinc-900 border-b pb-4 mb-4">
                        <CardTitle className="text-sm font-medium">
                          {reserver.name} rated {reservation.rating} stars
                        </CardTitle>
                        <CardDescription>
                            {new Date(reservation.ratedAt * 1000).toLocaleTimeString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <View className="flex flex-row space-x-4 mx-auto justify-center">
                            {Array.from({ length: MAX_DRIVER_RATING }).map((_, idx) => <Star className={`w-8 h-8 ${idx + 1 <= reservation.rating! ? "fill-purple-400 text-purple-400" : "fill-gray-600 text-gray-600"}`} />)}
                        </View>
                        {reservation.rating! < MAX_DRIVER_RATING && <View>
                            <View className="text-gray-400 text-sm mt-2 mb-1">Problems</View>
                            <ul className="list-disc ml-4">
                                {reservation.feedback?.isLongWait && <li>Long Wait</li>}
                                {reservation.feedback?.isEtaAccuracy && <li>ETA Accuracy</li>}
                                {reservation.feedback?.isPickupSpot && <li>Pickup Spot</li>}
                                {reservation.feedback?.isDriverNeverArrived && <li>Driver Never Arrived</li>}
                            </ul>
                        </View>}

                    </CardContent>
                </Card>
            </li>}
        </ol>


        {/**<View className="flex justify-center">
            <View>
                <Card className="flex-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Reservation Created
                        </CardTitle>
                        <PlusCircle className="text-gray-400 w-4 h-4" />
                    </CardHeader>
                    <CardContent>
                        <CardDescription>{madeAt.toLocaleTimeString()}</CardDescription>
                        <View>{reservation.reserver.name}</View>
                    </CardContent>
                </Card>
                <View>{formatPhoneNumber(reservation.reserver.phone)}</View>
                <View>{reservation.passengerCount}</View>
                <View><ReservationStatusBadge status={status} /></View>
                <View></View>
                <View>{driver?.user.name}</View>
            </View>
        </View>**/}
    </View>
}
