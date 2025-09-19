import { GraphQLClient } from "@/shared";
import { createContext, useMemo } from "react";
import { removeToken, setToken } from "./store";
import { Platform } from "react-native";

const NET_IP = "192.168.4.22";
const USE_LOCAL_HOST = true;
const LOCAL_IP = USE_LOCAL_HOST ? "127.0.0.1" : NET_IP;

export const URL_PROD = "ride-api.koon.us/";
// export const URL_DEV = "198.21.254.66:8080/";
export const URL_DEV = Platform.OS == "android" ? "10.0.2.2:8080/" : LOCAL_IP + ":8080/";
// export const URL_BASE = process.env.BASE_URL || URL_PROD;
const isProd = false;
export const URL_BASE = isProd ? URL_PROD : URL_DEV;

export const URL_GRAPHQL = (isProd ? "https://" : "http://") + URL_BASE + "graphql";
export const URL_GRAPHQL_SUBSCRIPTION = (isProd ? "wss://" : "ws://") + URL_BASE + "subscriptions";
export const URL_UPLOAD = (isProd ? "https://" : "http://") + URL_BASE + "upload";

export const DEFAULT_STATE_AUTH: AuthState = {
    isLoading: true,
    isSignout: false,
    token: undefined,
    isLoaded: false,
};

export type AuthContextType = {
    signOut: () => void;
    getClient: () => GraphQLClient;
    setToken: (token: string) => Promise<void>;
    getToken: () => string;
    onLoad: () => void;
};

export enum AuthActionKind {
    RESTORE,
    SET,
    REMOVE,
    ON_LOAD,
}

export interface AuthAction {
    type: AuthActionKind;
    token?: string;
}

export interface AuthState {
    isLoading: boolean;
    isSignout: boolean;
    token?: string;
    isLoaded: boolean;
}

export function authReducer(state: AuthState, action: AuthAction): AuthState {
    const { type, token } = action;
    switch (type) {
        case AuthActionKind.RESTORE:
            return {
                ...state,
                token: action.token,
                isLoading: false,
            };
        case AuthActionKind.SET:
            return {
                ...state,
                isSignout: false,
                token: token,
            };
        case AuthActionKind.REMOVE:
            return {
                ...state,
                isSignout: true,
                token: undefined,
            };
        case AuthActionKind.ON_LOAD:
            return {
                ...state,
                isLoaded: true,
            };
        default:
            return state;
    }
}

const getClient = (token: string) =>
    new GraphQLClient(URL_GRAPHQL, {
        headers: { Authorization: token },
    });

export function createAuthContext(
    state: AuthState,
    dispatch: React.Dispatch<AuthAction>,
) {
    return useMemo<AuthContextType>(
        () => ({
            setToken: async (token) => {
                await setToken(token);
                dispatch({ type: AuthActionKind.SET, token });
            },
            signOut: async () => {
                await removeToken();
                dispatch({ type: AuthActionKind.REMOVE });
            },
            getClient: () => getClient(state.token || ""),
            getToken: () => state.token || "",
            onLoad: () => {
                dispatch({ type: AuthActionKind.ON_LOAD })
            }
        }),
        [state],
    );
}

export const AuthContext = createContext<AuthContextType | null>(null);
