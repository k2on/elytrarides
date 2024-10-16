import { DEFAULT_IMAGE_URL } from "@/const";

export function getImageId(url?: string | null): string | undefined {
    if (!url) return undefined;
    if (url == DEFAULT_IMAGE_URL) return undefined;
    return url.split("/images/")[1].split(".jpg")[0];
}


