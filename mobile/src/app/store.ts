import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";

export const STORE_KEY_USER_TOKEN = "user-token";

export async function getToken(): Promise<string | undefined> {
    try {
        return (await getItemAsync(STORE_KEY_USER_TOKEN)) || undefined;
    } catch (e) {
        console.error(e);
        console.error("restore failed");
        return undefined;
    }
}

export async function setToken(token: string) {
    await setItemAsync(STORE_KEY_USER_TOKEN, token);
}

export async function removeToken() {
    await deleteItemAsync(STORE_KEY_USER_TOKEN);
}

