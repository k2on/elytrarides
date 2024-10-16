import ViewCentered from "../../../../components/ViewCentered";
import { ReservationType, en, ActionType, useGetMeAccountQuery, getAvatarLetters } from "@/shared";
import View from "@/components/View";
import Text from "@/components/Text";
import { useContext } from "react";
import { ContextRideDispatch } from "../context";
import sendEvent, { EVENT_SEARCH_LOCATION, EVENT_SET_RESERVATION_TYPE_DROPOFF, EVENT_SET_RESERVATION_TYPE_PICKUP } from "@/app/analytics";
import Account from "../Account";
import client from "@/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BGEffect from "@/components/BGEffect";
import { Button } from "@/components/ui/button";

interface ReservationTypePickerProps {}
export default function ReservationTypePicker({}: ReservationTypePickerProps) {
    const dispatch = useContext(ContextRideDispatch)!;

    return (
        <View className="flex-1 absolute z-20 w-screen bg-zinc-950" style={{ height: "-webkit-fill-available" }}>
            <ViewCentered>
                <View className="z-20">
                    <View>
                        <Text className="text-white text-center text-2xl font-semibold block">
                            {en.RIDE_RESERVATION_TYPE}
                        </Text>
                    </View>
                    <View className="my-4">
                        <Button
                            className="w-full bg-purple-800 hover:bg-purple-900 text-white hover:text-gray-200"
                            onClick={() => {
                                    sendEvent(EVENT_SET_RESERVATION_TYPE_PICKUP);
                                    sendEvent(EVENT_SEARCH_LOCATION);
                                    dispatch({
                                        type: ActionType.SetReservationType,
                                        reservationType: ReservationType.PICKUP,
                                    })
                                }
                            }
                            disabled={false}
                        >{en.RIDE_RESERVATION_PICKUP}</Button>
                    </View>
                    <Button
                        className="w-full bg-purple-800 hover:bg-purple-900 text-white hover:text-gray-200"
                        onClick={() => {
                                sendEvent(EVENT_SET_RESERVATION_TYPE_DROPOFF);
                                sendEvent(EVENT_SEARCH_LOCATION);
                                dispatch({
                                    type: ActionType.SetReservationType,
                                    reservationType: ReservationType.DROPOFF,
                                })
                            }
                        }
                        disabled={false}>{en.RIDE_RESERVATION_DROPOFF}</Button>
                </View>
            </ViewCentered>
            <View className="absolute bottom-10 w-full z-10">
                <Account trigger={<AccountWelcome />} />
            </View>
            <BGEffect />
        </View>
    );
}

export function AccountWelcome() {
    const { data } = useGetMeAccountQuery(client);

    return <View className="border inline-block p-4 rounded bg-zinc-950">
            <Avatar className="mx-auto">
                <AvatarImage src={data?.users.me.imageUrl || ""} alt={data?.users.me.name} />
                <AvatarFallback>{getAvatarLetters(data?.users.me.name || "")}</AvatarFallback>
            </Avatar>
            <View className="flex flex-col w-full mt-2">
                <Text className="">{data?.users.me.name}</Text>
                <Text className="text-gray-500">Signout</Text>
            </View>
        </View>
}
