import "./globals.css";
import { Inter } from "next/font/google";
import { ReactQueryProvider } from "./ReactQueryProvider";
import { ReactQueryDevtools } from "@/shared";
import Script from "next/script";
import 'react-loading-skeleton/dist/skeleton.css'
import { SkeletonTheme } from "react-loading-skeleton";
import { Toaster } from "@/components/ui/toaster";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Elytra Rides",
    description: "Get a ride to an event",
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ReactQueryProvider>
            <SkeletonTheme baseColor="#202020" highlightColor="#444">
                <html lang="en" className="dark" style={{ height: "-webkit-fill-available" }}>
                    {process.env.NODE_ENV == "production" && (
                    <><Script id="ganalytics" src="https://www.googletagmanager.com/gtag/js?id=G-SQRTJT55VV" />
                    <Script id="ganalytics-config">
                        {`window.dataLayer = window.dataLayer || [];
                          function gtag(){dataLayer.push(arguments);}
                          gtag('js', new Date());

                          gtag('config', 'G-SQRTJT55VV');`}
                    </Script></>)}
                    <body className={inter.className} style={{ height: "-webkit-fill-available" }}>
                        {children}
                        <Toaster />
                        <ReactQueryDevtools />
                    </body>
                </html>
            </SkeletonTheme>
        </ReactQueryProvider>
    );
}
