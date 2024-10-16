import View from "@/components/View";
import { GetCurrentReservationQuery } from "@/shared";

const DEFAULT_USER_IMAGE = "https://imgur.com/BhtDVgO.jpg";

interface DriverProps {
    driver: NonNullable<NonNullable<GetCurrentReservationQuery["reservations"]["current"]>["driver"]>
}
export default function Driver({ driver }: DriverProps) {
    const vehicle = driver.vehicle;
    const vehicleName = `${vehicle.color} ${vehicle.make} ${vehicle.model}`;

    return <View className="flex">
            <View className="w-full flex items-center">
                <View>
                    <img
                        className="rounded-full h-16 absolute mt-6 border-4 border-black z-10"
                        alt={"Photo of " + driver.user.name}
                        src={driver.user.imageUrl || DEFAULT_USER_IMAGE}
                    />
                    <img
                        className="w-44 flip-y"
                        src={driver.vehicle.imageUrl}
                        alt={vehicleName}
                    />
                </View>
            </View>
            <View className="w-full text-right pt-6">
                <View className="w-full">
                    <View className="text-3xl">{vehicle.license}</View>
                    <View className="text-gray-400">{vehicleName}</View>
                </View>
            </View>
    </View>
}
