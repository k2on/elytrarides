import { createContext } from "react";

export interface StateDebug {
    debugTZ: boolean;
}

export enum ActionTypeDebug {
    UPDATE_DEBUG_TZ,
}

export type ActionDebug =
    ActionDebugUpdateTZ;

interface ActionDebugUpdateTZ {
    type: ActionTypeDebug.UPDATE_DEBUG_TZ;
    val: boolean;
}

export function reducer(state: StateDebug, action: ActionDebug): StateDebug {
    switch (action.type) {
        case ActionTypeDebug.UPDATE_DEBUG_TZ:
            return {...state, debugTZ: action.val }
    }
}

export const ContextDebug = createContext<StateDebug | null>(null);
export const ContextDebugDispatch =
    createContext<React.Dispatch<ActionDebug> | null>(null);



