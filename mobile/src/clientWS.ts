import { SubscriptionClient } from "subscriptions-transport-ws";
import { URL_GRAPHQL_SUBSCRIPTION } from "./app/state";

const makeWSClient = () => new SubscriptionClient(URL_GRAPHQL_SUBSCRIPTION, {
    reconnect: true,
});

export default makeWSClient;

