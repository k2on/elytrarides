import View from "@/components/View"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Ticket, UserCheck2, UserX2, Users2 } from "lucide-react"
import { useContext } from "react";
import { ContextAdmin } from "./context";
import Skeleton from "react-loading-skeleton";

export default function Header() {
    const { event } = useContext(ContextAdmin)!;

    const reservations = event?.reservations;
    const reservationsComplete = event?.reservations.filter(res => res.isComplete);
    const reservationsCancelled = event?.reservations.filter(res => res.isCancelled);
    const estimatedPeoplePickup = (reservationsComplete?.filter(res => !res.isDropoff).map(res => res.passengerCount) || []).reduce((l, r) => l + r, 0);
    const estimatedPeopleDropoff = (reservationsComplete?.filter(res => res.isDropoff).map(res => res.passengerCount) || []).reduce((l, r) => l + r, 0);
    const estimatedPeople = reservations && estimatedPeoplePickup - estimatedPeopleDropoff;

    return <View className="col-span-6 row-span-1 flex flex-row space-x-4">
        <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Reservations
            </CardTitle>
            <Ticket className="text-gray-400 w-4 h-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservations != null ? reservations.length : <Skeleton width={50} />}</div>
            <p className="text-xs text-muted-foreground">
              {reservations ? reservations.filter(res => !res.isDropoff).length + (reservations.filter(res => !res.isDropoff).length == 1 ? " pickup" : " pickups") + " ⋅ " + reservations.filter(res => res.isDropoff).length + (reservations.filter(res => res.isDropoff).length == 1 ? " dropoff" : " dropoffs") : <Skeleton width={120}/>}
            </p>
          </CardContent>
        </Card>
        <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Complete Reservations
            </CardTitle>
            <UserCheck2 className="text-gray-400 w-4 h-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservationsComplete != null ? reservationsComplete.length : <Skeleton width={50} />}</div>
            <p className="text-xs text-muted-foreground">
              {reservationsComplete ? reservationsComplete.filter(res => !res.isDropoff).length + (reservationsComplete.filter(res => !res.isDropoff).length == 1 ? " pickup" : " pickups") + " ⋅ " + reservationsComplete.filter(res => res.isDropoff).length + (reservationsComplete.filter(res => res.isDropoff).length == 1 ? " dropoff" : " dropoffs") : <Skeleton width={120} />}
            </p>
          </CardContent>
        </Card>
        <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cancelled Reservations
            </CardTitle>
            <UserX2 className="text-gray-400 w-4 h-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservationsCancelled != null ? reservationsCancelled.length : <Skeleton width={50} />}</div>
            <p className="text-xs text-muted-foreground">
              {reservationsCancelled ? reservationsCancelled.filter(res => !res.isDropoff).length + (reservationsCancelled.filter(res => !res.isDropoff).length == 1 ? " pickup" : " pickups") + " ⋅ " + reservationsCancelled.filter(res => res.isDropoff).length + (reservationsCancelled.filter(res => res.isDropoff).length == 1 ? " dropoff" : " dropoffs") : <Skeleton width={120} />}
            </p>
          </CardContent>
        </Card>
        <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estimated Turnout
            </CardTitle>
            <Users2 className="text-gray-400 w-4 h-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estimatedPeople != null ? estimatedPeople : <Skeleton width={50} />}</div>
            <p className="text-xs text-muted-foreground">
              {estimatedPeople != null ? "Pickups minus dropoffs" : <Skeleton width={120} />}
            </p>
          </CardContent>
        </Card>
    </View>
}
