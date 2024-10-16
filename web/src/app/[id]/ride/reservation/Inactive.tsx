import client from "@/client";
import View from "@/components/View";
import ViewCentered from "@/components/ViewCentered";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog-mobile";
import { MAX_DRIVER_RATING } from "@/const";
import { GetCurrentReservationQuery, useRateReservationMutation } from "@/shared";
import { Star } from "lucide-react";
import { useState } from "react";

interface FeedbackOption {
    label: string;
    enabled: boolean;

}
const FEEDBACK: FeedbackOption[] = [
    { label: "Long Wait Time", enabled: true },
    { label: "ETA Accuracy", enabled: true },
    { label: "Pickup Spot", enabled: true },
    { label: "Driver Never Arrived", enabled: true },
]

interface InactiveProps {
    reservation: NonNullable<GetCurrentReservationQuery["reservations"]["current"]>;
}
export default function Inactive({ reservation }: InactiveProps) {
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(true);
    const newReservation = (isDropoff?: boolean) => window.location.href = isDropoff ? `${window.location.href}?dropoff` : window.location.href;
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState(0);

    const isFeedbackChecked = (idx: number) => (feedback & (1 << idx)) != 0;

    const onFeedbackChange = (idx: number) => setFeedback(feedback ^ (1 << idx));

    const { mutate, isLoading } = useRateReservationMutation(client, {
        onSuccess(_data, _variables, _context) {
            setIsFeedbackOpen(false);
        },
    });

    return <ViewCentered>
        <View>
            <View>
                <View className="text-xl font-semibold">Ride Complete</View>
                <View className="text-gray-400">Thank you for using Elytra Rides!</View>
            </View>
            <View className="mt-4">
            <Button onClick={() => newReservation()} className="w-full bg-purple-800 hover:bg-purple-900 text-white hover:text-gray-200">Make Another Reservation</Button>
            </View>
        </View>
        <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
            <DialogContent className="hide-close">
                <DialogHeader>
                    <img className="rounded-full h-16 w-16 mx-auto block mb-2" src={reservation.driver?.user.imageUrl!} />
                    <DialogTitle>How was your trip with {reservation.driver?.user.name.split(" ")[0]}?</DialogTitle>
                    <DialogDescription>Give us some feedback on how your ride went.</DialogDescription>
                </DialogHeader>
                <View className="flex flex-row space-x-4 mx-auto">
                    {Array.from({ length: MAX_DRIVER_RATING }).map((_, idx) => <Star onClick={() => {
                        setRating(idx + 1);
                        if (idx + 1 == MAX_DRIVER_RATING) setFeedback(0);
                    }} className={`w-10 h-10 ${idx + 1 <= rating ? "fill-purple-400 text-purple-400" : "fill-gray-600 text-gray-600"}`} />)}
                </View>
                <View className={`border-t transition-all overflow-hidden ${0 < rating && rating < MAX_DRIVER_RATING ? "h-24" : "h-0"}`}>
                    <View className="text-center text-gray-400 text-sm mt-2">What went wrong?</View>
                    <View className="text-center flex flex-wrap justify-center gap-2 mt-2">
                        {FEEDBACK.map((item, idx) => item.enabled && <FeedbackToggle checked={isFeedbackChecked(idx)} onChange={() => onFeedbackChange(idx)}>{item.label}</FeedbackToggle>)}
                    </View>
                </View>
                <DialogFooter>
                    <Button onClick={() => mutate({ id: reservation.id, rating, feedback })} disabled={(rating < MAX_DRIVER_RATING && feedback == 0) || isLoading}>{isLoading ? "Submitting" : "Submit"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </ViewCentered>
}

interface FeedbackToggleProps {
    children: React.ReactNode;
    checked: boolean;
    onChange: () => void;
}
function FeedbackToggle({ children, checked, onChange }: FeedbackToggleProps) {
    return <span onClick={onChange} className={`rounded whitespace-nowrap px-2 ${checked ? "bg-white text-black" : "bg-zinc-900"}`}>{children}</span>
}
