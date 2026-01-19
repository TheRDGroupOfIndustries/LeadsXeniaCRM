"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  UserPlus,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  Phone,
  Mail,
  MessageSquare,
  Briefcase,
  Trash2,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import AddReminderModal from "@/components/AddReminderModal";
import LeadsAddModal from "@/components/LeadsAddModal";

interface DashboardMetrics {
  totalRevenue: {
    value: number;
    formatted: string;
    change: string;
    trend: "up" | "down";
    subtitle: string;
  };
  newLeads: {
    value: number;
    formatted: string;
    change: string;
    trend: "up" | "down";
    subtitle: string;
  };
  activeEmployees: {
    value: number;
    formatted: string;
    change: string;
    trend: "up" | "down";
    subtitle: string;
  };
  conversionRate: {
    value: number;
    formatted: string;
    change: string;
    trend: "up" | "down";
    subtitle: string;
  };
}

interface Lead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  tag: string;
  source?: string;
  createdAt: string;
}

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
    company?: string;
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

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";

  // If employee and not premium, redirect to payments
  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const user = session?.user as any;
        if (!user || !user.id) return;
        if (user.role !== "EMPLOYEE") return;

        const res = await fetch(`/api/auth/user/${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        const subscription = data.subscription as string | undefined;
        if (subscription !== "PREMIUM") {
          router.replace("/payments");
        }
      } catch (err) {
        console.error("Failed to check subscription for redirect:", err);
      }
    };

    checkAndRedirect();
  }, [session, router]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [reminders, setReminders] = useState<GroupedReminders | null>(null);
  const [reminderStats, setReminderStats] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard metrics
      const metricsRes = await fetch("/api/dashboard/metrics", {
        credentials: "same-origin",
      });

      if (!metricsRes.ok) {
        throw new Error("Failed to fetch dashboard metrics");
      }

      const metricsData = await metricsRes.json();

      if (metricsData.success) {
        const apiMetrics = metricsData.data?.metrics;
        const apiRecent = metricsData.data?.recentLeads || [];

        // Guard against unexpected API responses
        if (!apiMetrics) {
          console.warn("Dashboard metrics API returned no metrics");
          setMetrics(null);
        } else {
          setMetrics(apiMetrics);
        }

        setRecentLeads(Array.isArray(apiRecent) ? apiRecent : []);
      } else {
        // If the API returns success: false, show a toast and set friendly defaults
        console.warn("Dashboard metrics API reported failure", metricsData.error);
        setMetrics(null);
        setRecentLeads([]);
      }

      // Fetch reminders
      const remindersRes = await fetch("/api/reminders", {
        credentials: "include",
      });

      console.log("Reminders API response status:", remindersRes.status);
      
      if (remindersRes.ok) {
        const remindersData = await remindersRes.json();
        console.log("Reminders data received:", remindersData);
        
        if (remindersData.success && remindersData.groupedReminders) {
          setReminders(remindersData.groupedReminders);
          setReminderStats(remindersData.stats);
          console.log('Reminders set successfully:', remindersData.groupedReminders);
          console.log('Individual reminder counts:');
          console.log('- Overdue:', remindersData.groupedReminders.overdue?.length || 0);
          console.log('- Today:', remindersData.groupedReminders.today?.length || 0);
          console.log('- Tomorrow:', remindersData.groupedReminders.tomorrow?.length || 0);
          console.log('- This week:', remindersData.groupedReminders.thisWeek?.length || 0);
          console.log('- Later:', remindersData.groupedReminders.later?.length || 0);
        } else {
          console.warn("Reminders API returned unsuccessful response:", remindersData);
          setReminders(null);
        }
      } else {
        console.error("Failed to fetch reminders:", remindersRes.status, remindersRes.statusText);
        setReminders(null);
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

      toast.success("Reminder deleted successfully");
      
      // Refresh the dashboard data to update the reminders list
      await fetchDashboardData();
    } catch (error: any) {
      console.error("Error deleting reminder:", error);
      toast.error(error.message || "Failed to delete reminder");
    }
  };

  const getStatusColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "hot":
        return "bg-red-100 text-red-800 border-red-200";
      case "warm":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cold":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "qualified":
        return "bg-green-100 text-green-800 border-green-200";
      case "disqualified":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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
    const diffMs = date.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24 && diffHours > -24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Error: {error}</span>
          </div>
          <Button
            onClick={fetchDashboardData}
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your leads and campaigns.
        </p>
      </div>

      {/* Metrics Grid */}
      {metrics && (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}>
          {/* Total Revenue */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Revenue
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {metrics.totalRevenue.formatted}
                  </span>
                  <span
                    className={`text-xs font-medium flex items-center gap-1 ${
                      metrics.totalRevenue.trend === "up"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics.totalRevenue.trend === "up" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {metrics.totalRevenue.change}
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalRevenue.subtitle}
            </p>
          </Card>

          {/* New Leads */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {isAdmin ? 'New Leads' : 'Total Leads'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {metrics.newLeads.formatted}
                  </span>
                  <span
                    className={`text-xs font-medium flex items-center gap-1 ${
                      metrics.newLeads.trend === "up"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics.newLeads.trend === "up" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {metrics.newLeads.change}
                  </span>
                </div>
              </div>
              <UserPlus className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.newLeads.subtitle}
            </p>
          </Card>

          {/* Admin-only metrics */}
          {isAdmin && (
            <>
              {/* Active Employees */}
              <Card className="p-6 bg-card border-border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Active Employees
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-foreground">
                        {metrics.activeEmployees.formatted}
                      </span>
                      <span
                        className={`text-xs font-medium flex items-center gap-1 ${
                          metrics.activeEmployees.trend === "up"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {metrics.activeEmployees.trend === "up" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {metrics.activeEmployees.change}
                      </span>
                    </div>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.activeEmployees.subtitle}
                </p>
              </Card>

              {/* Conversion Rate */}
              <Card className="p-6 bg-card border-border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Conversion Rate
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-foreground">
                        {metrics.conversionRate.formatted}
                      </span>
                      <span
                        className={`text-xs font-medium flex items-center gap-1 ${
                          metrics.conversionRate.trend === "up"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {metrics.conversionRate.trend === "up" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {metrics.conversionRate.change}
                      </span>
                    </div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.conversionRate.subtitle}
                </p>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Recent Leads
            </h2>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => router.push('/leads')}>
              View All
            </Button>
          </div>

          <div className="space-y-4">
            {recentLeads.length > 0 ? (
              recentLeads.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {lead.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {lead.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {lead.company || lead.email || "No company"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(lead.tag)}>
                      {lead.tag}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent leads</p>
                <p className="text-sm">Add some leads to see them here</p>
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Reminders */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Upcoming Reminders
              </h2>
              {reminderStats && (
                <p className="text-sm text-muted-foreground">
                  {reminderStats.pending} pending • {reminderStats.overdue}{" "}
                  overdue
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/follow-up')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </button>
              <AddReminderModal onReminderAdded={fetchDashboardData} />
            </div>
          </div>

          <div className="space-y-3">
            {reminders ? (
              <>
                {/* Overdue */}
                {reminders.overdue && reminders.overdue.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-3 p-3 border-l-4 border-red-500 bg-red-500/10 backdrop-blur-sm rounded-r"
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
                {reminders.today && reminders.today.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-3 p-3 border-l-4 border-orange-500 bg-orange-500/10 backdrop-blur-sm rounded-r"
                  >
                    <div className="text-orange-600">
                      {getReminderIcon(reminder.reminderType)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {reminder.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {reminder.lead?.name} •{" "}
                        {formatDate(reminder.reminderDate)}
                      </div>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
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
                {[...reminders.tomorrow || [], ...reminders.thisWeek || []].map(
                  (reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center gap-3 p-3 border-l-4 border-blue-500 bg-blue-500/10 backdrop-blur-sm rounded-r"
                    >
                      <div className="text-blue-600">
                        {getReminderIcon(reminder.reminderType)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {reminder.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {reminder.lead?.name} •{" "}
                          {formatDate(reminder.reminderDate)}
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
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
                  )
                )}
                {/* Later reminders */}
                {reminders.later && reminders.later.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-3 p-3 border-l-4 border-gray-500 bg-gray-500/10 backdrop-blur-sm rounded-r"
                  >
                    <div className="text-gray-600">
                      {getReminderIcon(reminder.reminderType)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {reminder.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {reminder.lead?.name} •{" "}
                        {formatDate(reminder.reminderDate)}
                      </div>
                    </div>
                    <Badge className="bg-gray-100 text-gray-800 border-gray-200">
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

            {reminders &&
              (reminders.overdue?.length === 0 || !reminders.overdue) &&
              (reminders.today?.length === 0 || !reminders.today) &&
              (reminders.tomorrow?.length === 0 || !reminders.tomorrow) &&
              (reminders.thisWeek?.length === 0 || !reminders.thisWeek) &&
              (reminders.later?.length === 0 || !reminders.later) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming reminders</p>
                  <p className="text-sm">Create reminders to stay organized</p>
                </div>
              )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Lead
          </Button>
          <Button
            variant="outline"
            className={`flex items-center gap-2 ${recentLeads.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (recentLeads.length === 0) {
                toast('Add at least one lead before scheduling follow-ups', { icon: '⚠️' });
                return;
              }
              router.push('/follow-up');
            }}
            disabled={recentLeads.length === 0}
          >
            <Calendar className="w-4 h-4" />
            Schedule Follow-up
          </Button>

          <Button
            variant="outline"
            className={`flex items-center gap-2 ${recentLeads.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (recentLeads.length === 0) {
                toast('Add leads before sending campaigns', { icon: '⚠️' });
                return;
              }
              router.push('/Campaigns');
            }}
            disabled={recentLeads.length === 0}
          >
            <MessageSquare className="w-4 h-4" />
            Send Campaign
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={fetchDashboardData}
          >
            <TrendingUp className="w-4 h-4" />
            Refresh Data
          </Button>
        </div>
      </Card>

      {showAddModal && (
        <LeadsAddModal
          onClose={() => setShowAddModal(false)}
          onLeadAdded={fetchDashboardData}
        />
      )}
    </div>
  );
}
