import { Badge } from "@/components/ui/badge";
import { ReservationStatus } from "./types";

interface ReservationStatusBadgeProps {
    status: ReservationStatus
}
export default function ReservationStatusBadge({ status }: ReservationStatusBadgeProps) {
    switch (status) {
        case ReservationStatus.WAITING:
            return <Badge>WAITING</Badge>
        case ReservationStatus.ACTIVE:
            return <Badge className="animate-pulse">ACTIVE</Badge>
        case ReservationStatus.COMPLETE:
            return <Badge className="bg-green-400">COMPLETE</Badge>
        case ReservationStatus.CANCELLED:
            return <Badge variant="destructive">CANCELLED</Badge>
    }
}
