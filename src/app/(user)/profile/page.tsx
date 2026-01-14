"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  UserPlus,
  Users,
  TrendingUp,
  Mail,
  Phone,
  Building,
  Calendar,
  User,
} from "lucide-react";

interface ProfileMetrics {
  totalRevenue: {
    value: number;
    formatted: string;
    subtitle: string;
  };
  totalLeads: {
    value: number;
    formatted: string;
    subtitle: string;
  };
  activeEmployees?: {
    value: number;
    formatted: string;
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
  amount?: number;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<ProfileMetrics | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard metrics for profile
      const metricsRes = await fetch("/api/dashboard/metrics", {
        credentials: "same-origin",
      });

      if (!metricsRes.ok) {
        throw new Error("Failed to fetch profile metrics");
      }

      const metricsData = await metricsRes.json();

      if (metricsData.success) {
        const apiMetrics = metricsData.data?.metrics;
        const apiRecent = metricsData.data?.recentLeads || [];

        if (apiMetrics) {
          const profileMetrics: ProfileMetrics = {
            totalRevenue: {
              value: apiMetrics.totalRevenue.value,
              formatted: apiMetrics.totalRevenue.formatted,
              subtitle: apiMetrics.totalRevenue.subtitle,
            },
            totalLeads: {
              value: apiMetrics.newLeads.value,
              formatted: apiMetrics.newLeads.formatted,
              subtitle: apiMetrics.newLeads.subtitle,
            },
          };

          if (isAdmin) {
            profileMetrics.activeEmployees = {
              value: apiMetrics.activeEmployees.value,
              formatted: apiMetrics.activeEmployees.formatted,
              subtitle: apiMetrics.activeEmployees.subtitle,
            };
          }

          setMetrics(profileMetrics);
        }

        setRecentLeads(Array.isArray(apiRecent) ? apiRecent : []);
      }
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      setError(err.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-600">
            <span>Error: {error}</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Profile</h1>
        <p className="text-muted-foreground">
          {user?.name || "User"} • {isAdmin ? "Administrator" : "Employee"}
        </p>
      </div>

      {/* User Information Card */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-semibold">
            {(user?.name?.substring(0, 2) || "US").toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {user?.name || "Unknown User"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user?.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <Badge variant={isAdmin ? "destructive" : "secondary"}>
                  {isAdmin ? "Admin" : "Employee"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Grid */}
      {metrics && (
        <div className={`grid grid-cols-1 md:grid-cols-${isAdmin ? "3" : "2"} gap-4`}>
          {/* Total Revenue */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Revenue
                </p>
                <span className="text-2xl font-bold text-foreground">
                  {metrics.totalRevenue.formatted}
                </span>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalRevenue.subtitle}
            </p>
          </Card>

          {/* Total Leads */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Leads
                </p>
                <span className="text-2xl font-bold text-foreground">
                  {metrics.totalLeads.formatted}
                </span>
              </div>
              <UserPlus className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalLeads.subtitle}
            </p>
          </Card>

          {/* Active Employees (Admin only) */}
          {isAdmin && metrics.activeEmployees && (
            <Card className="p-6 bg-card border-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Active Employees
                  </p>
                  <span className="text-2xl font-bold text-foreground">
                    {metrics.activeEmployees.formatted}
                  </span>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeEmployees.subtitle}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Recent Leads */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {isAdmin ? "Recent Leads (All Users)" : "Your Recent Leads"}
          </h2>
        </div>

        <div className="space-y-4">
          {recentLeads.length > 0 ? (
            recentLeads.slice(0, 10).map((lead) => (
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
                <div className="flex items-center gap-3">
                  {lead.amount && (
                    <span className="text-sm font-medium text-green-600">
                      ${Number(lead.amount).toFixed(2)}
                    </span>
                  )}
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
              <p>No leads found</p>
              <p className="text-sm">Start adding leads to see them here</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}