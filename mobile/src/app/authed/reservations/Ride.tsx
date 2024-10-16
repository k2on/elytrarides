import { useContext, useEffect } from "react";
import { AuthContext } from "@/app/state";
import { ActionType, makeInitialState, ReserveStep, RideStepType, useGetCurrentReservationQuery, } from "@/shared";
import { Map, ViewCentered } from "@/components";
import { SafeAreaView, Text } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { ReservationsParamList } from "../Reservations";
import Reserve from "./ride/Reserve";
import Reservation from "./ride/Reservation";
import { ContextRide, ContextRideDispatch } from "./ride/context";

export type PropsRide = StackScreenProps<ReservationsParamList, "Ride">;
export default function Ride({ route }: PropsRide) {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();

    const { data: reservation, isLoading: reservationIsLoading, status } =
        useGetCurrentReservationQuery(client);

    const { step, locations } = useContext(ContextRide)!;
    const dispatch = useContext(ContextRideDispatch)!;
    const { event } = route.params;


    const hasReservation = step.type == RideStepType.RESERVATION;

    const overlay = hasReservation ? (
        <Reservation />
    ) : (
        <Reserve event={event} />
    );


    // const getInitialState = () => makeInitialState(event, reservation?.reservations.current);
    // useEffect(() => {
    //     if (status != "success") return;
    //     dispatch({ type: ActionType.SetData, data: getInitialState() });
    // }, [reservation, status])


    if (step.type == RideStepType.INITIAL)
        return <SafeAreaView className="h-screen">
            <ViewCentered>
                <Text className="text-gray-400 text-center">Loading...</Text>
            </ViewCentered>
        </SafeAreaView>;

    const markers = locations.map((loc) => ({
        location: loc.location,
        text: loc.main,
        onPress:
            step.type == RideStepType.RESERVE ? step.step == ReserveStep.REVIEW
                ? () => dispatch({ type: ActionType.Order })
                : undefined
                : undefined,
    }));

    return <Map markers={markers} overlay={overlay}>{null}</Map>
}
