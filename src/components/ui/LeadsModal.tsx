"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Toggelbtn from "@/components/ui/Toggelbtn";
import { X, Save, Trash2 } from "lucide-react";
import { User, Building, Clock } from "lucide-react";

// --- Lead Interface (Extended for optional fields in form) ---
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string; // Added from parent component context
  stage: string; // Added from parent component context
  tag: string; // Added from parent component context
  value: string; // Added from parent component context
  created: string; // Added from parent component context
  notes?: string;
  Role?: string;
  active?: boolean;
  whatsapp?: boolean;
}

// Data required for adding a lead (excluding auto-generated fields)
type NewLeadData = Omit<Lead, 'id' | 'created' | 'source' | 'stage' | 'tag' | 'value'> & Partial<Lead>;

// --- Props Interface ---
interface Props {
  popup: "add" | "view" | "edit" | "delete" | null;
  lead: Lead | null;
  closePopup: () => void;
  onUpdateLead: (id: string, data: Partial<Lead>) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  // Added onAddLead to props
  onAddLead: (data: NewLeadData) => Promise<void>; 
}

// Initial state for the form, used when adding a new lead
const INITIAL_FORM_STATE: Partial<Lead> = {
  name: "",
  email: "",
  phone: "",
  company: "",
  Role: "",
  active: true, // Default to active for new leads
  whatsapp: false,
};

