import { CancelReason } from "@/const";
import { CarFront, CircleEllipsis, Hourglass, Meh } from "lucide-react";

interface CancelIconProps {
    reason: CancelReason;
    className: string;
}
export function CancelIcon({ reason, className }: CancelIconProps) {
    switch (reason) {
        case CancelReason.LONG_WAIT:
            return <Hourglass className={className} />
        case CancelReason.ALREADY_GOT_RIDE:
            return <CarFront className={className} />
        case CancelReason.DONT_WANT_TO_GO:
            return <Meh className={className} />
        case CancelReason.OTHER:
            return <CircleEllipsis className={className} />
        default:
            throw Error("Invalid Cancel Reason");
    }
}
