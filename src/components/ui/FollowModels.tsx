"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; // Assuming Dialog components are available
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // Assuming Label is available
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// --- Interface Definitions (copied from Page.tsx for self-contained component) ---

interface Lead {
  id: number;
  name: string;
  company: string;
  type: string;
  priority: "Low" | "Medium" | "High";
  scheduled: string;
  time: string;
  status: "Overdue" | "Pending" | "Completed";
  avatar: string;
}

interface FollowModelsProps {
  popup: null | "view" | "edit";
  lead: Lead | null;
  closePopup: () => void;
  onUpdateLead: (leadId: number, data: Partial<Lead>) => Promise<void>;
}

// --- Component Definition ---

const FollowModels: React.FC<FollowModelsProps> = ({
  popup,
  lead,
  closePopup,
  onUpdateLead,
}) => {
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Effect to load lead data into form state when modal opens in 'edit' mode
  useEffect(() => {
    if (lead && popup === "edit") {
      setFormData({
        name: lead.name,
        company: lead.company,
        type: lead.type,
        priority: lead.priority,
        status: lead.status,
      });
    } else if (popup === null) {
       setFormData({});
    }
  }, [lead, popup]);

  if (!lead) return null;  
  const isViewMode = popup === "view";
  const isEditMode = popup === "edit";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: keyof Lead) => (value: string) => {
     setFormData((prev) => ({ ...prev, [field]: value as any })); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !lead.id) return;

    setIsSaving(true);
    try {
      // Only send the fields that were put into formData for the update
      await onUpdateLead(lead.id, formData);
      // Close handled by onUpdateLead in Page.tsx, but we ensure it here too.
    } catch (error) {
      console.error("Failed to update lead:", error);
      // Handle error display here
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for Priority Badge color
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-destructive/20 text-destructive";
      case "Medium":
        return "bg-warning/20 text-warning";
      case "Low":
        return "bg-success/20 text-success";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  // Helper for Status Badge color
  const getStatusClass = (status: string) => {
    switch (status) {
      case "Overdue":
        return "bg-destructive/20 text-destructive";
      case "Pending":
        return "bg-warning/20 text-warning";
      case "Completed":
        return "bg-success/20 text-success";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const renderViewField = (
  label: string,
  value: string | number | React.ReactNode
) => (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {typeof value === 'string' || typeof value === 'number' ? (
        <p className="text-base font-semibold text-foreground">{value}</p>
      ) : (
        value // Render JSX elements (like Badge) directly
      )}
    </div>
  );
  
  const renderEditField = (label: string, id: keyof Lead, type: "text" | "select", options?: string[]) => {
    const currentValue = (formData[id] as string) ?? lead[id];
    
    return (
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
        {type === "text" ? (
          <Input
            id={id as string}
            value={currentValue}
            onChange={handleInputChange}
            className="bg-card border-border"
          />
        ) : (
          <Select onValueChange={handleSelectChange(id)} value={currentValue}>
            <SelectTrigger className="w-full bg-card border-border">
              <SelectValue placeholder={`Select ${label}`} />
            </SelectTrigger>
            <SelectContent className="border-gray-800 bg-black text-white">
              {options?.map((option) => (
                <SelectItem key={option} value={option} className="text-white">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  };

  return (
    <Dialog open={popup !== null} onOpenChange={closePopup}>
      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {isViewMode ? `Lead Details: ${lead.name}` : `Edit Follow-Up: ${lead.name}`}
          </DialogTitle>
        </DialogHeader>

        {/* --- Modal Body Content --- */}
        <div className="py-4 space-y-4">
          {isViewMode && (
            <div className="grid grid-cols-2 gap-4">
              {renderViewField("Contact Name", lead.name)}
              {renderViewField("Company", lead.company)}
              {renderViewField("Activity Type", lead.type)}
              {renderViewField(
                "Priority",
                <Badge variant="secondary" className={getPriorityClass(lead.priority)}>
                  {lead.priority}
                </Badge>
              )}
              {renderViewField("Scheduled Date", lead.scheduled)}
              {renderViewField("Scheduled Time", lead.time)}
              {renderViewField(
                "Status",
                <Badge variant="secondary" className={getStatusClass(lead.status)}>
                  {lead.status}
                </Badge>
              )}
            </div>
          )}

          {isEditMode && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderEditField("Contact Name", "name", "text")}
              {renderEditField("Company", "company", "text")}
              {renderEditField("Activity Type", "type", "text")}

              {renderEditField("Priority", "priority", "select", ["Low", "Medium", "High"])}
              {renderEditField("Status", "status", "select", ["Overdue", "Pending", "Completed"])}
            </form>
          )}
        </div>

        {/* --- Modal Footer --- */}
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={closePopup} className="border-border">
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {isEditMode && (
            <Button type="submit" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FollowModels;