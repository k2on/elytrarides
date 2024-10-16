import { GraphQLClient } from "@/shared";
import { auth_token_get } from "./store";
import { URL_GRAPHQL } from "./const";

const requestHeaders = {
    Authorization: auth_token_get() || "",
};
const client = new GraphQLClient(URL_GRAPHQL, {
    headers: requestHeaders,
});
export default client;