export default function LeadsModal({
  popup,
  lead,
  closePopup,
  onUpdateLead,
  onDeleteLead,
  onAddLead, // Destructured the new prop
}: Props) {
  const [form, setForm] = useState<Partial<Lead>>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);

  // --- Effect Hook to manage form state based on popup mode ---
  useEffect(() => {
    if (popup === "edit" && lead) {
      // Load existing lead data into form for editing
      setForm({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        Role: lead.Role || "",
        active: lead.active ?? false,
        whatsapp: lead.whatsapp ?? false,
      });
    } else if (popup === "add") {
      // Reset to initial state for adding a new lead
      setForm(INITIAL_FORM_STATE);
    }
  }, [popup, lead]);

 
  if (!popup) return null;


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitch = (name: string, value: boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  
  // --- New Handler for Adding a Lead ---
  const handleAdd = async () => {
    const requiredFields = ['name', 'email', 'phone', 'company'];
    const missingFields = requiredFields.filter(field => !form[field as keyof Partial<Lead>]);

    if (missingFields.length > 0) {
        alert(`Please fill in the required fields: ${missingFields.join(', ')}`);
        return;
    }

    setLoading(true);
    // Cast the form to the required type (excluding auto-generated fields)
    try {
        await onAddLead(form as NewLeadData); 
        closePopup();
    } catch (error) {
        console.error("Error adding lead:", error);
        // Handle error display here
    } finally {
        setLoading(false);
    }
  };

  // --- Existing Handlers (Simplified, assuming lead is present for update/delete) ---

  const handleUpdate = async () => {
    if (!lead) return; // Should not happen in 'edit' mode, but good guard
    setLoading(true);
    try {
        await onUpdateLead(lead.id, form);
        closePopup();
    } catch (error) {
        console.error("Error updating lead:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!lead) return; // Should not happen in 'delete' mode
    setLoading(true);
    try {
        await onDeleteLead(lead.id);
        closePopup();
    } catch (error) {
        console.error("Error deleting lead:", error);
    } finally {
        setLoading(false);
    }
  };
  
  // Guard clause for 'view', 'edit', 'delete' if lead is missing
  if ((popup !== "add") && !lead) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-black text-white rounded-xl w-full max-w-lg shadow-xl animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold capitalize">
            {popup === "add" ? "Add New" : popup} Lead
          </h2>
          <Button variant="ghost" size="icon" onClick={closePopup}>
            <X className="w-5 h-5 text-white" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* ADD MODE */}
          {popup === "add" && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="pl-1 text-sm">Name *</label>
                <Input
                  name="name"
                  value={form.name || ""}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="pl-1 text-sm">Email *</label>
                <Input
                  name="email"
                  value={form.email || ""}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="pl-1 text-sm">Phone *</label>
                <Input
                  name="phone"
                  value={form.phone || ""}
                  onChange={handleChange}
                  placeholder="Enter phone"
                />
              </div>

              {/* Company */}
              <div>
                <label className="pl-1 text-sm">Company *</label>
                <Input
                  name="company"
                  value={form.company || ""}
                  onChange={handleChange}
                  placeholder="Enter company name"
                />
              </div>

              {/* Role */}
              <div>
                <label className="pl-1 text-sm">Role</label>
                <Input
                  name="Role"
                  value={form.Role || ""}
                  onChange={handleChange}
                  placeholder="Employee / Client / Lead"
                />
              </div>

               
            </div>
          )}
          
          {/* VIEW MODE */}
          {popup === "view" && lead && (
            <div className="space-y-6">
              {/* Top User Info */}
              <div className="rounded-lg p-4 border border-gray-700">
                <p>
                  <b>Email:</b> {lead.email}
                </p>
                <p>
                  <b>Name:</b> {lead.name}
                </p>
                <button className={`mt-2 px-3 py-1 rounded-md text-sm ${
                    lead.active ? "border border-green-500 text-green-600" : "border border-red-500 text-red-500"
                }`}>
                  {lead.active ? "Active" : "Inactive"}
                </button>
              </div>

              {/* Personal Info */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-white" />
                  <h1 className="font-semibold text-lg">Personal Info</h1>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>
                    <b>Name:</b> {lead.name}
                  </p>
                  <p>
                    <b>Email:</b> {lead.email}
                  </p>
                  <p>
                    <b>Phone:</b> {lead.phone}
                  </p>
                  <p>
                    <b>Location:</b> Delhi
                  </p>
                </div>
              </div>

              {/* Account Info */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-5 h-5 text-white" />
                  <h1 className="font-semibold text-lg">Account Info</h1>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>
                    <b>User ID:</b> {lead.id}
                  </p>
                  <p>
                    <b>Role:</b> {lead.Role || "—"}
                  </p>
                  <p>
                    <b>Company:</b> {lead.company}
                  </p>
                  <p>
                    <b>WhatsApp:</b> {lead.whatsapp ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-white" />
                  <h1 className="font-semibold text-lg">Account Timeline</h1>
                </div>
              </div>
            </div>
          )}

          {/* EDIT MODE */}
          {popup === "edit" && lead && (
            <>
             
              <label className="pl-1">Role</label>
              <Input
                name="Role"
                value={form.Role || ""}
                onChange={handleChange}
                placeholder="Employee"
                className="mb-4"
              />

              {/* Active Toggle */}
              <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg mb-3 border border-gray-700">
                <div>
                  <h2 className="font-semibold text-sm">Active Status</h2>
                  <p className="text-xs text-gray-400">
                    Enable or disable user
                  </p>
                </div>
                <Toggelbtn
                  checked={form.active ?? false}
                  onCheckedChange={(v) => handleSwitch("active", v)}
                />
              </div>

              {/* WhatsApp Toggle */}
              <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div>
                  <h2 className="font-semibold text-sm">WhatsApp Alerts</h2>
                  <p className="text-xs text-gray-400">Send WhatsApp updates</p>
                </div>
                <Toggelbtn
                  checked={form.whatsapp ?? false}
                  onCheckedChange={(v) => handleSwitch("whatsapp", v)}
                />
              </div>
            </>
          )}

          {/* DELETE MODE */}
          {popup === "delete" && lead && (
            <p className="text-center text-red-500">
              Are you sure you want to delete <b>{lead.name}</b>?
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
          {popup === "view" && <Button onClick={closePopup}>Close</Button>}

          {popup === "edit" && (
            <Button onClick={handleUpdate} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save"}
            </Button>
          )}

          {popup === "delete" && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {loading ? "Deleting..." : "Delete"}
            </Button>
          )}
          
          {/* Corrected logic to call handleAdd */}
          {popup === "add" && (
            <Button 
                onClick={handleAdd} 
                disabled={loading || !form.name || !form.email || !form.phone || !form.company}
                className="bg-green-600 hover:bg-green-700" // Added a distinct color for adding
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Adding..." : "Add Lead"}
            </Button>
          )}

          <Button variant="outline" onClick={closePopup}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}