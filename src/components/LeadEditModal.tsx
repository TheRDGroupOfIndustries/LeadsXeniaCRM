"use client";

import React, { useState, useEffect } from "react";
import { X, UserPen, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  tag: string;
  status: string;
  source: string;
  notes?: string;
  duration?: number;
  amount?: number | null;
  leadsCreatedDate?: string;
  leadsUpdatedDates?: string;
}

interface LeadsEditModalProps {
  leadId: string;
  onClose: () => void;
  onLeadUpdated: () => void;
}

const STATUS_OPTIONS = [
  "PENDING",
  "FOLLOW_UP",
  "CONVERTED",
  "REJECTED",
  "HOT",
  "WARM",
  "COLD",
  "QUALIFIED",
  "DISQUALIFIED",
];

const LeadsEditModal: React.FC<LeadsEditModalProps> = ({
  leadId,
  onClose,
  onLeadUpdated,
}) => {
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    tag: "DISQUALIFIED",
    status: "PENDING",
    source: "",
    notes: "",
    duration: 0,
    amount: null,
    leadsCreatedDate: "",
    leadsUpdatedDates: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // ✅ Fetch lead details
  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data[0]) throw new Error("Failed to load lead details");
      const lead = data[0];

      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        company: lead.company || "",
        tag: lead.tag || "DISQUALIFIED",
        status: lead.status || "PENDING",
        source: lead.source || "",
        notes: lead.notes || "",
        duration: lead.duration || 0,
        amount: lead.amount || null,
        leadsCreatedDate: lead.leadsCreatedDate ? lead.leadsCreatedDate.split('T')[0] : "",
        leadsUpdatedDates: lead.leadsUpdatedDates ? lead.leadsUpdatedDates.split('T')[0] : "",
      });
    } catch (err: any) {
      toast.error("❌ Failed to fetch lead data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {

    fetchLead();
  }, [leadId]);

  const handleChange = (field: keyof LeadFormData, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("⚠️ Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update lead");

      toast.success("✅ Lead updated successfully!");
      onLeadUpdated();
      onClose();
    } catch (err: any) {
      console.error("Error updating lead:", err);
      toast.error(`❌ ${err.message || "Update failed"}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="bg-black text-white rounded-xl p-8 flex flex-col items-center justify-center shadow-xl border border-gray-800">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-200 mb-3" />
          <p className="text-sm text-zinc-400">Loading lead data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative bg-black text-zinc-100 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.6)] w-full max-w-2xl border border-zinc-800 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <UserPen className="w-5 h-5 text-zinc-300" />
            <h2 className="text-xl font-semibold tracking-tight text-white">Edit Lead</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-zinc-400 hover:text-white" />
          </Button>
        </div>

        {/* Form - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Left Side - All fields in single column on mobile, 2 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400">Full Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                placeholder="Email"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">Phone *</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                placeholder="Phone number"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">Company</label>
              <Input
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                placeholder="Company"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-4">
            {/* ✅ Status Dropdown - Combined with Tag options */}
            <div className="relative">
              <label className="text-sm text-zinc-400">Status</label>
              <button
                type="button"
                onClick={() => setStatusOpen(!statusOpen)}
                className="w-full flex justify-between items-center bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm hover:bg-zinc-800"
              >
                {formData.status === "FOLLOW_UP" ? "Follow Up" : formData.status || "PENDING"}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${statusOpen ? "rotate-180" : ""}`}
                />
              </button>
              {statusOpen && (
                <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 shadow-lg z-50 max-h-60 overflow-y-auto">
                  {STATUS_OPTIONS.map((status) => (
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
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          status === 'PENDING' ? 'bg-blue-400' :
                          status === 'FOLLOW_UP' ? 'bg-orange-400' :
                          status === 'CONVERTED' ? 'bg-green-400' :
                          status === 'REJECTED' ? 'bg-red-400' :
                          status === 'HOT' ? 'bg-red-500' :
                          status === 'WARM' ? 'bg-yellow-400' :
                          status === 'COLD' ? 'bg-cyan-400' :
                          status === 'QUALIFIED' ? 'bg-emerald-400' :
                          'bg-gray-400'
                        }`}></span>
                        {status === "FOLLOW_UP" ? "Follow Up" : status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-zinc-400">Source</label>
              <Input
                value={formData.source}
                onChange={(e) => handleChange("source", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                placeholder="Source"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">Duration (Days)</label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => handleChange("duration", Number(e.target.value))}
                className="bg-zinc-900 border-zinc-700 text-zinc-100"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-2 focus:ring-zinc-600 resize-none h-24 px-3 py-2 placeholder:text-zinc-500"
                placeholder="Enter notes..."
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">Amount (₹)</label>
              <Input
                type="number"
                value={formData.amount || ""}
                onChange={(e) => handleChange("amount", e.target.value ? Number(e.target.value) : null)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">Created Date</label>
              <Input
                type="date"
                value={formData.leadsCreatedDate}
                onChange={(e) => handleChange("leadsCreatedDate", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">Updated Date</label>
              <Input
                type="date"
                value={formData.leadsUpdatedDates}
                onChange={(e) => handleChange("leadsUpdatedDates", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
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
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeadsEditModal;
