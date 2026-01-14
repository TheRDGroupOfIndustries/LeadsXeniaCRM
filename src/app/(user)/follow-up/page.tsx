"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  CheckCircle,
  Eye,
  Edit,
  Phone,
  Mail,
  Briefcase,
  MessageSquare,
  Trash2,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FollowModels from "@/components/ui/FollowModels";
import AddReminderModal from "@/components/AddReminderModal";

// Reminder interface
interface Reminder {
  id: string;
  title: string;
  description?: string;
  reminderDate: string;
  reminderType: string;
  priority: string;
  isCompleted: boolean;
  lead?: {
    id: string;
    name: string;
  };
}

interface GroupedReminders {
  overdue: Reminder[];
  today: Reminder[];
  tomorrow: Reminder[];
  thisWeek: Reminder[];
  later: Reminder[];
  completed: Reminder[];
}

interface Activity {
  id: number;
  leadId: string; // Original lead ID for API calls
  name: string;
  email?: string;
  phone?: string;
  company: string;
  tag?: string;
  source?: string;
  notes?: string;
  duration?: number;
  type: string;
  priority: "Low" | "Medium" | "High";
  scheduled: string;
  time: string;
  status: "Overdue" | "Pending" | "Completed";
  avatar: string;
}

// Lead is an alias of Activity, so they are structurally the same
interface Lead extends Activity {}

const statsConfig = [
  {
    title: "Urgent",
    subtitle: "Overdue Follow-ups",
    icon: AlertCircle,
    color: "bg-destructive",
    filterKey: "urgent",
  },
  {
    title: "Today",
    subtitle: "Due Today",
    icon: Clock,
    color: "bg-warning",
    filterKey: "today",
  },
  {
    title: "This Week",
    subtitle: "Scheduled",
    icon: CalendarIcon,
    color: "bg-info",
    filterKey: "thisWeek",
  },
  {
    title: "Completed",
    subtitle: "Total Completed",
    icon: CheckCircle,
    color: "bg-success",
    filterKey: "completed",
  },
];

// This will be populated from the database
const initialActivities: Activity[] = [];

const quickFilters = [
  { label: "Overdue", value: "overdue", color: "text-red-400 border-red-500/50 hover:bg-red-500/20" },
  { label: "High Priority", value: "high", color: "text-amber-400 border-amber-500/50 hover:bg-amber-500/20" },
  { label: "Calls Due", value: "calls", color: "text-blue-400 border-blue-500/50 hover:bg-blue-500/20" },
  { label: "Clear All", value: "clear", color: "text-gray-400 border-gray-500/50 hover:bg-gray-500/20" },
];

const activityToLead = (activity: Activity): Lead => activity as Lead;

