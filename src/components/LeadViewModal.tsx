"use client";

import React from "react";
import { X, Mail, Phone, Building2, CalendarDays, Globe, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  stage: string;
  tag: string;
  value: string;
  created: string;
}

interface LeadViewModalProps {
  lead: Lead;
  closePopup: () => void;
}

const LeadViewModal: React.FC<LeadViewModalProps> = ({ lead, closePopup }) => {
  const getTagColor = (tag: string) => {
    const lower = tag.toLowerCase();
    if (lower === "hot") return "border-red-700/60 bg-red-900/30 text-red-400";
    if (lower === "warm") return "border-yellow-700/60 bg-yellow-900/30 text-yellow-400";
    return "border-blue-700/60 bg-blue-900/30 text-blue-400";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.6)] w-full max-w-2xl border border-zinc-800 overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-800/60 to-transparent">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Lead Overview</h2>
            <p className="text-sm text-zinc-400">Detailed information about this lead</p>
          </div>
          <Button variant="ghost" size="icon" onClick={closePopup}>
            <X className="w-5 h-5 text-zinc-400 hover:text-white" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Section */}
          <div className="space-y-4">
            {/* Name */}
            <div className="flex items-center gap-3">
              <UserCircle className="w-5 h-5 text-zinc-300" />
              <div>
                <p className="text-sm text-zinc-400">Name</p>
                <p className="font-medium text-lg text-white">{lead.name}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-zinc-300" />
              <div>
                <p className="text-sm text-zinc-400">Email</p>
                <p className="font-medium break-all text-zinc-100">{lead.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-zinc-300" />
              <div>
                <p className="text-sm text-zinc-400">Phone</p>
                <p className="font-medium text-zinc-100">{lead.phone || "—"}</p>
              </div>
            </div>

            {/* Company */}
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-zinc-300" />
              <div>
                <p className="text-sm text-zinc-400">Company</p>
                <p className="font-medium text-zinc-100">{lead.company || "—"}</p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="space-y-4">
            {/* Source */}
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-zinc-300" />
              <div>
                <p className="text-sm text-zinc-400">Source</p>
                <p className="font-medium text-zinc-100">{lead.source || "—"}</p>
              </div>
            </div>

            {/* Created */}
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-zinc-300" />
              <div>
                <p className="text-sm text-zinc-400">Created</p>
                <p className="font-medium text-zinc-200">
                  {new Date(lead.created).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Stage */}
            {/* <div>
              <p className="text-sm text-zinc-400 mb-1">Stage</p>
              <Badge
                variant="outline"
                className="border-zinc-700 bg-zinc-900/60 px-3 py-1 text-sm text-zinc-200 capitalize"
              >
                {lead.stage || "—"}
              </Badge>
            </div> */}

            {/* Tag */}
            <div>
              <p className="text-sm text-zinc-400 mb-1">Tag</p>
              <Badge
                variant="outline"
                className={`${getTagColor(lead.tag)} px-3 py-1 text-sm capitalize`}
              >
                {lead.tag}
              </Badge>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-zinc-800 bg-gradient-to-r from-transparent to-zinc-900/60">
          <Button
            onClick={closePopup}
            className="bg-zinc-100 text-black hover:bg-zinc-300"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeadViewModal;
