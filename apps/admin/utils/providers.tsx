"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import AuthExpiredHandler from "@/components/shared/AuthExpiredHandler";
import { ThemeProvider } from "@/components/providers/NextThemeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                retry: 1,
            },
        },
    }));

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <QueryClientProvider client={queryClient}>
                <AuthExpiredHandler>
                    {children}
                </AuthExpiredHandler>
            </QueryClientProvider>
        </ThemeProvider>
    );
}
