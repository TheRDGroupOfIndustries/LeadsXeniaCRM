"use client";

import React, { useState } from "react";
import { X, Loader2, ChevronDown, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface CreateUserProps {
  open: boolean;
  close: () => void;
  onCreated?: () => void; // 👈 This triggers reload after success
}

const ROLE_OPTIONS = ["ADMIN", "EMPLOYEE", "OTHER"];
const SUBSCRIPTION_OPTIONS = ["FREE", "PREMIUM"];

const CreateUser: React.FC<CreateUserProps> = ({ open, close, onCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    subscription: "FREE",
  });

  const [saving, setSaving] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("⚠️ Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      toast.success("✅ User created successfully!");
      onCreated?.(); // 👈 Auto-refresh user list after creation
      close(); // Close modal
    } catch (err: any) {
      console.error("Error creating user:", err);
      toast.error(`❌ ${err.message || "Something went wrong"}`);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="relative bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.6)] w-full max-w-xl border border-zinc-800 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-800/60 to-transparent">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-zinc-300" />
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Create New User
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={close}>
            <X className="w-5 h-5 text-zinc-400 hover:text-white" />
          </Button>
        </div>

        {/* Form */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400">Full Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                placeholder="Enter name"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">Password *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                placeholder="Enter password"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="space-y-4">
            {/* Role Dropdown */}
            <div className="relative">
              <label className="text-sm text-zinc-400">Role</label>
              <button
                type="button"
                onClick={() => setRoleOpen(!roleOpen)}
                className="w-full flex justify-between items-center bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm hover:bg-zinc-800"
              >
                {formData.role.toUpperCase()}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    roleOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {roleOpen && (
                <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 shadow-lg z-50">
                  {ROLE_OPTIONS.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        handleChange("role", role);
                        setRoleOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 ${
                        formData.role === role
                          ? "text-white font-semibold bg-zinc-800"
                          : "text-zinc-200"
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
                {formData.subscription.toUpperCase()}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    subOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {subOpen && (
                <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 shadow-lg z-50">
                  {SUBSCRIPTION_OPTIONS.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        handleChange("subscription", sub);
                        setSubOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 ${
                        formData.subscription === sub
                          ? "text-white font-semibold"
                          : "text-zinc-300"
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
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
              </>
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateUser;
