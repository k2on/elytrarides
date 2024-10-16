import { createContext } from "react";

export interface OpState {
    updateOrgId: string | null;
}

export enum OpActionType {
    UPDATE_ORG_ID,
}

export type OpAction =
    OpActionUpdateOrg;

interface OpActionUpdateOrg {
    type: OpActionType.UPDATE_ORG_ID;
    id: string | null;
}

export function reducer(state: OpState, action: OpAction): OpState {
    switch (action.type) {
        case OpActionType.UPDATE_ORG_ID:
            return {...state, updateOrgId: action.id }
    }
}

export const ContextOp = createContext<OpState | null>(null);
export const ContextOpDispatch =
    createContext<React.Dispatch<OpAction> | null>(null);



