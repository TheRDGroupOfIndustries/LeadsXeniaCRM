"use client";

import {
  Search,
  Plus,
  Upload,
  Download,
  Eye,
  Edit,
  Trash,
  Users,
  UserPlus,
  CheckCircle,
  Flame,
  Clock,
  Building2,
  MessageSquare,
  Calendar as CalendarIcon,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import LeadsModal from "@/components/ui/LeadsModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import LeadsAddModal from "@/components/LeadsAddModal";
import LeadViewModal from "@/components/LeadViewModal";
import LeadsEditModal from "@/components/LeadEditModal";
import { SelectGroup, SelectLabel } from "@/components/ui/select";

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  stage: string;
  tag: string;
  status: string;
  value: string;
  created: string;
  createdAt?: string;
  updatedAt?: string;
  leadsCreatedDate?: string;
  leadsUpdatedDates?: string;
  enquiryDate?: string;
  bookingDate?: string;
  checkInDates?: string;
  checkoutDate?: string;
  avatar?: string;
  notes?: string;
  duration?: number;
  amount?: number;
}

const getSourceIcon = (source: string) => {
  const icons: { [key: string]: string } = {
    Facebook: "f",
    Google: "G",
    Website: "🌐",
    Referral: "👥",
    Instagram: "📷",
    "Social Media": "📱",
    Marketing: "📣",
    Event: "🎫",
  };
  return icons[source] || "👤";
};

// Get source badge styling based on source type
const getSourceBadgeStyle = (source: string) => {
  const styles: { [key: string]: string } = {
    "Social Media": "bg-pink-500/20 text-pink-400 border border-pink-500/30",
    "Referral": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    "Marketing": "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    "Event": "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    "Facebook": "bg-blue-600/20 text-blue-400 border border-blue-500/30",
    "Google": "bg-red-500/20 text-red-400 border border-red-500/30",
    "Website": "bg-green-500/20 text-green-400 border border-green-500/30",
    "Instagram": "bg-pink-600/20 text-pink-400 border border-pink-500/30",
  };
  return styles[source] || "bg-gray-500/20 text-gray-400 border border-gray-500/30";
};

