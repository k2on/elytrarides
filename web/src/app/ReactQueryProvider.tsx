"use client";

import { q } from "@/shared";

export const queryClient = new q.QueryClient();

interface ReactQueryProviderProps {
    children: React.ReactNode;
}
export const ReactQueryProvider = ({ children }: ReactQueryProviderProps) => {
    return (
        <q.QueryClientProvider client={queryClient}>
            {children}
        </q.QueryClientProvider>
    );
};
