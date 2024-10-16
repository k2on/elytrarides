import { useContext } from "react";
import { ContextDrive } from "./context";
import Dest from "./online/Dest";
import Loading from "./online/Loading";
import NewDest from "./online/NewDest";
import { NoReservations } from "./online/NoReservations";

export function Online() {
    const { isLoading, dest, queue, avaliableReservation } = useContext(ContextDrive)!;

    if (isLoading) return <Loading />;

    const isNoReservations = dest == null && queue.length == 0 && !avaliableReservation;
    if (isNoReservations) return <NoReservations />;

    const isNewDest = dest == null;
    if (isNewDest) return <NewDest />;

    return <Dest />;
}
