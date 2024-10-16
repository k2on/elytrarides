import View from "@/components/View";
import { Button } from "@/components/ui/button";
import { ArrowDownCircle, ArrowDownToLine, ArrowLeft, ArrowUpToLine, BadgePlus, CheckCircle, CheckCircle2, CheckIcon, Clipboard, Clock, Clock4, HelpCircle, Home, Loader2, MapPin, MoreVertical, PlusCircle, Star, Users2, XCircle, XIcon } from "lucide-react";
import { AdminActionType } from "./actions";
import { FC, useContext } from "react";
import { ContextAdmin, ContextAdminDispatch } from "./context";
import { AdminEvent, ReservationStatus } from "./types";
import { Badge } from "@/components/ui/badge";
import ReservationStatusBadge from "./ReservationStatusBadge";
import { formatPhoneNumber } from "react-phone-number-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, formatTime } from "./map/ActiveStop";
import Text from "@/components/Text";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { ANONYMOUS_PROFILE_IMAGE, CANCEL_REASONS, MAX_DRIVER_RATING } from "@/const";
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

    const madeAt = new Date(reservation.madeAt * 1000);
    const cancelledAt = reservation.cancelledAt && new Date(reservation.cancelledAt * 1000);
    const driverAssignedAt = reservation.driverAssignedAt && new Date(reservation.driverAssignedAt * 1000);

    const cancelTime = reservation.cancelledAt && formatTime(reservation.cancelledAt - reservation.madeAt);

    const isFirstStopArrived = !!reservation.stops.at(0)?.driverArrivedAt;
    const isDriverDrivingToFirstStop = reservation.status == ReservationStatus.ACTIVE && !isFirstStopArrived;

    const onCopy = () => {
        navigator.clipboard.writeText(reservation.id);
        toast({ description: "Reservation ID copied to clipboard" });
        console.log(reservation);
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
        <View className="mx-8 mt-4">
            <ol className="relative">
                <li className="pb-2 pl-4">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3"><Clock className="w-4 h-4 text-gray-400" /></span>
                    <span>{madeAt.toLocaleTimeString()}</span>
                </li>
                <li className="pb-2 pl-4">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3"><Users2 className="w-4 h-4 text-gray-400" /></span>
                    <span>{reservation.passengerCount} {reservation.passengerCount == 1 ? "passenger" : "passengers"}</span>
                </li>
            </ol>
            <ol className={`relative`}>
                {(driver && driverAssignedAt)
                ? <li className={`pl-4 pb-2 relative ${isFirstStopArrived ? "border-l border-green-400" : isDriverDrivingToFirstStop ? "animated-border-left" : ""}`}>
                    <img className="absolute flex items-center justify-center w-6 h-6 border border-2 border-black bg-black rounded-full -start-3" src={driver.user.imageUrl || ANONYMOUS_PROFILE_IMAGE} />
                    <View className="flex flex-col">
                        <span>{driver.user.name} accepted</span>
                        <span className="text-gray-400">{driverAssignedAt?.toLocaleTimeString()}</span>
                    </View>
                </li>
                : <li className={`pl-4 pb-2`}>
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3">
                        <div className="bg-yellow-800 rounded-full p-[2px]"><Loader2 className="w-4 h-4 text-white animate-spin" /></div>
                    </span>
                    <View className="flex flex-col">
                        <span>Waiting for a driver</span>
                        <span className="text-gray-400">Waited <Timer start={madeAt} /></span>
                    </View>
                </li>}
                {reservation.stops.map((stop, idx) => <ReservationStop reservation={reservation} stop={stop} />)}
            </ol>
        </View>
        
        <ol className="relative border-s mx-8 max-w-md mx-auto mt-8">
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

type Reservation = AdminEvent["reservations"][number];
type ReservationStop = Reservation["stops"][number];

interface ReservationStopProps {
    reservation: Reservation,
    stop: ReservationStop,

}
function ReservationStop({ reservation, stop }: ReservationStopProps) {
    const { strategy } = useContext(ContextAdmin)!;

    const next = reservation.stops.at(stop.stopOrder + 1);
    const isDriverOnWayToNext = !!stop.completeAt && !!next && !next.driverArrivedAt;
    const isDriverArrivedAtNext = !!next && next.driverArrivedAt;

    const last = reservation.stops.at(stop.stopOrder - 1);
    const isLastStopDone = !stop.completeAt && !!last && last.completeAt;

    function Icon() {
        if (reservation.status == ReservationStatus.CANCELLED || reservation.status == ReservationStatus.INCOMPLETE) {
            return <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3">
                <div className="bg-red-600 rounded-full p-[2px]"><XIcon className="w-4 h-4 text-white" /></div>
            </span>
        } else if (stop.completeAt) {
            return <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3">
                <div className="bg-green-600 rounded-full p-[2px]"><CheckIcon className="w-4 h-4 text-white" /></div>
            </span>
        } else if (reservation.status == ReservationStatus.ACTIVE && (isLastStopDone || (stop.stopOrder == 0 && !stop.completeAt))) {
            return <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3">
                <div className="bg-yellow-600 rounded-full p-[2px]"><Loader2 className="w-4 h-4 text-white animate-spin" /></div>
            </span>
        } else {
            return <span className="absolute flex items-center justify-center w-6 h-6 bg-black rounded-full -start-3">
                <div className=" p-[2px]"><MapPin className="w-4 h-4 text-gray-200" /></div>
            </span>
        }

    }


    return <li className={`pl-4 pb-2 ${isDriverOnWayToNext ? "relative animated-border-left" : isDriverArrivedAtNext ? "border-l border-green-400" : stop.stopOrder > reservation.stops.length ? "border-l" : ""}`}>
        <Icon />
        
        <View className={`flex flex-col`}>
            <span>{stop.addressMain}</span>
            <span className="text-gray-400">{stop.addressSub}</span>
            <span className="text-gray-400">Arrival: {Math.round(stop.eta / 60)} min</span>
            {stop.driverArrivedAt && <span className="text-gray-400">Arrived: {new Date(stop.driverArrivedAt * 1000).toLocaleTimeString()}</span>}
            
        </View>
    </li>
}
