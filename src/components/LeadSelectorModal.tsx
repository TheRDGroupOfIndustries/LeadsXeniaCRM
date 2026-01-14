"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Search, Users, CheckSquare, Square, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  status?: string;
  source?: string;
  tag?: string;
  checkInDates?: string | null;
  checkoutDate?: string | null;
}

interface LeadSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedLeadIds: string[]) => void;
  preSelectedLeadIds?: string[];
}

const LeadSelectorModal: React.FC<LeadSelectorModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  preSelectedLeadIds = [],
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(
    new Set(preSelectedLeadIds)
  );

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [checkinFrom, setCheckinFrom] = useState<string>("");
  const [checkoutTo, setCheckoutTo] = useState<string>("");

  // Fetch leads from API
  useEffect(() => {
    if (!isOpen) return;

    const fetchLeads = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/leads", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch leads");
        }

        const data = await res.json();
        setLeads(data);
      } catch (error) {
        console.error("Error fetching leads:", error);
        toast.error("Failed to load leads");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [isOpen]);

  // Filter leads based on search and filters
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.includes(searchQuery) ||
        lead.company?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "ALL" ||
        lead.status?.toUpperCase() === statusFilter.toUpperCase();

      // Source filter
      const matchesSource =
        sourceFilter === "ALL" ||
        lead.source?.toUpperCase() === sourceFilter.toUpperCase();

      // Tag filter
      const matchesTag =
        tagFilter === "ALL" ||
        lead.tag?.toUpperCase() === tagFilter.toUpperCase();

      // Check-in date filter
      const leadCheckIn = lead.checkInDates
        ? new Date(lead.checkInDates)
        : null;
      const matchesCheckin =
        !checkinFrom || (leadCheckIn && leadCheckIn >= new Date(checkinFrom));

      // Check-out date filter
      const leadCheckOut = lead.checkoutDate
        ? new Date(lead.checkoutDate)
        : null;
      const matchesCheckout =
        !checkoutTo || (leadCheckOut && leadCheckOut <= new Date(checkoutTo));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSource &&
        matchesTag &&
        matchesCheckin &&
        matchesCheckout
      );
    });
  }, [leads, searchQuery, statusFilter, sourceFilter, tagFilter, checkinFrom, checkoutTo]);

  // Get unique values for filters
  const uniqueStatuses = useMemo(
    () => Array.from(new Set(leads.map((l) => l.status).filter(Boolean))),
    [leads]
  );

  const uniqueSources = useMemo(
    () => Array.from(new Set(leads.map((l) => l.source).filter(Boolean))),
    [leads]
  );

  const uniqueTags = useMemo(
    () => Array.from(new Set(leads.map((l) => l.tag).filter(Boolean))),
    [leads]
  );

  // Handle individual checkbox toggle
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  // Handle select all toggle
  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      // Deselect all
      setSelectedLeadIds(new Set());
    } else {
      // Select all filtered leads
      setSelectedLeadIds(new Set(filteredLeads.map((lead) => lead.id)));
    }
  };

  // Check if all filtered leads are selected
  const allSelected =
    filteredLeads.length > 0 && selectedLeadIds.size === filteredLeads.length;
  const someSelected = selectedLeadIds.size > 0 && !allSelected;

  const handleConfirm = () => {
    onConfirm(Array.from(selectedLeadIds));
    onClose();
  };

  const handleCancel = () => {
    setSelectedLeadIds(new Set(preSelectedLeadIds));
    onClose();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setSourceFilter("ALL");
    setTagFilter("ALL");
    setCheckinFrom("");
    setCheckoutTo("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/90 p-4">
      <div className="bg-card text-foreground rounded-xl shadow-2xl w-full max-w-5xl animate-in fade-in duration-300 relative border border-border flex flex-col max-h-[90vh] opacity-100">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Select Leads for Campaign</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedLeadIds.size} of {filteredLeads.length} leads selected
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters Section */}
        <div className="p-5 border-b border-border space-y-4 shrink-0">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, phone, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status!}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Source Filter */}
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sources</SelectItem>
                {uniqueSources.map((source) => (
                  <SelectItem key={source} value={source!}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tag Filter */}
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Tags</SelectItem>
                {uniqueTags.map((tag) => (
                  <SelectItem key={tag} value={tag!}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Check-in Date Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Check-in</label>
              <input
                type="date"
                value={checkinFrom}
                onChange={(e) => setCheckinFrom(e.target.value)}
                className="h-9 px-2 rounded border border-input bg-background text-sm"
              />
            </div>

            {/* Check-out Date Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Check-out</label>
              <input
                type="date"
                value={checkoutTo}
                onChange={(e) => setCheckoutTo(e.target.value)}
                className="h-9 px-2 rounded border border-input bg-background text-sm"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Select All Row */}
        <div className="px-5 py-3 bg-muted/30 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              {allSelected ? (
                <CheckSquare className="w-5 h-5 text-primary" />
              ) : someSelected ? (
                <div className="w-5 h-5 border-2 border-primary rounded flex items-center justify-center bg-primary/20">
                  <div className="w-3 h-0.5 bg-primary" />
                </div>
              ) : (
                <Square className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {allSelected ? "Deselect All" : "Select All"}
              </span>
            </button>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        </div>

        {/* Leads List */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No leads found matching your filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => toggleLeadSelection(lead.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedLeadIds.has(lead.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      <Checkbox
                        checked={selectedLeadIds.has(lead.id)}
                        onCheckedChange={() => toggleLeadSelection(lead.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">
                            {lead.name}
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                            {lead.phone && <span>📞 {lead.phone}</span>}
                            {lead.email && (
                              <span className="truncate">✉️ {lead.email}</span>
                            )}
                          </div>
                          {lead.company && (
                            <p className="text-sm text-muted-foreground mt-1">
                              🏢 {lead.company}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 items-end shrink-0">
                          {lead.status && (
                            <Badge
                              variant="outline"
                              className="text-xs whitespace-nowrap"
                            >
                              {lead.status}
                            </Badge>
                          )}
                          {lead.source && (
                            <Badge
                              variant="secondary"
                              className="text-xs whitespace-nowrap"
                            >
                              {lead.source}
                            </Badge>
                          )}
                          {lead.tag && (
                            <Badge className="text-xs whitespace-nowrap">
                              {lead.tag}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border flex items-center justify-between gap-3 shrink-0 bg-muted/20">
          <div className="text-sm font-medium">
            <span className="text-primary">{selectedLeadIds.size}</span> leads
            selected
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedLeadIds.size === 0}
              className="min-w-[120px]"
            >
              Confirm Selection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadSelectorModal;
