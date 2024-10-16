import client from "@/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarLetters, useGetMeAccountQuery } from "@/shared";

export function AccountAvatar() {
    const { data } = useGetMeAccountQuery(client);
    
    return <Avatar>
        <AvatarImage src={data?.users.me.imageUrl || ""} alt={data?.users.me.name} />
        <AvatarFallback>{getAvatarLetters(data?.users.me.name || "")}</AvatarFallback>
    </Avatar>

}
