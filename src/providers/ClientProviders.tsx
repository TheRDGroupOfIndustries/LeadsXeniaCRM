"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import { SessionProvider, useSession } from "next-auth/react";
import dynamic from "next/dynamic";

// Dynamically import LoginPage to avoid SSR issues
const LoginPage = dynamic(() => import("@/app/login/page"), { ssr: false });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes - less frequent refetching
      gcTime: 15 * 60 * 1000, // 15 minutes cache time
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
      refetchOnReconnect: false, // Don't refetch when reconnecting
      retry: 1, // Only retry once on failure
    },
  },
});

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // If no session, show login page
  if (!session) {
    return <LoginPage />;
  }

  // If session exists, show the app wrapped in Layout
  return <Layout>{children}</Layout>;
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration issues by not rendering providers until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* 
        IMPORTANT: Disable aggressive session polling to prevent page refresh loops
        - refetchInterval: 0 = no automatic polling
        - refetchOnWindowFocus: false = no refetch when window gains focus
        - refetchWhenOffline: false = no refetch when offline
      */}
      <SessionProvider 
        refetchInterval={0} 
        refetchOnWindowFocus={false}
        refetchWhenOffline={false}
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthWrapper>{children}</AuthWrapper>
        </TooltipProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
