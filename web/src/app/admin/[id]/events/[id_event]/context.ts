import { createContext } from "react";
import { AdminState } from "./types";
import { AdminAction } from "./actions";

export const ContextAdmin = createContext<AdminState | null>(null);
export const ContextAdminDispatch =
    createContext<React.Dispatch<AdminAction> | null>(null);

