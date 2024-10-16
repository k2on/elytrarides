import { Row } from "@tanstack/react-table";
import { createContext } from "react";
import { Member, Role } from "./columns";

interface CreatingGroup {
    label: string;
    phones: string[];
}

export interface ManageMembersState {
    idOrg: string;
    removePhones: string[];
    creatingGroup: CreatingGroup | null;
    addRole: (row: Row<Member>, role: Role) => void;
    removeRole: (row: Row<Member>, role: Role) => void;
    // showNewGroup: (isOpen: boolean) => void;
}

export enum ManageMembersActionType {
    RESET_REMOVE,
    SET_REMOVE,
    SET_SHOW_NEW_GROUP,
}

export type ManageMembersAction =
    ManageMembersActionResetRemove
    | ManageMembersActionSetRemove
    | ManageMembersActionSetShowNewGroup;

interface ManageMembersActionResetRemove {
    type: ManageMembersActionType.RESET_REMOVE;
}

interface ManageMembersActionSetRemove {
    type: ManageMembersActionType.SET_REMOVE;
    phones: string[];
}

interface ManageMembersActionSetShowNewGroup {
    type: ManageMembersActionType.SET_SHOW_NEW_GROUP;
    creatingGroup: CreatingGroup | null;
}

export function reducer(state: ManageMembersState, action: ManageMembersAction): ManageMembersState {
    switch (action.type) {
        case ManageMembersActionType.RESET_REMOVE:
            return {...state, removePhones: [] }
        case ManageMembersActionType.SET_REMOVE:
            return {...state, removePhones: action.phones }
        case ManageMembersActionType.SET_SHOW_NEW_GROUP:
            return {...state, creatingGroup: action.creatingGroup }
    }
}

export const ContextManageMembers = createContext<ManageMembersState | null>(null);
export const ContextManageMembersDispatch =
    createContext<React.Dispatch<ManageMembersAction> | null>(null);



