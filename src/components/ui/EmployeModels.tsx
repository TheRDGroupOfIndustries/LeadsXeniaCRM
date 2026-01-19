"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Eye, SquarePen } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                            Local User Type (Fixed)                         */
/* -------------------------------------------------------------------------- */
export interface UserData {
  id: string;
  name: string;
  email?: string | null;
  role?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*                           Component Props Definition                       */
/* -------------------------------------------------------------------------- */
interface EmployeModelsProps {
  show: boolean;
  action: "view" | "edit" | null;
  user: UserData | null;
  onClose: () => void;
  onUserUpdated: () => void;
}

/* -------------------------------------------------------------------------- */
/*                             Main Component                                 */
/* -------------------------------------------------------------------------- */
const EmployeModels: React.FC<EmployeModelsProps> = ({
  show,
  action,
  user,
  onClose,
  onUserUpdated,
}) => {
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      setFormData({});
    }
  }, [user]);

  if (!show || !user) return null;

  const isView = action === "view";
  const isEdit = action === "edit";

  /* ----------------------------- Form Handlers ----------------------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/auth/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update user");

      onUserUpdated();
      onClose();
    } catch (error: any) {
      alert(error.message || "Error updating user");
    } finally {
      setIsSaving(false);
    }
  };

  /* ----------------------------- Field Renderer ---------------------------- */
  const renderField = (
    label: string,
    key: keyof UserData,
    type: string = "text"
  ) => (
    <div className="flex flex-col mb-3">
      <label className="text-sm font-medium mb-1">{label}</label>
      {isView ? (
        <p className="border rounded p-2 bg-zinc-900 text-zinc-100">
          {user[key] ?? "N/A"}
        </p>
      ) : (
        <input
          type={type}
          name={key}
          value={(formData[key] as string) ?? ""}
          onChange={handleChange}
          className="border border-zinc-700 rounded p-2 text-sm bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          disabled={key === "id" || key === "email"}
        />
      )}
    </div>
  );

  /* ------------------------------- Component UI ---------------------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-950 text-white rounded-xl w-full max-w-md p-6 shadow-xl border border-zinc-800">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {isView ? <Eye className="w-4 h-4" /> : <SquarePen className="w-4 h-4" />}
            {isView ? "View User" : "Edit User"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave}>
          {renderField("Full Name", "name")}
          {renderField("Email", "email", "email")}
          {renderField("Role", "role")}

          {/* Footer */}
          {isEdit && (
            <div className="flex justify-end mt-5">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 bg-zinc-100 text-black px-4 py-2 rounded hover:bg-zinc-300 active:scale-95 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EmployeModels;
