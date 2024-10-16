"use client"

import { useReducer } from "react";
import { ContextDebug, ContextDebugDispatch, StateDebug, reducer } from "./state";
import { presist } from "@/lib";

const STORAGE_KEY = "debug_state";
const INITIAL: StateDebug = {
    debugTZ: false,
}

export default function({ children }: { children: React.ReactNode }) {

    const loadState = () => {
        try {
            const serializedState = localStorage.getItem(STORAGE_KEY);
            if (serializedState === null) {
                return INITIAL;
            }
            return JSON.parse(serializedState);
        } catch (err) {
            return INITIAL;
        }
    };


    const [state, dispatch] = useReducer(presist(reducer, STORAGE_KEY), loadState());

    return <ContextDebug.Provider value={state}>
        <ContextDebugDispatch.Provider value={dispatch}>{children}</ContextDebugDispatch.Provider>
    </ContextDebug.Provider>;

}
