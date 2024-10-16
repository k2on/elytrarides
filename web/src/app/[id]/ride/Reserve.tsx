import { ReserveStep, StateReserve, } from "@/shared";
import { useContext } from "react";
import ReservationTypePicker from "./reserve/ReservationTypePicker";
import { ContextRide } from "./context";
import Search from "./reserve/Search";
import Order from "./reserve/Order";
import Review from "./reserve/Review";
import ConfirmPin from "./reserve/ConfirmPin";

export default function ReserveScreen() {
    const { reservationType, step: rideStep } = useContext(ContextRide)!;
    const { step } = rideStep as StateReserve;

    const overlay =
        reservationType == undefined ? (
            <ReservationTypePicker />
        ) : step == ReserveStep.SEARCH ? (
            <Search />
        ) : step == ReserveStep.ORDER ? (
            <Order />
        ) : step == ReserveStep.REVIEW ? (
            <Review />
        ) : <ConfirmPin />;

    return <div className="w-full md:w-2/5">{overlay}</div>;
}
