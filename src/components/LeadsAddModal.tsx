"use client";

import React, { useState } from "react";
import { X, UserPlus, Building2, Mail, Phone, StickyNote, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface LeadFormData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  notes?: string;
  tag: string;
  status?: string;
  duration?: number;
  amount?: number | null;
}

interface LeadsAddModalProps {
  onClose: () => void;
  onLeadAdded: () => void;
}

const LeadsAddModal: React.FC<LeadsAddModalProps> = ({ onClose, onLeadAdded }) => {
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    notes: "",
    tag: "DISQUALIFIED",
    status: "PENDING",
    duration: 0,
    amount: null,
  });

  const [loading, setLoading] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const handleChange = (field: keyof LeadFormData, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("⚠️ Please fill in the required name field");
      return;
    }

    setLoading(true);
    try {
      // Convert amount to string for database
      const dataToSend = {
        ...formData,
        amount: formData.amount != null ? String(formData.amount) : null,
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create lead");

      toast.success("✅ Lead added successfully!");
      onLeadAdded();
      onClose();
    } catch (err: any) {
      console.error("Error creating lead:", err);
      toast.error(`❌ ${err.message || "Something went wrong"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative bg-black text-zinc-100 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.6)] w-full max-w-2xl border border-zinc-800 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-zinc-300" />
            <h2 className="text-xl font-semibold tracking-tight text-white">Add New Lead</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-zinc-400 hover:text-white" />
          </Button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm text-zinc-400">Full Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter lead name"
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-zinc-400">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="example@domain.com"
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm text-zinc-400">Phone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+91 98765 43210"
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            {/* Company */}
            <div>
              <label className="text-sm text-zinc-400">Company</label>
              <Input
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
                placeholder="Company Name"
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-4">
            {/* Tag Dropdown */}
            <div className="relative">
              <label className="text-sm text-zinc-400">Tag</label>
              <button
                type="button"
                onClick={() => setTagOpen(!tagOpen)}
                className="w-full flex justify-between items-center bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm hover:bg-zinc-800"
              >
                {formData.tag}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${tagOpen ? "rotate-180" : ""}`}
                />
              </button>
              {tagOpen && (
                <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 shadow-lg z-50">
                  {["HOT", "WARM", "COLD", "QUALIFIED", "DISQUALIFIED"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        handleChange("tag", tag);
                        setTagOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 ${
                        formData.tag === tag ? "text-white font-semibold bg-zinc-800" : "text-zinc-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <label className="text-sm text-zinc-400">Status</label>
              <button
                type="button"
                onClick={() => setStatusOpen(!statusOpen)}
                className="w-full flex justify-between items-center bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm hover:bg-zinc-800"
              >
                {formData.status || "PENDING"}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${statusOpen ? "rotate-180" : ""}`}
                />
              </button>
              {statusOpen && (
                <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 shadow-lg z-50">
                  {["PENDING", "FOLLOW_UP", "CONVERTED", "REJECTED"].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        handleChange("status", status);
                        setStatusOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 ${
                        formData.status === status ? "text-white font-semibold bg-zinc-800" : "text-zinc-200"
                      }`}
                    >
                      {status === "FOLLOW_UP" ? "Follow Up" : status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Source */}
            <div>
              <label className="text-sm text-zinc-400">Source</label>
              <Input
                value={formData.source}
                onChange={(e) => handleChange("source", e.target.value)}
                placeholder="Website / Referral / Ads"
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm text-zinc-400">Duration (Days)</label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => handleChange("duration", Number(e.target.value))}
                placeholder="e.g., 30"
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm text-zinc-400">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-2 focus:ring-zinc-600 resize-none h-24 px-3 py-2 placeholder:text-zinc-500"
                placeholder="Enter additional notes..."
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm text-zinc-400">Amount (₹)</label>
              <Input
                type="number"
                value={formData.amount || ""}
                onChange={(e) => handleChange("amount", e.target.value ? Number(e.target.value) : null)}
                placeholder="0.00"
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

          </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex justify-end gap-3 p-5 border-t border-zinc-800 bg-zinc-900 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            className="bg-zinc-100 text-black hover:bg-zinc-300"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Lead"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeadsAddModal;
