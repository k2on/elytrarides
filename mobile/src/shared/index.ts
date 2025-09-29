const shared = "Ladies and gentleman, the man you've been waiting for...";

import * as q from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { GraphQLClient } from "graphql-request";
import Logo from "./assets/Logo";
const map_style = require("./src/map_style.json");

export * from "./src/generated/graphql";
export * from "./src/const/auth";
export * from "./src/lang/en";
export * from "./src/types";
export * from "./src/map";
export * from "./src/custom";
export { q, ReactQueryDevtools, GraphQLClient, Logo, map_style };

export default shared;
