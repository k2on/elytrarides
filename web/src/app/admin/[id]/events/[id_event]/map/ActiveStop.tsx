import { useEffect, useState } from "react";
import View from "@/components/View";
import { Reservation } from "@/shared";
import { FilteredStop } from "../Map";

export function formatTime(totalSeconds: number): string {
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;

    const paddedHours = hours.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = seconds.toString().padStart(2, '0');
    const res = `${paddedMinutes}:${paddedSeconds}`
    return hours > 0 ? `${paddedHours}:${res}` : res;
}

interface ActiveStopViewProps {
    stop: FilteredStop
}
export default function ActiveStopView({ stop }: ActiveStopViewProps) {
    return <View className="bg-zinc-950 rounded border p-2">
        <Timer start={stop.madeAt} />
    </View>
}

interface TimerProps {
    start: Date;
}
export function Timer({ start }: TimerProps) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const updateSeconds = () => {
            const now = new Date();
            const secondsBetween = Math.round((now.getTime() > start.getTime() ? now.getTime() - start.getTime() : start.getTime() - now.getTime()) / 1000); // convert from ms to s
            setSeconds(secondsBetween);
        };

        updateSeconds();

        const intervalId = setInterval(updateSeconds, 1000);

        return () => clearInterval(intervalId); 
    }, [start]);

    return formatTime(seconds);
}
