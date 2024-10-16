import { makeRequest } from "./util";
import {
  GetAdminEventDocument,
  GetAdminEventQuery,
  GetAdminEventQueryVariables,
} from "./generated";
import { createDrivers } from "./init";
import { Simulation } from "./types";
import { Geo } from "./geo";
import { simulateDriver } from "./driver";

const adminToken = "";
const idEvent = "eecdedcf-ca57-4587-a548-04544c87d9ec";

const URL_GRAPHQL = "http://127.0.0.1:8080/graphql";

export const googleMapsApiKey = "";

async function main() {
  const driverCount = 2;

  const getEvent = makeRequest<GetAdminEventQuery, GetAdminEventQueryVariables>(
    URL_GRAPHQL,
    GetAdminEventDocument,
    adminToken
  );
  const event = await getEvent({ id: idEvent });

  const simulation: Simulation = {
    url: URL_GRAPHQL,
    adminToken,
    idEvent,
    event: event.events.get,
    driverSpeed: 2,
  };
  const drivers = await createDrivers(simulation, driverCount);

  const geo = new Geo(googleMapsApiKey);

  await Promise.all(
    drivers.map((d) =>
      simulateDriver(simulation, geo, {
        driver: d,
        dest: null,
        path: null,
      })
    )
  );
}

main();
