import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
    const json = await req.json() as { id_event: string };
    const { id_event } = json;
    revalidateTag('event-' + id_event);
    return "ok";
}

