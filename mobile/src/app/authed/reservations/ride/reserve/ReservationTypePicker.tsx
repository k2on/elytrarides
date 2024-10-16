import { SafeAreaView, Text, View } from "react-native";
import { ViewCentered, Button } from "@/components";
import { ActionType, ReservationType, en, StateReserve } from "@/shared";
import { useContext } from "react";
import { ContextRide, ContextRideDispatch } from "../context";

interface ReservationTypePickerProps {}
export default function ReservationTypePicker({}: ReservationTypePickerProps) {
    const { step } = useContext(ContextRide)!;
    const { event } = step as StateReserve;
    const dispatch = useContext(ContextRideDispatch)!;

    return (
        <SafeAreaView className="flex-1 bg-zinc-950 h-screen w-screen">
            <ViewCentered>
                <View>
                    <Text className="text-white text-center text-2xl font-semibold">
                        {en.RIDE_RESERVATION_TYPE}
                    </Text>
                    <View className="my-4">
                        <Button
                            title={
                                en.RIDE_RESERVATION_PICKUP +
                                event.location!.label
                            }
                            onClick={() =>
                                dispatch({
                                    type: ActionType.SetReservationType,
                                    reservationType: ReservationType.PICKUP,
                                })
                            }
                            disabled={false}
                        />
                    </View>
                    <Button
                        title={en.RIDE_RESERVATION_DROPOFF}
                        onClick={() =>
                            dispatch({
                                type: ActionType.SetReservationType,
                                reservationType: ReservationType.DROPOFF,
                            })
                        }
                        disabled={false}
                    />
                </View>
            </ViewCentered>
        </SafeAreaView>
    );
}