// Get tag badge styling
const getTagBadgeStyle = (tag: string) => {
  const styles: { [key: string]: string } = {
    "HOT": "bg-red-500/20 text-red-400 border border-red-500/30",
    "WARM": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    "COLD": "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
    "QUALIFIED": "bg-green-500/20 text-green-400 border border-green-500/30",
    "DISQUALIFIED": "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  };
  return styles[tag.toUpperCase()] || "bg-gray-500/20 text-gray-400 border border-gray-500/30";
};

// Get status badge styling
const getStatusBadgeStyle = (status: string) => {
  const styles: { [key: string]: string } = {
    "PENDING": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    "FOLLOW_UP": "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    "CONVERTED": "bg-green-500/20 text-green-400 border border-green-500/30",
    "REJECTED": "bg-red-500/20 text-red-400 border border-red-500/30",
    "Created": "bg-green-500/20 text-green-400 border border-green-500/30",
  };
  return styles[status] || "bg-gray-500/20 text-gray-400 border border-gray-500/30";
};

const getCompanyLogo = (company: string) => {
  const firstLetter = company.charAt(0).toUpperCase();
  const colors = {
    'A': 'bg-blue-600',
    'B': 'bg-green-600',
    'C': 'bg-purple-600',
    'D': 'bg-red-600',
    'E': 'bg-yellow-600',
    'F': 'bg-indigo-600',
    'G': 'bg-pink-600',
    'H': 'bg-gray-600',
    'I': 'bg-blue-500',
    'J': 'bg-green-500',
    'K': 'bg-purple-500',
    'L': 'bg-red-500',
    'M': 'bg-yellow-500',
    'N': 'bg-indigo-500',
    'O': 'bg-pink-500',
    'P': 'bg-gray-500',
    'Q': 'bg-blue-700',
    'R': 'bg-green-700',
    'S': 'bg-purple-700',
    'T': 'bg-red-700',
    'U': 'bg-yellow-700',
    'V': 'bg-indigo-700',
    'W': 'bg-pink-700',
    'X': 'bg-gray-700',
    'Y': 'bg-blue-800',
    'Z': 'bg-green-800',
  };
  return colors[firstLetter as keyof typeof colors] || 'bg-gray-600';
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [checkInFromDate, setCheckInFromDate] = useState<string>("");
  const [checkInToDate, setCheckInToDate] = useState<string>("");
  const [checkoutFromDate, setCheckoutFromDate] = useState<string>("");
  const [checkoutToDate, setCheckoutToDate] = useState<string>("");
  const [createdFromDate, setCreatedFromDate] = useState<string>("");
  const [createdToDate, setCreatedToDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [popup, setPopup] = useState<null | "add" | "view" | "edit" | "delete">(
    null
  );
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const closePopup = () => setPopup(null);

  // ✅ Fetch leads from API
  const exportLeads = () => {
    if (filteredLeads.length === 0) {
      toast.error("No leads to export");
      return;
    }

    // Create CSV content
    const headers = ["name", "email", "phone", "company", "notes", "source", "tag", "duration", "amount", "leadsCreatedDate", "leadsUpdatedDates", "enquiryDate", "bookingDate", "checkInDates", "checkoutDate"];
    const rows = filteredLeads.map(lead => {
      const createdVal = lead.leadsCreatedDate || lead.createdAt || '';
      const updatedVal = lead.leadsUpdatedDates || lead.updatedAt || '';
      const enquiryVal = lead.enquiryDate || '';
      const bookingVal = lead.bookingDate || '';
      const checkInVal = lead.checkInDates || '';

      return [
        `"${(lead.name || "").replace(/"/g, '""')}"`,
        `"${(lead.email || "").replace(/"/g, '""')}"`,
        `"${(lead.phone || "").replace(/"/g, '""')}"`,
        `"${(lead.company || "").replace(/"/g, '""')}"`,
        `"${(lead.notes || "").replace(/"/g, '""')}"`,
        `"${(lead.source || "").replace(/"/g, '""')}"`,
        `"${(lead.tag || "").replace(/"/g, '""')}"`,
        lead.duration || 0,
        lead.amount || 0,
        `"${createdVal}"`,
        `"${updatedVal}"`,
        `"${enquiryVal}"`,
        `"${bookingVal}"`,
        `"${checkInVal}"`
      ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");

    // Create download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filteredLeads.length} leads successfully!`);
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/leads", { 
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
      }
      const data = await res.json();
      console.log("Fetch leads response:", data);
      const leadsArray = Array.isArray(data) ? data : (data.leads || []);
      setLeads(leadsArray);
      console.log(`Loaded ${leadsArray.length} leads successfully`);
    } catch (err: any) {
      console.error("Failed to fetch leads:", err);
      setError(err.message || "Failed to fetch leads");
      setLeads([]); // Clear leads on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // ✅ Delete lead via API
  const handleDeleteLead = async (leadId: string): Promise<void> => {
    try {
      toast.loading("Deleting lead...");
      const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      const data = await res.json();
      toast.dismiss();

      if (!res.ok) {
        toast.error(`❌ Failed to delete: ${data.error || "Unknown error"}`);
        return;
      }

      setLeads((prevLeads) => prevLeads.filter((lead) => lead.id !== leadId));
      toast.success("🗑️ Lead deleted successfully!");
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.dismiss();
      toast.error("Something went wrong while deleting the lead");
    }
  };

  const handleUpdateLead = async (leadId: string, formData: Partial<Lead>) => {
       if (!leadId || !formData) {
         toast.error("⚠️ Please fill all required fields");
         return;
       }

       try {
         const res = await fetch(`/api/leads/${leadId}`, {
           method: "PUT",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(formData),
         });

         const data = await res.json();
         if (!res.ok) throw new Error(data.error || "Failed to update lead");

         toast.success(" Lead updated successfully!");
         fetchLeads();
       } catch (err: any) {
         console.error("Error updating lead:", err);
         toast.error(` ${err.message || "Update failed"}`);
       } 
     
  };

  const openModal = (action: "view" | "edit" | "delete", lead: Lead | null) => {
    setSelectedLead(lead);
    setPopup(action);
  };



  // 🧮 Stats
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    const newThisWeek = leads.filter((lead) => {
      const dateStr = lead.createdAt || lead.leadsCreatedDate || lead.created;
      if (!dateStr) return false;
      const createdDate = new Date(dateStr);
      return createdDate >= oneWeekAgo && createdDate <= now;
    }).length;

    const hotLeads = leads.filter(
      (lead) => lead.tag.toLowerCase() === "hot"
    ).length;

    const convertedLeads = leads.filter(
      (lead) => lead.status === "CONVERTED"
    ).length;

    return [
      {
        title: "Total Leads",
        value: totalLeads.toString(),
        icon: Users,
        color: "bg-info",
      },
      {
        title: "New This Week",
        value: newThisWeek.toString(),
        icon: UserPlus,
        color: "bg-info",
      },
      {
        title: "Converted",
        value: convertedLeads.toString(),
        icon: CheckCircle,
        color: "bg-success",
      },
      {
        title: "Hot Leads",
        value: hotLeads.toString(),
        icon: Flame,
        color: "bg-warning",
      },
    ];
  }, [leads]);

  // 🔍 Filtering
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        (lead.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (lead.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (lead.company || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        selectedStatus && selectedStatus !== "all"
          ? lead.status === selectedStatus
          : true;

      const matchesTag =
        selectedTag && selectedTag !== "all"
          ? lead.tag.toLowerCase() === selectedTag.toLowerCase()
          : true;

      // Helper function to check date range
      const checkDateRange = (dateStr: string | undefined, fromDate: string, toDate: string) => {
        // If no date range filters, show all leads
        if (!fromDate && !toDate) return true;
        
        // If no date exists but filters are set, exclude the lead
        if (!dateStr) return false;
        
        const date = new Date(dateStr);
        // If date is invalid, exclude the lead
        if (isNaN(date.getTime())) return false;
        
        // Normalize to start of day for comparison
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        // Check from date
        if (fromDate) {
          const from = new Date(fromDate);
          if (isNaN(from.getTime())) return false;
          const fromOnly = new Date(from.getFullYear(), from.getMonth(), from.getDate());
          if (dateOnly < fromOnly) return false;
        }
        
        // Check to date
        if (toDate) {
          const to = new Date(toDate);
          if (isNaN(to.getTime())) return false;
          const toOnly = new Date(to.getFullYear(), to.getMonth(), to.getDate());
          if (dateOnly > toOnly) return false;
        }
        
        return true;
      };

      // Check-In Date filter (date range)
      const matchesCheckInDate = checkDateRange(lead.checkInDates, checkInFromDate, checkInToDate);

      // Created Date filter (date range, prioritize leadsCreatedDate over createdAt)
      const createdDateStr = lead.leadsCreatedDate || lead.createdAt || lead.created;
      const matchesCreatedDate = checkDateRange(createdDateStr, createdFromDate, createdToDate);

      return matchesSearch && matchesStatus && matchesTag && matchesCheckInDate && matchesCreatedDate;
    });
  }, [leads, search, selectedStatus, selectedTag, checkInFromDate, checkInToDate, checkoutFromDate, checkoutToDate, createdFromDate, createdToDate]);

  // ✅ UI (unchanged)
  return (
    <div className="p-6 space-y-6 overflow-hidden max-w-full">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            Lead Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage and track your leads efficiently
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/leadform")}
            variant="outline"
            className="border-success text-success hover:bg-success/10"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>

          <Button
            onClick={() => setShowAddModal(true)}
            variant="outline"
            className="border-success text-success hover:bg-success/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6 bg-card border-border">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <div
                className={`w-12 h-12 rounded-xl ${stat.color}/20 flex items-center justify-center`}
              >
                <stat.icon
                  className={`w-6 h-6 ${
                    stat.color === "bg-info"
                      ? "text-info"
                      : stat.color === "bg-success"
                      ? "text-success"
                      : "text-warning"
                  }`}
                />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {stat.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border h-11 text-base"
          />
        </div>

        {/* Filter Button */}
        <Button
          variant="outline"
          className="h-11 px-4 border-border hover:bg-secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {(selectedStatus !== "all" || selectedTag !== "all" || checkInFromDate || checkInToDate || checkoutFromDate || checkoutToDate || createdFromDate || createdToDate) && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {[
                selectedStatus !== "all",
                selectedTag !== "all",
                checkInFromDate || checkInToDate,
                checkoutFromDate || checkoutToDate,
                createdFromDate || createdToDate
              ].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-6 bg-card border-border space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Filter Options
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Status and Tag Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full bg-card border-border h-11">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent className="border-gray-800 bg-black text-white">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                  <SelectItem value="CONVERTED">Converted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tag</label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-full bg-card border-border h-11">
                  <SelectValue placeholder="Filter by Tag" />
                </SelectTrigger>
                <SelectContent className="border-gray-800 bg-black text-white">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check-In Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Check-In Date Range
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={checkInFromDate}
                  onChange={(e) => setCheckInFromDate(e.target.value)}
                  placeholder="From"
                  className="flex-1 bg-card border-border h-11"
                />
                <span className="text-muted-foreground font-medium">to</span>
                <Input
                  type="date"
                  value={checkInToDate}
                  onChange={(e) => setCheckInToDate(e.target.value)}
                  placeholder="To"
                  className="flex-1 bg-card border-border h-11"
                />
              </div>
            </div>
            
            {/* Check-Out Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Check-Out Date Range
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={checkoutFromDate}
                  onChange={(e) => setCheckoutFromDate(e.target.value)}
                  placeholder="From"
                  className="flex-1 bg-card border-border h-11"
                />
                <span className="text-muted-foreground font-medium">to</span>
                <Input
                  type="date"
                  value={checkoutToDate}
                  onChange={(e) => setCheckoutToDate(e.target.value)}
                  placeholder="To"
                  className="flex-1 bg-card border-border h-11"
                />
              </div>
            </div>
            
            {/* Created Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Created Date Range
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={createdFromDate}
                  onChange={(e) => setCreatedFromDate(e.target.value)}
                  placeholder="From"
                  className="flex-1 bg-card border-border h-11"
                />
                <span className="text-muted-foreground font-medium">to</span>
                <Input
                  type="date"
                  value={createdToDate}
                  onChange={(e) => setCreatedToDate(e.target.value)}
                  placeholder="To"
                  className="flex-1 bg-card border-border h-11"
                />
              </div>
            </div>
          </div>

          {/* Additional Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check-Out Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Check-Out Date Range
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={checkoutFromDate}
                  onChange={(e) => setCheckoutFromDate(e.target.value)}
                  placeholder="From"
                  className="flex-1 bg-card border-border h-11"
                />
                <span className="text-muted-foreground font-medium">to</span>
                <Input
                  type="date"
                  value={checkoutToDate}
                  onChange={(e) => setCheckoutToDate(e.target.value)}
                  placeholder="To"
                  className="flex-1 bg-card border-border h-11"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedStatus("all");
                setSelectedTag("all");
                setCheckInFromDate("");
                setCheckInToDate("");
                setCheckoutFromDate("");
                setCheckoutToDate("");
                setCreatedFromDate("");
                setCreatedToDate("");
              }}
              className="border-border"
            >
              Clear All Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card className="bg-card border-border">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Leads ({filteredLeads.length})
          </h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border cursor-pointer"
              onClick={exportLeads}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-flex items-center gap-3 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
              <span>Loading leads...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-destructive">{error}</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No leads found
          </div>
        ) : (
          <div className="relative">
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full min-w-[2200px]">
              <thead className="border-b border-border">
                <tr>
                  {[
                    "Lead",
                    "Email",
                    "Phone",
                    "Company",
                    "Source",
                    "Tag",
                    "Status",
                    "Duration",
                    "Amount",
                    "Notes",
                    "Created",
                    "Updated",
                    "Enquiry",
                    "Booking",
                    "Check-in",
                    "Check-out",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`text-left p-4 text-sm font-medium text-muted-foreground ${h === 'Actions' ? 'sticky right-0 bg-background border-l border-border z-20' : ''} min-w-[120px]`}
                    >
                      {h}
                    </th>
                  ))}
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground min-w-[100px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border hover:bg-secondary/50"
                  >
                    {/* Lead Name Column */}
                    <td className="p-4">
                      <span className="text-sm text-foreground">{lead.name}</span>
                    </td>
                    
                    {/* Email Column */}
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{lead.email || '-'}</span>
                    </td>
                    
                    {/* Phone Column */}
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{lead.phone || '-'}</span>
                    </td>
                    
                    {/* Company Column */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{lead.company || '-'}</span>
                      </div>
                    </td>
                    
                    {/* Source Column */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getSourceBadgeStyle(lead.source)}`}>
                        <span>{getSourceIcon(lead.source)}</span>
                        <span>{lead.source || '-'}</span>
                      </span>
                    </td>
                    
                    {/* Tag Column */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getTagBadgeStyle(lead.tag)}`}>
                        {lead.tag === 'HOT' && <span>🔥</span>}
                        {lead.tag === 'WARM' && <span>☀️</span>}
                        {lead.tag === 'COLD' && <span>❄️</span>}
                        {lead.tag === 'QUALIFIED' && <span>✓</span>}
                        {lead.tag === 'DISQUALIFIED' && <span>⊘</span>}
                        <span>{lead.tag}</span>
                      </span>
                    </td>
                    
                    {/* Status Column */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadgeStyle(lead.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>{lead.status === 'FOLLOW_UP' ? 'Follow Up' : lead.status === 'PENDING' ? 'Created' : lead.status}</span>
                      </span>
                    </td>
                    
                    {/* Duration Column */}
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{lead.duration || 0} days</span>
                    </td>
                    
                    {/* Amount Column */}
                    <td className="p-4">
                      <span className="text-sm text-green-400 font-medium">₹{lead.amount?.toLocaleString() || '0'}</span>
                    </td>
                    
                    {/* Notes Column */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-[200px]">
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{lead.notes || 'No notes'}</span>
                      </div>
                    </td>
                    
                    {/* Created Date Column */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-600 bg-transparent text-sm text-white">
                        <Clock className="w-4 h-4" />
                        {(() => {
                          const dateStr = lead.leadsCreatedDate || lead.createdAt;
                          if (dateStr) {
                            try {
                              const d = new Date(dateStr);
                              return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
                            } catch {
                              return dateStr;
                            }
                          }
                          return '-';
                        })()}
                      </span>
                    </td>
                    
                    {/* Updated Date Column */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-600 bg-transparent text-sm text-white">
                        <Clock className="w-4 h-4" />
                        {(() => {
                          const dateStr = lead.leadsUpdatedDates || lead.updatedAt;
                          if (dateStr) {
                            try {
                              const d = new Date(dateStr);
                              return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
                            } catch {
                              return dateStr;
                            }
                          }
                          return '-';
                        })()}
                      </span>
                    </td>
                    
                    {/* Enquiry Date Column */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-600 bg-transparent text-sm text-white">
                        <Clock className="w-4 h-4" />
                        {(() => {
                          if (lead.enquiryDate) {
                            try {
                              const d = new Date(lead.enquiryDate);
                              return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
                            } catch {
                              return '-';
                            }
                          }
                          return '-';
                        })()}
                      </span>
                    </td>
                    
                    {/* Booking Date Column */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-600 bg-transparent text-sm text-white">
                        <Clock className="w-4 h-4" />
                        {(() => {
                          if (lead.bookingDate) {
                            try {
                              const d = new Date(lead.bookingDate);
                              return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
                            } catch {
                              return '-';
                            }
                          }
                          return '-';
                        })()}
                      </span>
                    </td>
                    
                    {/* Check-in Date Column */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-600 bg-transparent text-sm text-white">
                        <Clock className="w-4 h-4" />
                        {(() => {
                          if (lead.checkInDates) {
                            try {
                              const d = new Date(lead.checkInDates);
                              return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
                            } catch {
                              return '-';
                            }
                          }
                          return '-';
                        })()}
                      </span>
                    </td>
                    
                    {/* Check-out Date Column */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-600 bg-transparent text-sm text-white">
                        <Clock className="w-4 h-4" />
                        {(() => {
                          if (lead.checkoutDate) {
                            try {
                              const d = new Date(lead.checkoutDate);
                              return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
                            } catch {
                              return '-';
                            }
                          }
                          return '-';
                        })()}
                      </span>
                    </td>
                    
                    {/* Actions Column */}
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-info hover:bg-info/10"
                          onClick={() => openModal("view", lead)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-warning hover:bg-warning/10"
                          onClick={() => openModal("edit", lead)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => handleDeleteLead(lead.id)}
                        >
                          <Trash className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </Card>

      {/* ✅ Real modal added here */}
      {showAddModal && (
        <LeadsAddModal
          onClose={() => setShowAddModal(false)}
          onLeadAdded={fetchLeads}
        />
      )}

      {popup === "view" && selectedLead && (
        <LeadViewModal lead={selectedLead} closePopup={closePopup} />
      )}
      {popup === "edit" && selectedLead && (
        <LeadsEditModal
          leadId={selectedLead.id}
          onClose={closePopup}
          onLeadUpdated={fetchLeads}
        />
      )}
    </div>
  );
}
