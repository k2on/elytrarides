import { useEffect, useState } from "react";

interface ClockProps {
    fmtFn: (d: Date) => string;
}
export function Clock({ fmtFn }: ClockProps) {
    const [time, setTime] = useState(fmtFn(new Date()));

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(fmtFn(now));
        };

        updateTime();

        const intervalId = setInterval(updateTime, 1000);

        return () => clearInterval(intervalId); 
    }, []);

    return time;
}

