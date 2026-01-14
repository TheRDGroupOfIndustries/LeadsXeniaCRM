"use client";

import React, { useState, useEffect } from "react";
import { X, Users } from "lucide-react";
import LeadSelectorModal from "@/components/LeadSelectorModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import toast, { Toaster } from "react-hot-toast";
import { CampaignType, MessageType, Priority } from "@prisma/client";

export interface Campaign {
  id: string;
  campaignName: string;
  description?: string;
  campaignType: CampaignType;
  priority: Priority;
  messageType: MessageType;
  messageContent: string;
  mediaURL?: string;
  templateID?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  status: "ACTIVE" | "PAUSED";
  selectedLeadIds?: string[];
}

export interface CampaignActionModalProps {
  popup: "view" | "edit" | null;
  campaign: Campaign | null;
  closePopup: () => void;
  refreshData?: () => void;
}

const CampaignActionModal: React.FC<CampaignActionModalProps> = ({
  popup,
  campaign,
  closePopup,
  refreshData,
}) => {
  const [form, setForm] = useState<Campaign>({
    id: "",
    campaignName: "",
    description: "",
    campaignType: "MARKETING",
    priority: "MEDIUM",
    messageType: "TEXT",
    messageContent: "",
    mediaURL: "",
    templateID: "",
    userId: "",
    createdAt: "",
    updatedAt: "",
    status: "PAUSED",
    selectedLeadIds: [],
  });

  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [leadSelectorOpen, setLeadSelectorOpen] = useState(false);

  // ✅ Prefetch when modal opens for editing
  useEffect(() => {
    if (popup !== "edit" || !campaign?.id) return;

    const fetchCampaign = async () => {
      try {
        setPrefilling(true);
        const res = await fetch(`/api/campaigns/${campaign.id}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to fetch campaign data");
        const data = await res.json();

        setForm({
          id: data.id,
          campaignName: data.campaignName || "",
          description: data.description || "",
          campaignType: data.campaignType || "MARKETING",
          priority: data.priority || "NORMAL",
          messageType: data.messageType || "TEXT",
          messageContent: data.messageContent || "",
          mediaURL: data.mediaURL || "",
          templateID: data.templateID || "",
          userId: data.userId || "",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          status: data.status?.toUpperCase?.() || "PAUSED",
          selectedLeadIds: data.selectedLeadIds || [],
        });
      } catch (err) {
        console.error("❌ Error fetching campaign:", err);
        toast.error("Failed to load campaign data.");
      } finally {
        setPrefilling(false);
      }
    };

    const timer = setTimeout(fetchCampaign, 150);
    return () => clearTimeout(timer);
  }, [popup, campaign?.id]);

  if (!popup || !campaign) return null;

  const modalTitle = popup === "view" ? "Campaign Details" : "Edit Campaign";

  const handleChange = (field: keyof Campaign, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: form.campaignName,
          description: form.description,
          campaignType: form.campaignType,
          priority: form.priority.toUpperCase(),
          messageType: form.messageType,
          messageContent: form.messageContent,
          mediaURL: form.mediaURL,
          templateID: form.templateID,
          status: form.status.toUpperCase(),
          selectedLeadIds: form.selectedLeadIds || [],
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update campaign");
      }

      toast.success("✅ Campaign updated successfully!");
      refreshData?.();
      closePopup();
    } catch (error) {
      console.error(error);
      toast.error("❌ Error updating campaign");
    } finally {
      setLoading(false);
    }
  };

  // --- UI ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 p-4">
      <Toaster position="top-right" />
      <div className="bg-card text-foreground rounded-xl shadow-2xl w-full max-w-2xl animate-in fade-in duration-300 relative border border-border overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card">
          <h2 className="text-xl font-bold">
            {modalTitle}: {campaign.campaignName}
          </h2>
          <Button variant="ghost" size="icon" onClick={closePopup}>
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {popup === "view" ? (
            // --- View Mode ---
            <div className="text-sm space-y-3">
              <p>
                <strong>Campaign Type:</strong> {campaign.campaignType}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <Badge
                  className={
                    campaign.status?.toUpperCase() === "ACTIVE"
                      ? "bg-green-500/20 text-green-600"
                      : "bg-yellow-500/20 text-yellow-600"
                  }
                >
                  {campaign.status}
                </Badge>
              </p>
              <p>
                <strong>Priority:</strong>{" "}
                <Badge
                  className={
                    campaign.priority === "HIGH" ||
                    campaign.priority === "URGENT"
                      ? "bg-red-500/20 text-red-500"
                      : campaign.priority === "MEDIUM"
                      ? "bg-yellow-500/20 text-yellow-500"
                      : "bg-blue-500/20 text-blue-500"
                  }
                >
                  {campaign.priority}
                </Badge>
              </p>
              <p>
                <strong>Message Type:</strong> {campaign.messageType}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(campaign.createdAt).toLocaleDateString()}
              </p>
              <div className="pt-2">
                <p className="font-semibold text-muted-foreground mb-1">
                  Message Content:
                </p>
                <p className="bg-secondary p-3 rounded-md text-foreground/80">
                  {campaign.messageContent || "No message content."}
                </p>
              </div>

              {campaign.description && (
                <div className="pt-2">
                  <p className="font-semibold text-muted-foreground mb-1">
                    Description:
                  </p>
                  <p className="bg-secondary p-3 rounded-md text-foreground/80">
                    {campaign.description}
                  </p>
                </div>
              )}

              {/* Selected Leads Count */}
              {campaign.selectedLeadIds && campaign.selectedLeadIds.length > 0 && (
                <div className="pt-2">
                  <p className="font-semibold text-muted-foreground mb-1">
                    Target Leads:
                  </p>
                  <Badge variant="secondary" className="text-sm">
                    <Users className="w-3 h-3 mr-1" />
                    {campaign.selectedLeadIds.length} leads selected
                  </Badge>
                </div>
              )}

              {campaign.mediaURL && (
                <p>
                  <strong>Media URL:</strong> {campaign.mediaURL}
                </p>
              )}
              {campaign.templateID && (
                <p>
                  <strong>Template ID:</strong> {campaign.templateID}
                </p>
              )}
            </div>
          ) : (
            // --- Edit Mode ---
            <div className="space-y-4">
              {prefilling ? (
                <p className="text-center text-muted-foreground">
                  Loading campaign data...
                </p>
              ) : (
                <>
                  {/* Campaign Name */}
                  <Input
                    value={form.campaignName}
                    onChange={(e) =>
                      handleChange("campaignName", e.target.value)
                    }
                    placeholder="Campaign Name"
                  />

                  {/* Description */}
                  <Textarea
                    value={form.description || ""}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="Description"
                  />

                  {/* Campaign Type */}
                  <Select
                    value={form.campaignType}
                    onValueChange={(val) =>
                      handleChange("campaignType", val as CampaignType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Campaign Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="TRANSACTIONAL">Transactional</SelectItem>
                      <SelectItem value="NOTIFICATION">Notification</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Priority */}
                  <Select
                    value={form.priority}
                    onValueChange={(val) =>
                      handleChange("priority", val as Priority)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Message Type */}
                  <Select
                    value={form.messageType}
                    onValueChange={(val) =>
                      handleChange("messageType", val as MessageType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Message Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Text</SelectItem>
                      <SelectItem value="MEDIA">Media</SelectItem>
                      <SelectItem value="TEMPLATE">Template</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Message Content */}
                  <Textarea
                    value={form.messageContent}
                    onChange={(e) =>
                      handleChange("messageContent", e.target.value)
                    }
                    placeholder="Message Content"
                  />

                  {/* Media URL */}
                  <Input
                    value={form.mediaURL || ""}
                    onChange={(e) => handleChange("mediaURL", e.target.value)}
                    placeholder="Media URL (optional)"
                  />

                  {/* Template ID */}
                  <Input
                    value={form.templateID || ""}
                    onChange={(e) => handleChange("templateID", e.target.value)}
                    placeholder="Template ID (optional)"
                  />

                  {/* Lead Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Target Leads
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setLeadSelectorOpen(true)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {form.selectedLeadIds && form.selectedLeadIds.length > 0
                        ? `${form.selectedLeadIds.length} leads selected`
                        : "Select leads for this campaign"}
                    </Button>
                  </div>

                  {/* Status */}
                  <Select
                    value={form.status}
                    onValueChange={(val) =>
                      handleChange("status", val as "ACTIVE" | "PAUSED")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PAUSED">Paused</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Save Button */}

                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lead Selector Modal */}
      <LeadSelectorModal
        isOpen={leadSelectorOpen}
        onClose={() => setLeadSelectorOpen(false)}
        onConfirm={(selectedIds) => {
          handleChange("selectedLeadIds", selectedIds);
        }}
        preSelectedLeadIds={form.selectedLeadIds || []}
      />
    </div>
  );
};

export default CampaignActionModal;
