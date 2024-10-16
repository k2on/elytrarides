import client from "@/client";
import View from "@/components/View";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog-mobile";
import { GetMeAccountQuery, getAvatarLetters, useCancelReservationMutation, useGetCurrentReservationQuery, useGetMeAccountQuery, useGetMeQuery } from "@/shared";
import { formatPhoneNumber } from "react-phone-number-input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog-mobile";
import sendEvent, { EVENT_RESERVATION_CANCEL } from "@/app/analytics";
import { auth_token_remove } from "@/store";
import { useContext } from "react";
import { ContextRide } from "./context";
import { useParams } from "next/navigation";

interface AccountProps {
    trigger: React.ReactNode
}
export default function Account({ trigger }: AccountProps) {
    const { id } = useParams();
    const { data } = useGetMeAccountQuery(client);
    const { data: reservation } = useGetCurrentReservationQuery(client, { idEvent: id });

    const { mutate: cancel } = useCancelReservationMutation(client, {
        onSuccess(data, variables, context) {
            auth_token_remove();
            window.location.href = window.location.href.replace("/ride", "");
        },
    });

    const onChangeName = () => {
        const url = `/name?r=${window.location.href}`;
        window.location.href = url;
    }

    const onSignout = () => {
        if (reservation?.reservations.current) {
            // sendEvent(EVENT_RESERVATION_CANCEL_FROM_SIGNOUT);
            cancel({ id: reservation.reservations.current.id });
        } else {
            auth_token_remove();
            window.location.href = window.location.href.replace("/ride", "");
        }
    }

    return <Dialog>
      <DialogTrigger className="w-full">{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your account</DialogTitle>
          {data ? <AccountInfo user={data.users.me} /> : "loading..."}
        </DialogHeader>
        <DialogFooter className="space-y-4 flex-col">
        <View className="w-full flex space-x-2">
            <Button onClick={onChangeName} className="flex-1" variant="outline">Change Name</Button>
            <AlertDialog>
              <AlertDialogTrigger className="flex-1">
                <Button className="w-full" variant="destructive">Signout</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Signout?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {reservation?.reservations.current ? "This will cancel your reservation." : "Are you sure you want to sign out?"}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onSignout}>Signout</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </View>
        </DialogFooter>
      </DialogContent>
    </Dialog>
}

interface AccountInfoProps {
    user: GetMeAccountQuery["users"]["me"]

}
function AccountInfo({ user }: AccountInfoProps) {
    return <View className="flex flex-row space-x-2 items-center">
        <Avatar>
            <AvatarImage src={user.imageUrl || ""} alt={user.name} />
            <AvatarFallback>{getAvatarLetters(user.name || "")}</AvatarFallback>
        </Avatar>
        <View className="w-full text-left">
            <h1 className="text-left">{user.name}</h1>
            <h2 className="text-gray-400">{formatPhoneNumber(user.phone)}</h2>
        </View>
    </View>
}
