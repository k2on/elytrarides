import { SubscriptionClient } from "subscriptions-transport-ws";
import { URL_GRAPHQL_WS } from "./const";


const makeWSClient = () => new SubscriptionClient(URL_GRAPHQL_WS, {
    reconnect: true
});

export default makeWSClient;

