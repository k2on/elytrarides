"use client"

export const STORE_KEY_USER_TOKEN = "user-token";

function cookie_get(cname: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    let name = cname + "=";
    let decodedCookie = decodeURIComponent((document as any).cookie);
    let ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return undefined;
}

export const auth_token_get = () => cookie_get(STORE_KEY_USER_TOKEN);

function cookie_set(cname: string, cvalue: string, exdays: number) {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    let expires = "expires=" + d.toUTCString();
    (document as any).cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export const auth_token_set = (val: string) =>
    cookie_set(STORE_KEY_USER_TOKEN, val, 365);

function cookie_delete(cname: string) {
    if (typeof document === "undefined") return undefined;
    let expires = "expires=Thu, 01 Jan 1970 00:00:00 UTC";
    (document as any).cookie = cname + "=; " + expires + ";path=/";
}

export const auth_token_remove = () => cookie_delete(STORE_KEY_USER_TOKEN);
