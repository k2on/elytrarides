"use client";

import { auth_token_remove } from "@/store";
import { redirect } from "next/navigation";

export default function Signout() {
    auth_token_remove();
    redirect("/");
}
