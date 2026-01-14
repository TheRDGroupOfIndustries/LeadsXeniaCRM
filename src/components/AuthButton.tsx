"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthButtonProps {
  collapsed?: boolean;
}

export default function AuthButton({ collapsed = false }: AuthButtonProps) {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  if (collapsed) {
    return (
      <div className="mt-auto p-1 border-t border-border">
        <div className="flex justify-center">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => signOut()}
            className="p-2 text-muted-foreground hover:text-destructive group relative"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Sign Out
            </div>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-auto p-3 border-t border-border">
      <div className="flex justify-center">
        <Button
          variant="ghost" 
          size="sm"
          onClick={() => signOut()}
          className="flex items-center gap-2 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}