const Page = () => {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [statsCounts, setStatsCounts] = useState({
    urgent: 0,
    today: 0,
    thisWeek: 0,
    completed: 0,
  });
  // Reminders state
  const [reminders, setReminders] = useState<GroupedReminders | null>(null);
  const [reminderStats, setReminderStats] = useState<any>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reminderDateFilter, setReminderDateFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [metricFilter, setMetricFilter] = useState<string | null>(null);
  const [popup, setPopup] = useState<null | "view" | "edit">(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper functions for reminders
  const getReminderIcon = (type: string): React.ReactElement => {
    switch (type.toLowerCase()) {
      case "call":
        return <Phone className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "meeting":
        return <Briefcase className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Check if reminder is today
    if (date >= todayStart && date < todayEnd) {
      const time = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `Today, ${time}`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const deleteReminder = async (reminderId: string) => {
    if (!window.confirm("Are you sure you want to delete this reminder?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete reminder");
      }

      // Refresh the data
      await fetchFollowUpLeads();
    } catch (error: any) {
      console.error("Error deleting reminder:", error);
      alert(error.message || "Failed to delete reminder");
    }
  };

  // Fetch reminders
  const fetchReminders = async () => {
    try {
      const remindersRes = await fetch("/api/reminders", {
        credentials: "include",
      });

      if (remindersRes.ok) {
        const remindersData = await remindersRes.json();
        if (remindersData.success && remindersData.groupedReminders) {
          setReminders(remindersData.groupedReminders);
          setReminderStats(remindersData.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching reminders:", err);
    }
  };

  // Fetch leads with FOLLOW_UP status from database
  const fetchFollowUpLeads = async () => {
    try {
      setLoading(true);
      
      // Fetch reminders in parallel
      fetchReminders();
      
      const res = await fetch("/api/leads", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const leads = Array.isArray(data) ? data : data.leads || [];
      
      // Filter only FOLLOW_UP leads and transform to Activity format
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      
      const followUpLeads = leads
        .filter((lead: any) => lead.status === 'FOLLOW_UP')
        .map((lead: any, index: number) => {
          const createdDate = new Date(lead.createdAt);
          const isOverdue = createdDate < todayStart;
          const isToday = createdDate >= todayStart && createdDate < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
          
          return {
            id: parseInt(lead.id.slice(-6), 16) || index + 1, // Display ID
            leadId: lead.id, // Original lead ID for API calls
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company || 'Unknown Company',
            tag: lead.tag,
            source: lead.source,
            notes: lead.notes || '',
            duration: lead.duration || 0,
            type: 'Follow-Up',
            priority: lead.tag === 'HOT' ? 'High' as const : lead.tag === 'WARM' ? 'Medium' as const : 'Low' as const,
            scheduled: new Date(lead.createdAt).toLocaleDateString(),
            time: new Date(lead.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            status: isOverdue ? 'Overdue' as const : 'Pending' as const,
            avatar: lead.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
            createdAt: createdDate,
          };
        });
      
      setActivities(followUpLeads);
      
      // Calculate stats from the activities
      const urgent = followUpLeads.filter((a: any) => a.status === 'Overdue').length;
      const today = followUpLeads.filter((a: any) => {
        const d = new Date(a.createdAt);
        return d >= todayStart && d < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      }).length;
      const thisWeek = followUpLeads.filter((a: any) => {
        const d = new Date(a.createdAt);
        return d >= weekStart;
      }).length;
      
      // For completed, we'll fetch from reminders API
      try {
        const remRes = await fetch('/api/reminders?status=completed', { cache: 'no-store', credentials: 'include' });
        if (remRes.ok) {
          const remData = await remRes.json();
          const reminders = remData.reminders || [];
          const completed = reminders.filter((r: any) => r.reminderType === 'FOLLOW_UP').length;
          setStatsCounts({ urgent, today, thisWeek, completed });
        } else {
          setStatsCounts({ urgent, today, thisWeek, completed: 0 });
        }
      } catch (remErr) {
        console.error('Error fetching completed reminders:', remErr);
        setStatsCounts({ urgent, today, thisWeek, completed: 0 });
      }
    } catch (error) {
      console.error('Error fetching follow-up leads:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchFollowUpLeads();
  }, []);

  const handleCompleteActivity = async (activityId: number) => {
    try {
      // Find the activity to get the lead ID
      const activity = activities.find(a => a.id === activityId);
      if (!activity) {
        console.error('Activity not found');
        return;
      }

      // Update the lead status to indicate completion via API
      console.log('Attempting to complete activity:', activity);
      console.log('Using lead ID:', activity.leadId);
      const response = await fetch(`/api/leads/${activity.leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: activity.name,
          email: activity.email || '',
          phone: activity.phone || '',
          company: activity.company,
          tag: 'QUALIFIED', // Mark as qualified when completed
          source: activity.source || '',
          notes: activity.notes || '',
          duration: activity.duration || 0,
          status: 'CONVERTED' // Update status to remove from follow-up list
        }),
      });

      console.log('API Response status:', response.status);
      const responseData = await response.json();
      console.log('API Response data:', responseData);

      if (response.ok) {
        // Remove from local state only after successful API update
        setActivities((prev) => prev.filter((a) => a.id !== activityId));
        console.log(`Activity ID: ${activityId} marked as completed and removed from list.`);
      } else {
        console.error('Failed to update lead status:', responseData);
        alert(`Failed to complete activity: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error completing activity:', error);
      alert('Error completing activity. Please try again.');
    }
  };

  const handleUpdateLead = async (
    leadId: string | number,
    data: Partial<Lead>
  ): Promise<void> => {
    console.log(`Simulating update for lead ${leadId} with data:`, data);
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Update the state with the new data
    setActivities((prevActivities) =>
      prevActivities.map((activity) =>
        activity.id === leadId ? { ...activity, ...data } : activity
      )
    );
    // Also update the selectedLead if it was the one being edited
    setSelectedLead((prevLead) =>
      prevLead && prevLead.id === leadId ? { ...prevLead, ...data } : prevLead
    );

    closePopup();
  };

  // FIX 2: Moved openModal to the correct scope (inside Page component)
  const openModal = (
    action: "view" | "edit",
    lead: Lead // Use Lead type
  ) => {
    setSelectedLead(lead);
    setPopup(action);
  };

  // FIX 3: Moved closePopup to the correct scope (inside Page component)
  const closePopup = () => setPopup(null);

  // Get date boundaries for filtering
  const getDateBoundaries = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return { todayStart, todayEnd, weekStart, monthStart };
  };

  // Filter reminders based on date filter
  const filteredReminders = React.useMemo(() => {
    if (!reminders || reminderDateFilter === "all") {
      return reminders;
    }

    const { todayStart, todayEnd, weekStart, monthStart } = getDateBoundaries();
    const now = new Date();

    const filterByDate = (reminder: Reminder) => {
      const reminderDate = new Date(reminder.reminderDate);
      
      if (reminderDateFilter === "today") {
        return reminderDate >= todayStart && reminderDate < todayEnd;
      } else if (reminderDateFilter === "thisWeek") {
        return reminderDate >= weekStart;
      } else if (reminderDateFilter === "thisMonth") {
        return reminderDate >= monthStart;
      }
      return true;
    };

    return {
      overdue: reminders.overdue?.filter(filterByDate) || [],
      today: reminders.today?.filter(filterByDate) || [],
      tomorrow: reminders.tomorrow?.filter(filterByDate) || [],
      thisWeek: reminders.thisWeek?.filter(filterByDate) || [],
      later: reminders.later?.filter(filterByDate) || [],
      completed: reminders.completed?.filter(filterByDate) || [],
    };
  }, [reminders, reminderDateFilter]);

  // Filter activities based on search, priority, type, status, quick filters, and metric filters
  const filteredActivities = React.useMemo(() => {
    const { todayStart, todayEnd, weekStart } = getDateBoundaries();
    
    return activities.filter((activity) => {
      // Search filter
      const searchMatch = searchQuery === "" || 
        activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.email && activity.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (activity.phone && activity.phone.includes(searchQuery));
      
      // Priority filter
      const priorityMatch = priorityFilter === "all" || 
        activity.priority.toLowerCase() === priorityFilter.toLowerCase();
      
      // Type filter
      const typeMatch = typeFilter === "all" || 
        activity.type.toLowerCase().includes(typeFilter.toLowerCase());
      
      // Status filter
      const statusMatch = statusFilter === "all" || 
        activity.status.toLowerCase() === statusFilter.toLowerCase();
      
      // Quick filters
      let quickMatch = true;
      if (quickFilter === "overdue") {
        quickMatch = activity.status === "Overdue";
      } else if (quickFilter === "high") {
        quickMatch = activity.priority === "High";
      } else if (quickFilter === "calls") {
        quickMatch = activity.type.toLowerCase().includes("call");
      }
      
      // Metric card filters
      let metricMatch = true;
      if (metricFilter) {
        const activityDate = (activity as any).createdAt ? new Date((activity as any).createdAt) : new Date(activity.scheduled);
        
        if (metricFilter === "urgent") {
          metricMatch = activity.status === "Overdue";
        } else if (metricFilter === "today") {
          metricMatch = activityDate >= todayStart && activityDate < todayEnd;
        } else if (metricFilter === "thisWeek") {
          metricMatch = activityDate >= weekStart;
        } else if (metricFilter === "completed") {
          metricMatch = activity.status === "Completed";
        }
      }
      
      return searchMatch && priorityMatch && typeMatch && statusMatch && quickMatch && metricMatch;
    });
  }, [activities, searchQuery, priorityFilter, typeFilter, statusFilter, quickFilter, metricFilter]);

  // Handle metric card click
  const handleMetricClick = (filterKey: string) => {
    if (metricFilter === filterKey) {
      setMetricFilter(null); // Toggle off if same filter clicked
    } else {
      setMetricFilter(filterKey);
      // Clear other filters when metric is clicked
      setQuickFilter(null);
    }
  };

  // Handle quick filter click
  const handleQuickFilter = (value: string) => {
    if (value === "clear") {
      setQuickFilter(null);
      setMetricFilter(null);
      setPriorityFilter("all");
      setTypeFilter("all");
      setStatusFilter("all");
      setSearchQuery("");
    } else {
      setQuickFilter(quickFilter === value ? null : value);
    }
  };

  return (
    <div>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Leads Follow-Up
            </h2>
            <p className="text-sm text-muted-foreground">
              Track and manage your lead follow-up activities
            </p>
          </div>
          <div className="flex gap-2">
            <AddReminderModal onReminderAdded={fetchFollowUpLeads} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsConfig.map((stat) => {
            // pick dynamic values
            let value = 0;
            if (stat.filterKey === 'urgent') value = statsCounts.urgent;
            if (stat.filterKey === 'today') value = statsCounts.today;
            if (stat.filterKey === 'thisWeek') value = statsCounts.thisWeek;
            if (stat.filterKey === 'completed') value = statsCounts.completed;

            const isActive = metricFilter === stat.filterKey;

            return (
              <Card 
                key={stat.title} 
                className={`p-6 bg-card border-border cursor-pointer transition-all hover:border-primary/50 ${isActive ? 'ring-2 ring-primary border-primary' : ''}`}
                onClick={() => handleMetricClick(stat.filterKey)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    {stat.subtitle && (
                      <p className="text-xs text-muted-foreground">
                        {stat.subtitle}
                      </p>
                    )}
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl ${stat.color}/20 flex items-center justify-center`}
                  >
                    <stat.icon
                      className={`w-6 h-6 ${
                        stat.color === "bg-destructive"
                          ? "text-destructive"
                          : stat.color === "bg-warning"
                          ? "text-warning"
                          : stat.color === "bg-info"
                          ? "text-info"
                          : "text-success"
                      }`}
                    />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {value}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Upcoming Reminders Section */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Upcoming Reminders
                </h2>
                {reminderStats && (
                  <p className="text-sm text-muted-foreground">
                    {reminderStats.pending} pending • {reminderStats.overdue} overdue
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={reminderDateFilter} onValueChange={setReminderDateFilter}>
                <SelectTrigger className="w-40 bg-card border-border">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent className="border-gray-800 bg-black text-white">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today" className="text-white">Today</SelectItem>
                  <SelectItem value="thisWeek" className="text-white">This Week</SelectItem>
                  <SelectItem value="thisMonth" className="text-white">This Month</SelectItem>
                </SelectContent>
              </Select>
              <AddReminderModal onReminderAdded={fetchFollowUpLeads} />
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {filteredReminders ? (
              <>
                {/* Overdue */}
                {filteredReminders.overdue && filteredReminders.overdue.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-3 p-3 border-l-4 border-red-500 bg-red-500/10 rounded-r"
                  >
                    <div className="text-red-600">
                      {getReminderIcon(reminder.reminderType)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {reminder.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {reminder.lead?.name} • Overdue
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Overdue
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-red-100 text-red-600 hover:text-red-700"
                      onClick={() => deleteReminder(reminder.id)}
                      title="Delete reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* Today */}
                {filteredReminders.today && filteredReminders.today.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-3 p-3 border-l-4 border-orange-500 bg-orange-500/10 rounded-r"
                  >
                    <div className="text-orange-600">
                      {getReminderIcon(reminder.reminderType)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {reminder.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {reminder.lead?.name} • {formatDate(reminder.reminderDate)}
                      </div>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                      Today
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-orange-100 text-orange-600 hover:text-orange-700"
                      onClick={() => deleteReminder(reminder.id)}
                      title="Delete reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* Tomorrow & This Week */}
                {[...filteredReminders.tomorrow || [], ...filteredReminders.thisWeek || []].map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-3 p-3 border-l-4 border-blue-500 bg-blue-500/10 rounded-r"
                  >
                    <div className="text-blue-600">
                      {getReminderIcon(reminder.reminderType)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {reminder.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {reminder.lead?.name} • {formatDate(reminder.reminderDate)}
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                      {reminder.priority}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                      onClick={() => deleteReminder(reminder.id)}
                      title="Delete reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* Later reminders */}
                {filteredReminders.later && filteredReminders.later.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-3 p-3 border-l-4 border-gray-500 bg-gray-500/10 rounded-r"
                  >
                    <div className="text-gray-600">
                      {getReminderIcon(reminder.reminderType)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {reminder.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {reminder.lead?.name} • {formatDate(reminder.reminderDate)}
                      </div>
                    </div>
                    <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
                      {reminder.priority}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600 hover:text-gray-700"
                      onClick={() => deleteReminder(reminder.id)}
                      title="Delete reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </>
            ) : null}

            {filteredReminders &&
              (filteredReminders.overdue?.length === 0 || !filteredReminders.overdue) &&
              (filteredReminders.today?.length === 0 || !filteredReminders.today) &&
              (filteredReminders.tomorrow?.length === 0 || !filteredReminders.tomorrow) &&
              (filteredReminders.thisWeek?.length === 0 || !filteredReminders.thisWeek) &&
              (filteredReminders.later?.length === 0 || !filteredReminders.later) && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming reminders</p>
                  <p className="text-sm">Create reminders to stay organized</p>
                </div>
              )}
              
            {!filteredReminders && (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Loading reminders...</p>
              </div>
            )}
          </div>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search leads or companies..."
              className="pl-10 bg-card border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-48 bg-card border-border">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent className="border-gray-800 bg-black text-white">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high" className="text-white">High</SelectItem>
              <SelectItem value="medium" className="text-white">Medium</SelectItem>
              <SelectItem value="low" className="text-white">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48 bg-card border-border">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="border-gray-800 bg-black text-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="call" className="text-white">Call</SelectItem>
              <SelectItem value="email" className="text-white">Email</SelectItem>
              <SelectItem value="meeting" className="text-white">Meeting</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-card border-border">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="border-gray-800 bg-black text-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending" className="text-white">Pending</SelectItem>
              <SelectItem value="overdue" className="text-white">Overdue</SelectItem>
              <SelectItem value="completed" className="text-white">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-muted-foreground font-medium">Quick filters:</span>
          <div className="flex items-center gap-2">
            {quickFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleQuickFilter(filter.value)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 ${filter.color} ${
                  quickFilter === filter.value 
                    ? "ring-2 ring-white/30 bg-white/10" 
                    : "bg-transparent"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activities Table */}
        <Card className="bg-card border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Follow-Up Activities
            </h3>
            <span className="text-sm text-muted-foreground">
              {filteredActivities.length} activities
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    LEAD
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    TYPE
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    PRIORITY
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    SCHEDULED DATE
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    STATUS
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Loading follow-up leads...
                    </td>
                  </tr>
                ) : filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      {activities.length === 0 
                        ? "No follow-up leads found. Leads with \"FOLLOW_UP\" status will appear here."
                        : "No activities match your filters."}
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((activity) => (
                    <tr
                      key={activity.id}
                      className="border-b border-border hover:bg-secondary/50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 bg-info">
                            <AvatarFallback className="text-white font-semibold">
                              {activity.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">
                              {activity.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {activity.company}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{activity.type}</td>
                      <td className="p-4">
                        <Badge
                          variant="secondary"
                          className={
                            activity.priority === "High"
                              ? "bg-destructive/20 text-destructive"
                              : activity.priority === "Medium"
                              ? "bg-warning/20 text-warning"
                              : "bg-success/20 text-success"
                          }
                        >
                          {activity.priority}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-foreground">
                          {activity.scheduled}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {activity.time}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="secondary"
                          className={
                            activity.status === "Overdue"
                              ? "bg-destructive/20 text-destructive"
                              : activity.status === "Pending"
                              ? "bg-warning/20 text-warning"
                              : "bg-success/20 text-success"
                          }
                        >
                          {activity.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button
                            onClick={() =>
                              openModal("view", activityToLead(activity))
                            }
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-900/20"
                            onClick={() => handleCompleteActivity(activity.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() =>
                              openModal("edit", activityToLead(activity))
                            }
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <FollowModels
        popup={popup}
        lead={selectedLead}
        closePopup={closePopup}
        onUpdateLead={handleUpdateLead}
      />
    </div>
  );
};

export default Page;
