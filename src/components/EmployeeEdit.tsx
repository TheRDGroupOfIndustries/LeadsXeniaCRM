"use client";

import React, { useState, useEffect } from "react";
import { X, UserPen, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface UserData {
  id: string;
  name: string;
  email?: string;
  role?: string;
  subscription?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EditEmployeeProps {
  user: UserData;
  open: boolean;
  close: () => void;
  onUpdated?: () => void;
}

const EditEmployee: React.FC<EditEmployeeProps> = ({
  user,
  open,
  close,
  onUpdated,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    subscription: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);

  // ✅ Fetch and prefill user details
  useEffect(() => {
    if (!user?.id) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/auth/user/${user.id}`, { cache: "no-store" });
        const data = await res.json();

        if (!res.ok || !data) throw new Error("Failed to load user details");

        setFormData({
          name: data.name || "",
          email: data.email || "",
          role: data.role || "",
          subscription: data.subscription || "FREE",
        });
      } catch (err: any) {
        toast.error("❌ Failed to fetch user data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [user]);

  // ✅ Handle change
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Save (PUT)
  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error("⚠️ Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/auth/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData), // ✅ only valid fields
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");

      toast.success("✅ Employee updated successfully!");
      onUpdated?.();
      close();
    } catch (err: any) {
      console.error("Error updating user:", err);
      toast.error(`❌ ${err.message || "Update failed"}`);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-zinc-900 rounded-xl p-8 flex flex-col items-center justify-center shadow-xl border border-zinc-700">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-200 mb-3" />
          <p className="text-sm text-zinc-400">Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="relative bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.6)] w-full max-w-2xl border border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-800/60 to-transparent">
          <div className="flex items-center gap-2">
            <UserPen className="w-5 h-5 text-zinc-300" />
            <h2 className="text-xl font-semibold tracking-tight text-white">Edit Employee</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={close}>
            <X className="w-5 h-5 text-zinc-400 hover:text-white" />
          </Button>
        </div>

        {/* Form */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side */}
          <div className="space-y-4">
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
          </div>

          {/* Right Side */}
          <div className="space-y-4">
            {/* Role Dropdown */}
            <div className="relative">
              <label className="text-sm text-zinc-400">Role</label>
              <button
                type="button"
                onClick={() => setRoleOpen(!roleOpen)}
                className="w-full flex justify-between items-center bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm hover:bg-zinc-800"
              >
                {formData.role ? formData.role.toUpperCase() : "Select Role"}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${roleOpen ? "rotate-180" : ""}`}
                />
              </button>
              {roleOpen && (
                <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 shadow-lg z-50">
                  {["ADMIN", "EMPLOYEE"].map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        handleChange("role", role);
                        setRoleOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 ${
                        formData.role === role ? "text-white bg-zinc-800 font-semibold" : "text-zinc-200"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subscription Dropdown */}
            <div className="relative">
              <label className="text-sm text-zinc-400">Subscription</label>
              <button
                type="button"
                onClick={() => setSubOpen(!subOpen)}
                className="w-full flex justify-between items-center bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm hover:bg-zinc-800"
              >
                {formData.subscription ? formData.subscription.toUpperCase() : "Select Subscription"}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${subOpen ? "rotate-180" : ""}`}
                />
              </button>
              {subOpen && (
                <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 shadow-lg z-50">
                  {["FREE", "PREMIUM"].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        handleChange("subscription", sub);
                        setSubOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 ${
                        formData.subscription === sub ? "text-white bg-zinc-800 font-semibold" : "text-zinc-200"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-zinc-800 bg-gradient-to-r from-transparent to-zinc-900/60">
          <Button
            variant="outline"
            onClick={close}
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

export default EditEmployee;
