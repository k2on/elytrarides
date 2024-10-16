import { AUTH_CODE } from "./const";
import {
  UpdateAccountDocument,
  UpdateAccountMutation,
  UpdateAccountMutationVariables,
  UpdateEventDriverDocument,
  UpdateEventDriverMutation,
  UpdateEventDriverMutationVariables,
  VerifyOtpDocument,
  VerifyOtpMutation,
  VerifyOtpMutationVariables,
} from "./generated";
import { Driver, Rider, Simulation } from "./types";
import { makeRequest, now, sleep } from "./util";

const idVehicle = "9de3aa13-8945-4044-9826-5597101db209";

export async function createDrivers(
  simulation: Simulation,
  driverCount: number
): Promise<Driver[]> {
  const drivers: Driver[] = [];
  const auth = makeRequest<VerifyOtpMutation, VerifyOtpMutationVariables>(
    simulation.url,
    VerifyOtpDocument
  );

  const updateDriver = makeRequest<
    UpdateEventDriverMutation,
    UpdateEventDriverMutationVariables
  >(simulation.url, UpdateEventDriverDocument, simulation.adminToken);

  console.log(`Removing ${simulation.event.drivers.length} old driver(s)`);
  for (const driver of simulation.event.drivers) {
    try {
      await updateDriver({
        phone: driver.phone,
        idEvent: simulation.idEvent,
        form: { obsoleteAt: now() },
      });
    } catch {
      console.log("Could not remove");
    }
  }
  await sleep(1000);
  console.log(`Creating ${driverCount} driver(s)`);

  for (let i = 0; i < driverCount; i++) {
    const phone = `+1000000${i + 1000}`;
    console.log(`Logging in as ${phone}`);

    const respAuth = await auth({ phone, code: AUTH_CODE });
    const token = respAuth.auth.verifyOtp;
    console.log("Authenticated!");

    const setName = makeRequest<
      UpdateAccountMutation,
      UpdateAccountMutationVariables
    >(simulation.url, UpdateAccountDocument, token);

    console.log(`Setting name to 'Driver ${i}'`);
    await setName({ name: `Driver ${i}` });

    console.log(`Updated Name`);

    console.log(`Adding Driver for the event`);
    const resp = await updateDriver({
      phone,
      idEvent: simulation.idEvent,
      form: { idVehicle, obsoleteAt: null },
    });
    const idDriver = resp.orgs.updateEventDriver.id;
    console.log(`Added driver for the event, id: ${idDriver}`);

    drivers.push({
      token,
      idDriver,
    });
  }

  console.log("Drivers created", drivers);
  return drivers;
}

// export async function createRiders(simulation: Simulation, riderCount: number): Promise<Rider> {

// }
