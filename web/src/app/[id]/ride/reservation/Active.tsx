import View from "@/components/View";
import { ReactNode, useContext, useState } from "react";
import { ContextRide } from "../context";
import { StateReservation, useCancelReservationMutation, useGetMeAccountQuery, useReservationGiveCancelReasonMutation, useSmsOptMutation } from "@/shared";
import Driver from "./active/Driver";
import client from "@/client";
import sendEvent, { EVENT_RESERVATION_CANCEL, EVENT_RESERVATION_CONTACT } from "@/app/analytics";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog-mobile";
import { queryClient } from "@/app/ReactQueryProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CarFront, CircleEllipsis, Hourglass, Loader2, Meh } from "lucide-react";
import { CANCEL_REASONS, CancelReason } from "@/const";
import { CancelIcon } from "@/components/CancelIcon";

const isSMSEnabled = true;

export default function Active() {
    const { step } = useContext(ContextRide)!;
    const { reservation, driverLocation, estimation } = step as StateReservation;
    const { toast } = useToast();

    const [isSMSPromptOpen, setIsSMSPromptOpen] = useState(false);
    const [isCancelReasonOpen, setIsCancelReasonOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState<CancelReason>();

    const { data: me } = useGetMeAccountQuery(client, undefined, {
        onSuccess(data) {
            const shouldPrompt = data.users.me.isOptedInSms == undefined || data.users.me.isOptedInSms == null;
            if (isSMSEnabled && shouldPrompt) {
                setIsSMSPromptOpen(true);
            }
        },
    });

    const { mutate: optResult, isLoading } = useSmsOptMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetMeAccount"]);
            setIsSMSPromptOpen(false);
            if (variables.optIn) {
                toast({ description: "Driver notifications turned on." })
            }
        },
    });

    const { mutate: cancel, isLoading: isCancelling } = useCancelReservationMutation(client, {
        onSuccess(data, variables, context) {
            setIsCancelReasonOpen(true);
        },
    });

    const { mutate: giveCancelReason } = useReservationGiveCancelReasonMutation(client);

    const onCancel = () => {
        sendEvent(EVENT_RESERVATION_CANCEL);
        cancel({ id: reservation.id });
    }

    const onContact = () => {
        if (!reservation.driver) return;
        sendEvent(EVENT_RESERVATION_CONTACT);
        window.location.href = `tel:${reservation.driver.phone}`;
    }

    const hasDriver = !!reservation.driver;
    const driverName = reservation.driver?.user.name;
    const pickedUp = reservation.isPickedUp;

    function getMessage() {
        if (pickedUp) return `${driverName} is dropping you off!`;
        if (reservation.isDriverArrived && !pickedUp) return `${driverName} has arrived, meet them at the pickup spot`;
        if (driverLocation && !reservation.isDropoff) return `${driverName} is on the way to ${reservation.stops[0].address.main}!`;
        if (driverLocation) return `${driverName} is picking you up!`;
        if (estimation && !hasDriver && estimation.queuePosition == 0) return "Your up next! Finding a driver...";
        if (estimation && hasDriver) return estimation.queuePosition == 1 ? `${driverName} will pick you up after 1 more person.` : `${driverName} has ${estimation.queuePosition} more people in front of you in the queue.`;
        if (estimation) return estimation.queuePosition == 1 ? "You are behind 1 person in the queue." : `You are behind ${estimation?.queuePosition} people in the queue.`;
        return "You are in the queue to be picked up";
    }

    const message = getMessage();

    const timestamp = new Date().getTime();
    const arrivalTime = estimation && new Date(timestamp + estimation.timeEstimate.arrival * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const estimationInMinutes = estimation && Math.round((pickedUp ? estimation.timeEstimate.arrival : estimation.timeEstimate.pickup) / 60);

    const ReasonButton = ({ children, reason }: { reason: CancelReason, children: ReactNode }) => <Button onClick={() => {
        setCancelReason(reason);
        giveCancelReason({ id: reservation.id, reason });
    }} variant="outline" className={cancelReason == reason ? "border-2 border-white bg-zinc-800" : ""}><CancelIcon reason={reason} className="w-4 h-4 mr-2" />{children}</Button>
    return <View>
        <AlertDialog open={isSMSPromptOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Recieve Text Notifications?</AlertDialogTitle>
              <AlertDialogDescription>
                Would you like a text message when the driver has arrived?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading} onClick={() => optResult({ optIn: false })}>No</AlertDialogCancel>
              <AlertDialogAction disabled={isLoading} onClick={() => optResult({ optIn: true })}>Yes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {!hasDriver && estimation && estimation.queuePosition > 0
        ? <View className="flex flex-row w-full">
            <View className="w-full">
                <View className="text-center text-6xl font-bold">{estimation.queuePosition}</View>
                <View className="pt-4">
                    <View className="text-center text-purple-400">{estimation.queuePosition == 1 ? "Group" : "Groups"} ahead of you</View>
                </View>
                <View className="pt-2">
                    <View className="text-center text-gray-400">Pickup around {estimationInMinutes} min</View>
                </View>
            </View>

        </View>
        : <View className="flex flex-row w-full">
            <View className="w-full flex flex-col justify-center">
                <View>{message}</View>
                {arrivalTime && <View className="text-gray-400">Dropoff at {arrivalTime}</View>}
            </View>
            <View>
                {estimation && <View className="flex items-center justify-center bg-white w-16 h-16">
                    <View>
                        <View className="text-black text-center font-semibold text-xl">{estimationInMinutes}</View>
                        <View className="text-black text-center">min</View>
                    </View>
                </View>}
            </View>
        </View>}
        {reservation.driver && <Driver driver={reservation.driver} />}
        {isSMSEnabled && me && me.users.me.isOptedInSms == false && <View>
            <Alert className="mt-2 flex justify-between items-center space-x-2">
                <View>
                    <AlertTitle>Enable Notifications 💬</AlertTitle>
                    <AlertDescription>Allow us to text you driver updates.</AlertDescription>
                </View>
                <Button className="w-20" disabled={isLoading} onClick={() => optResult({ optIn: true })}>{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enable"}</Button>
            </Alert>
        </View>}
        {!pickedUp && <View className="flex gap-2 mt-4">
            {reservation.driver && <Button onClick={onContact} variant="secondary" className="w-full">Contact Driver</Button>}
            <AlertDialog>
              <AlertDialogTrigger className="w-full"><Button variant="destructive" className="w-full nowrap">Cancel Reservation</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Reservation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will lose your position in the queue.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isCancelling}>No</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isCancelling} onClick={onCancel}>{isCancelling ? <Loader2 className="animate-spin" /> : "Cancel Reservation"}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={isCancelReasonOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Reason</AlertDialogTitle>
                        <AlertDialogDescription>Why did you cancel?</AlertDialogDescription>
                        <View className="flex flex-col space-y-2 border-t pt-4">
                            {Array.from(CANCEL_REASONS).map(([reason, label]) => <ReasonButton key={reason} reason={reason}>{label}</ReasonButton>)}
                        </View>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction disabled={cancelReason == undefined} onClick={() => { window.location.href = "" }}>Done</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </View>}
    </View>
}
