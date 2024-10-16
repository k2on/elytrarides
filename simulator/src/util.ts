export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function makeRequest<T, V>(url: string, document: string, token?: string) {
    return async (variables: V) => {
        const resp = await fetch(url, {
            method: "POST",
            body: JSON.stringify({
                query: document,
                variables,
            }),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: token || "",
            },
        });
        const json = await resp.json();
        if (json.errors) {
            console.log(json.errors);
            throw Error(json.errors);
        }
        return json.data as T;
    }
}

export function now(): number {
    return Math.floor(new Date().getTime() / 1000);

}
