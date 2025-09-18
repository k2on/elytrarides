const NET_IP = "";
const USE_LOCAL_HOST = true;
const LOCAL_IP = USE_LOCAL_HOST ? "127.0.0.1" : NET_IP;

export const URL_UPLOAD = process.env.NODE_ENV === "production" ? "https://api.elytra.to/upload/" : `http://${LOCAL_IP}:8080/upload/`
export const URL_GRAPHQL = process.env.NODE_ENV === "production" ? "https://api.elytra.to/graphql" : `http://${LOCAL_IP}:8080/graphql`
// export const URL_GRAPHQL = process.env.NODE_ENV === "production" ? "https://api.elytra.to/graphql" : "http://192.168.0.166:8080/graphql"
// export const URL_GRAPHQL_WS = process.env.NODE_ENV === "production" ? "wss://api.elytra.to/subscriptions" : "ws://localhost:8080/subscriptions"
export const URL_GRAPHQL_WS = process.env.NODE_ENV === "production" ? "wss://api.elytra.to/subscriptions" : `ws://${LOCAL_IP}:8080/subscriptions`

export const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export const COLOR_PURPLE_500 = "#a855f7";
export const COLOR_GRAY_200 = "#e5e7eb";
export const COLOR_GRAY_500 = "#6b7280";

export const ANONYMOUS_PROFILE_IMAGE = "https://imgur.com/BhtDVgO.jpg";

export const MAX_DRIVER_RATING = 5;

// DO NOT CHANGE THE ORDER OF THIS
//
// Cancel Reasons are stored as ints in the DB
export enum CancelReason {
    LONG_WAIT,
    ALREADY_GOT_RIDE,
    DONT_WANT_TO_GO,
    OTHER,
    // <-- add new reasons here
}
export const CANCEL_REASONS: Map<CancelReason, string> = new Map([
    [CancelReason.LONG_WAIT, "Long Wait Time"],
    [CancelReason.ALREADY_GOT_RIDE, "Already Got a Ride"],
    [CancelReason.DONT_WANT_TO_GO, "Don't Want to Go Anymore"],
    [CancelReason.OTHER, "Other"],
]);
