"use client";

import React, { useState } from "react";
import { X, UserPlus, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface AddEmployeeModalProps {
  open: boolean;
  close: () => void;
  onCreated?: () => void;
}

const ROLE_OPTIONS = ["ADMIN", "EMPLOYEE"];
const SUBSCRIPTION_OPTIONS = ["FREE", "PREMIUM"];

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ open, close, onCreated }) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          subscription: formData.subscription,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      toast.success("User created successfully!");
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "EMPLOYEE",
        subscription: "FREE",
      });
      close();
      if (onCreated) onCreated();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-black text-white p-6 rounded-lg max-w-2xl w-full mx-4 border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New User
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={close}
            className="h-8 w-8 p-0 hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Side */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Full Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                  placeholder="Email address"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">Password *</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                  placeholder="Password"
                  required
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="space-y-4">
              {/* Role Dropdown */}
              <div className="relative">
                <label className="text-sm text-gray-400">Role</label>
                <button
                  type="button"
                  onClick={() => setRoleOpen(!roleOpen)}
                  className="w-full flex justify-between items-center bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm hover:bg-zinc-800"
                >
                  {formData.role}
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
                        type="button"
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
                        {role === "EMPLOYEE" ? "User" : role}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subscription Dropdown - Only show for non-admin users */}
              {formData.role !== "ADMIN" && (
                <div className="relative">
                  <label className="text-sm text-gray-400">Subscription</label>
                  <button
                    type="button"
                    onClick={() => setSubOpen(!subOpen)}
                    className="w-full flex justify-between items-center bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm hover:bg-zinc-800"
                  >
                    {formData.subscription}
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
                          type="button"
                          onClick={() => {
                            handleChange("subscription", sub);
                            setSubOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 ${
                            formData.subscription === sub
                              ? "text-white font-semibold bg-zinc-800"
                              : "text-zinc-200"
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4">
                <p className="text-xs text-gray-500">
                  * Required fields. The new user will receive login credentials via email.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;