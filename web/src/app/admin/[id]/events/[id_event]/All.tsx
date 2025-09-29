import View from "@/components/View";
import DataTable from "./all/data-table";
import { ReservationGroupAll, columns } from "./all/columns";
import { useContext } from "react";
import { ContextAdmin, ContextAdminDispatch } from "./context";
import { getReservationStatus } from "./util";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManageDrivers from "./Drivers";
import { AdminActionType } from "./actions";

export default function All() {
    const { event, strategy, tab } = useContext(ContextAdmin)!;
    const dispatch = useContext(ContextAdminDispatch)!;

    const now = new Date().getTime() / 1000;
    const data: ReservationGroupAll[] = event?.reservations.map(res => ({
        id: res.id,
        madeAt: res.madeAt,
        reserver: res.reserver.phone,
        driver: res.idDriver || 0,
        status: getReservationStatus(res, strategy),
        wait: res.isCancelled
            ? res.cancelledAt! - res.madeAt
            : res.isComplete
            ? res.completeAt! - res.madeAt
            : now - res.madeAt

    })) || [];

    return <View>
        <Tabs value={tab} onValueChange={(t) => dispatch({ type: AdminActionType.SET_TAB, tab: t as any })}>
            <View className="sticky top-0 p-4 bg-zinc-950 border-b">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="drivers">Drivers</TabsTrigger>
                  <TabsTrigger value="reservations">Reservations</TabsTrigger>
                </TabsList>
            </View>
            <TabsContent value="drivers">
                <ManageDrivers />
            </TabsContent>
            <TabsContent value="reservations">
                <DataTable columns={columns} data={data} />
            </TabsContent>
        </Tabs>
    </View>
}
