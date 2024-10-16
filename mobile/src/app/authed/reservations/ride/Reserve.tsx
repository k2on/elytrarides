import { useContext } from "react";
import { GetMeQueryEvent } from "../../home/feed/CardEvent";
import ReservationTypePicker from "./reserve/ReservationTypePicker";
import {
    ReserveStep,
    StateReserve,
} from "@/shared";
import { ContextRide } from "./context";
import Search from "./reserve/Search";
import Order from "./reserve/Order";
import Review from "./reserve/Review";

interface ReserveProps {
    event: GetMeQueryEvent;
}
export default function ReserveScreen({}: ReserveProps) {
    const { reservationType, step: rideStep } = useContext(ContextRide)!;

    const { step } = rideStep as StateReserve;

    return reservationType == undefined ? (
            <ReservationTypePicker />
        ) : step == ReserveStep.SEARCH ? (
            <Search />
        ) : step == ReserveStep.ORDER ? (
            <Order />
        ) : (
            <Review />
        );
}
