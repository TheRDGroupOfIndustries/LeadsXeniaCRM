"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users, Crown, RefreshCw, Edit } from "lucide-react";
import toast from "react-hot-toast";

interface UserSubscription {
  id: string;
  name: string;
  email: string;
  role: string;
  subscription: string;
  createdAt: string;
  _count: {
    leads: number;
    campaigns: number;
  };
}

interface SubscriptionStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  adminUsers: number;
  conversionRate: string;
}

const AdminSubscriptionPanel: React.FC = () => {
  const [users, setUsers] = useState<UserSubscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    adminUsers: 0,
    conversionRate: "0",
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employees", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      setUsers(data.employees || []);
      setStats(data.stats || stats);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubscriptionUpdate = async (userId: string, newSubscription: string) => {
    try {
      setUpdating(userId);
      const res = await fetch(`/api/employees/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: newSubscription }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update subscription");
      }

      toast.success(`Subscription updated to ${newSubscription}`);
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || "Failed to update subscription");
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Premium Users</CardTitle>
              <Crown className="w-4 h-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.premiumUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Free Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.freeUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
              <Crown className="w-4 h-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.adminUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Button
          onClick={fetchUsers}
          variant="outline"
          className="border-border"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            User Subscriptions ({filteredUsers.length} users)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
              <span className="ml-3 text-muted-foreground">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Current Subscription</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Activity</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 bg-info">
                            <AvatarFallback className="bg-info text-white font-semibold">
                              {user.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border-2 backdrop-blur-md ${user.role === "ADMIN" ? "bg-red-500/30 border-red-400/50 text-red-100" : "bg-blue-500/30 border-blue-400/50 text-blue-100"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border-2 backdrop-blur-md ${user.subscription === "PREMIUM" ? "bg-green-500/30 border-green-400/50 text-green-100" : user.subscription === "PENDING" ? "bg-yellow-500/30 border-yellow-400/50 text-yellow-100" : "bg-black/40 border-gray-600/50 text-gray-200"}`}>
                          {user.subscription}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-foreground">
                          {user._count.leads} leads • {user._count.campaigns} campaigns
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={user.subscription === "PREMIUM" ? "destructive" : "default"}
                            disabled={updating === user.id}
                            onClick={() =>
                              handleSubscriptionUpdate(
                                user.id,
                                user.subscription === "PREMIUM" ? "FREE" : "PREMIUM"
                              )
                            }
                          >
                            {updating === user.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <Edit className="w-3 h-3 mr-1" />
                            )}
                            {user.subscription === "PREMIUM" ? "Downgrade" : "Upgrade"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSubscriptionPanel;