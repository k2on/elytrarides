import { createContext } from "react";
import { StateRide, Action } from "@/shared";

export const ContextRide = createContext<StateRide | null>(null);
export const ContextRideDispatch =
    createContext<React.Dispatch<Action> | null>(null);
