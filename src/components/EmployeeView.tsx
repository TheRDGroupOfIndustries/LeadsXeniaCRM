"use client";

import React from "react";
import { X, Mail, CalendarDays, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface UserViewProps {
  user: {
    id: string;
    name: string;
    email?: string | null;
    role: string;
    subscription?: string | null;
    createdAt?: string;
    updatedAt?: string;
    avatar?: string | null;
  };
  close: () => void;
}

const EmployeeView: React.FC<UserViewProps> = ({ user, close }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="relative bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.6)] w-full max-w-2xl border border-zinc-800 overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-800/60 to-transparent">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Employee Details</h2>
            <p className="text-sm text-zinc-400">
              Information for <span className="font-medium text-zinc-200">{user.name}</span>
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={close}>
            <X className="w-5 h-5 text-zinc-400 hover:text-white" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left */}
          <div className="space-y-4">
            {/* Avatar + Name */}
            <div className="flex items-center gap-3">
              <Image
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name
                  )}&background=27272a&color=fff&size=128`
                }
                alt={user.name}
                width={40}
                height={40}
                unoptimized
                className="rounded-full border border-zinc-700 object-cover"
              />
              <div>
                <p className="text-sm text-zinc-400">Full Name</p>
                <p className="font-medium text-lg text-white">{user.name}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-zinc-300" />
              <div>
                <p className="text-sm text-zinc-400">Email</p>
                <p className="font-medium break-all text-zinc-100">
                  {user.email ?? "—"}
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-zinc-300" />
              <div>
                <p className="text-sm text-zinc-400">Role</p>
                <Badge
                  className={`capitalize px-3 py-1 text-sm border ${
                    user.role === "ADMIN"
                      ? "border-red-700/60 bg-red-900/30 text-red-400"
                      : "border-blue-700/60 bg-blue-900/30 text-blue-400"
                  }`}
                >
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">
            {/* Subscription */}
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-zinc-300" />
              <div>
                <p className="text-sm text-zinc-400">Subscription</p>
                <Badge
                  variant="outline"
                  className="capitalize border-zinc-700 bg-zinc-900/60 px-3 py-1 text-sm text-zinc-200"
                >
                  {user.subscription ?? "FREE"}
                </Badge>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-zinc-300" />
              <div>
                <p className="text-sm text-zinc-400">Created On</p>
                <p className="font-medium text-zinc-200">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>

            {/* Updated At */}
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-zinc-300" />
              <div>
                <p className="text-sm text-zinc-400">Last Updated</p>
                <p className="font-medium text-zinc-200">
                  {user.updatedAt
                    ? new Date(user.updatedAt).toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-zinc-800 bg-gradient-to-r from-transparent to-zinc-900/60">
          <Button
            onClick={close}
            className="bg-zinc-100 text-black hover:bg-zinc-300"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeView;40