import { sleep, makeRequest, now } from "./util"
import { AcceptMutation, AcceptMutationVariables, AcceptReservationDocument, ConfirmDropoffDocument, ConfirmDropoffMutation, ConfirmDropoffMutationVariables, ConfirmPickupDocument, ConfirmPickupMutation, ConfirmPickupMutationVariables, DriverPingDocument, DriverPingMutation, DriverPingMutationVariables, GetAdminEventDocument, GetAdminEventQuery, GetAdminEventQueryVariables, GetAvaliableReservationDocument, GetAvaliableReservationQuery, GetAvaliableReservationQueryVariables, LatLng, UpdateAccountDocument, UpdateAccountMutation, UpdateAccountMutationVariables, UpdateEventDriverDocument, UpdateEventDriverMutation, UpdateEventDriverMutationVariables, UpdateEventMutationVariables, VerifyOtpDocument, VerifyOtpMutation, VerifyOtpMutationVariables } from "./generated";
import { createDrivers } from "./init";
import { DriverCtx, Simulation } from "./types";
import { Geo } from "./geo";



export async function simulateDriver(simulation: Simulation, geo: Geo, ctx: DriverCtx) {
    const ping = makeRequest<DriverPingMutation, DriverPingMutationVariables>(simulation.url, DriverPingDocument, ctx.driver.token);
    const getAvaliable = makeRequest<GetAvaliableReservationQuery, GetAvaliableReservationQueryVariables>(simulation.url, GetAvaliableReservationDocument, ctx.driver.token);
    const accept = makeRequest<AcceptMutation, AcceptMutationVariables>(simulation.url, AcceptReservationDocument, ctx.driver.token);
    const pickup = makeRequest<ConfirmPickupMutation, ConfirmPickupMutationVariables>(simulation.url, ConfirmPickupDocument, ctx.driver.token);
    const dropoff = makeRequest<ConfirmDropoffMutation, ConfirmDropoffMutationVariables>(simulation.url, ConfirmDropoffDocument, ctx.driver.token);

    const getLocation = (dest: NonNullable<DriverPingMutation["drivers"]["ping"]["dest"]>) => {
        return dest.__typename == "DriverStopEstimationReservation"
            ? dest.location.coords
            : { lat: simulation.event.location!.locationLat, lng: simulation.event.location!.locationLng };
    }

    let last: LatLng | null = null;

    const getPoint = () => {
        if (ctx.path == null || ctx.path.length == 0) return null;
        let point: LatLng | null = null;
        for (let i = 0; i < simulation.driverSpeed; i++) {
            point = ctx.path.shift()!;
        }
        return point!;

    }

    while (true) {
        console.log("Driver Ping " + ctx.driver.idDriver)

        const point = getPoint();

        const location = point ?? {
            lat: simulation.event.location!.locationLat,
            lng: simulation.event.location!.locationLng,
        };

        const respPing = await ping({
            idEvent: simulation.idEvent,
            idDriver: ctx.driver.idDriver,
            location,
        });

        if (!respPing.drivers.ping.dest) {
            const resp = await getAvaliable({ id: simulation.idEvent, idDriver: ctx.driver.idDriver });
            const res = resp.events.get.avaliableReservation;
            if (res) {
                console.log(`Accepting reservation ${res.id}`);
                try {
                    console.log(`Accepted for driver ${ctx.driver.idDriver}`);
                    const respAccept = await accept({ idDriver: ctx.driver.idDriver, idReservation: res.id });
                    ctx.dest = respAccept.drivers.acceptReservation.dest;
                    if (ctx.dest && last) {
                        ctx.path = await geo.get(last, getLocation(ctx.dest));
                    }
                } catch {
                    console.error("Could not accept reservation");
                }
            }
        } else {
            console.log("Has res", respPing.drivers.ping.dest);
            if (ctx.path == null) {
                if (last) {
                    const dest = getLocation(respPing.drivers.ping.dest);
                    const path = await geo.get(last, dest);
                    ctx.path = path;
                }
            } else if (ctx.path.length == 0) {

                const destIsReservationAndReservationIsPickup = respPing.drivers.ping.dest.__typename == "DriverStopEstimationReservation" && !respPing.drivers.ping.dest.isDropoff;
                const destIsEventAndReservationIsDropoff = respPing.drivers.ping.dest.__typename == "DriverStopEstimationEvent" && respPing.drivers.ping.queue.length > 0;
                const shouldPickup = destIsReservationAndReservationIsPickup || destIsEventAndReservationIsDropoff;
                if (shouldPickup) {
                    console.log("Picking up...")
                    const respPickup = await pickup({ idEvent: simulation.idEvent, idDriver: ctx.driver.idDriver });
                    console.log("Picked up")

                    if (respPickup.drivers.confirmPickup.dest) {
                        const dest = getLocation(respPickup.drivers.confirmPickup.dest);
                        if (last) {
                            ctx.path = await geo.get(last, dest);
                        }
                    }
                } else {
                    console.log("Dropping off...")
                    const respDropoff = await dropoff({ idEvent: simulation.idEvent, idDriver: ctx.driver.idDriver });
                    console.log("Dropped off")

                    const newDest = respDropoff.drivers.confirmDropoff.dest || { __typename: "DriverStopEstimationEvent", arrival: 10 };
                    const dest = getLocation(newDest);
                    if (last) {
                        ctx.path = await geo.get(last, dest);
                    }
                }

            }

        }




        last = location;


        await sleep(1000);
    }
    // await simulateDriver(simulation, geo, ctx);
}


