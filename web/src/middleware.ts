import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    if (request.cookies.has("user-token")) return;

    const isProduction = process.env.NODE_ENV === 'production';

    const path = new URL(request.url).pathname;
    const host = isProduction ? 'elytra.to' : 'localhost:3000'; 
    const protocol = isProduction ? 'https://' : 'http://';
    const baseURL = protocol + host;

    const fullUrl = `${baseURL}${path}`;

    const url = `${baseURL}/auth?r=${fullUrl}`;

    return NextResponse.redirect(url);
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ["/:path/ride", "/admin/:path*", "/i/:path*", "/account"],
};
