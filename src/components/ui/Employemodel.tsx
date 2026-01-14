"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface EmployeeModelProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    id: string;
    name: string;
    email?: string;
    role: string;
  };
  mode?: "edit" | "view";
  onSave?: (user: { id: string; name: string; email?: string; role: string }) => void;
}

export const Employemodel: React.FC<EmployeeModelProps> = ({
  isOpen,
  onClose,
  user,
  mode = "view",
  onSave,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Employee");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email ?? "");
      setRole(user.role);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "edit" && user && onSave) {
      onSave({ id: user.id, name, email, role });
    }
    onClose();
  };

  if (!isOpen) return null;

  const isView = mode === "view";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
        <button
          className="absolute top-4 right-4 rounded-full p-1 hover:bg-muted"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4">
          {isView ? "View User" : "Edit User"}
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isView}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isView}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Role</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isView}
            >
              <option>Admin</option>
              <option>Employee</option>
              <option>Other</option>
            </select>
          </div>
          {!isView && (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border px-4 py-2 hover:bg-muted"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
              >
                Save
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
