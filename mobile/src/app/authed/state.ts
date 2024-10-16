import { Action, StateRide } from "@/shared";
import { createContext } from "react";

export const ContextRide = createContext<StateRide | null>(null);
export const ContextRideDispatch =
    createContext<React.Dispatch<Action> | null>(null);

