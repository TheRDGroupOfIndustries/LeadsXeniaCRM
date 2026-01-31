"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  Search,
  Eye,
  Edit,
  Trash,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AddEmployeeModal from "@/components/AddEmployeeModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import toast, { Toaster } from "react-hot-toast";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  subscription: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    leads: number;
    campaigns: number;
  };
}

interface Stats {
  total: number;
  admins: number;
  employees: number;
  premium: number;
  free: number;
  recentlyActive: number;
  activePercentage: string;
}

export default function Employees() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    admins: 0,
    employees: 0,
    premium: 0,
    free: 0,
    recentlyActive: 0,
    activePercentage: "0",
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", subscription: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; employeeId: string | null; employeeName: string }>({ isOpen: false, employeeId: null, employeeName: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user?.role !== "ADMIN") {
      toast.error("Access denied. Admin only.");
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setWarning(null);

      const res = await fetch("/api/employees", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch employees");
      }

      if (data.warning) {
        setWarning(data.warning);
        toast.error(data.warning);
      }

      setEmployees(data.employees || []);
      setStats(data.stats || stats);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
      toast.error(error.message || "Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchEmployees();
    }
  }, [session]);

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    setDeleteModal({ isOpen: true, employeeId, employeeName });
  };

  const confirmDelete = async () => {
    if (!deleteModal.employeeId) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/employees/${deleteModal.employeeId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      setDeleteModal({ isOpen: false, employeeId: null, employeeName: "" });
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewEmployee = (employee: Employee) => {
    setViewEmployee(employee);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditEmployee(employee);
    setEditForm({
      name: employee.name || "",
      email: employee.email || "",
      role: employee.role || "EMPLOYEE",
      subscription: employee.subscription || "FREE"
    });
  };

  const handleUpdateEmployee = async () => {
    if (!editEmployee) return;

    try {
      setIsEditing(true);
      const res = await fetch(`/api/employees/${editEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update user");
      }

      toast.success("User updated successfully");
      setEditEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    } finally {
      setIsEditing(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Show loading or redirect message for non-admins
  if (status === "loading" || !session || session.user?.role !== "ADMIN") {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">
            {status === "loading" ? "Loading..." : "Access Denied"}
          </h2>
          {status !== "loading" && (
            <p className="text-sm text-muted-foreground mt-2">
              Admin access required. You will be redirected.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage team members and their access levels
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Warning Banner */}
      {warning && (
        <Card className="p-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-orange-600" />
              <span className="text-orange-800 dark:text-orange-200">{warning}</span>
            </div>
            <Button
              onClick={fetchEmployees}
              size="sm"
              variant="outline"
              className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-card border-border">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <Users className="w-6 h-6 text-info" />
          </div>
          <div className="text-3xl font-bold text-foreground">{stats.total}</div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm text-muted-foreground">Admins</p>
            <Crown className="w-6 h-6 text-warning" />
          </div>
          <div className="text-3xl font-bold text-foreground">{stats.admins}</div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm text-muted-foreground">Active Users</p>
            <UserPlus className="w-6 h-6 text-success" />
          </div>
          <div className="text-3xl font-bold text-foreground">{stats.recentlyActive}</div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm text-muted-foreground">Activity Rate</p>
            <Shield className="w-6 h-6 text-info" />
          </div>
          <div className="text-3xl font-bold text-foreground">{stats.activePercentage}%</div>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Users ({filteredEmployees.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-flex items-center gap-3 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
              <span>Loading users...</span>
            </div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            {warning ? "Database unavailable - showing empty results" : "No users found"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  {[
                    "User",
                    "Role",
                    "Subscription",
                    "Leads",
                    "Campaigns",
                    "Joined",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left p-4 text-sm font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-border hover:bg-secondary/50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 bg-info">
                          <AvatarFallback className="bg-info text-white font-semibold">
                            {employee.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">
                            {employee.name || "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {employee.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border-2 backdrop-blur-md ${employee.role === "ADMIN" ? "bg-red-500/30 border-red-400/50 text-red-100" : "bg-blue-500/30 border-blue-400/50 text-blue-100"}`}>
                        {employee.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border-2 backdrop-blur-md ${employee.subscription === "PREMIUM"
                        ? "bg-green-500/30 border-green-400/50 text-green-100"
                        : employee.subscription === "PENDING"
                          ? "bg-yellow-500/30 border-yellow-400/50 text-yellow-100"
                          : "bg-black/40 border-gray-600/50 text-gray-200"
                        }`}>
                        {employee.subscription}
                      </span>
                    </td>
                    <td className="p-4 text-foreground">
                      {employee._count?.leads || 0}
                    </td>
                    <td className="p-4 text-foreground">
                      {employee._count?.campaigns || 0}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(employee.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-info hover:bg-info/10"
                        onClick={() => handleViewEmployee(employee)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-warning hover:bg-warning/10"
                        onClick={() => handleEditEmployee(employee)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                        onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* View User Modal */}
      {viewEmployee && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black text-white p-6 rounded-lg max-w-md w-full mx-4 border border-gray-800 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">User Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewEmployee(null)}
                className="h-8 w-8 p-0 hover:bg-destructive/20"
              >
                ✕
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12 bg-info">
                  <AvatarFallback className="bg-info text-white font-semibold">
                    {viewEmployee.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-foreground">{viewEmployee.name}</div>
                  <div className="text-sm text-muted-foreground">{viewEmployee.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Role</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border-2 backdrop-blur-md ${viewEmployee.role === "ADMIN" ? "bg-red-500/30 border-red-400/50 text-red-100" : "bg-blue-500/30 border-blue-400/50 text-blue-100"}`}>
                      {viewEmployee.role}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Subscription</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border-2 backdrop-blur-md ${viewEmployee.subscription === "PREMIUM"
                        ? "bg-green-500/30 border-green-400/50 text-green-100"
                        : viewEmployee.subscription === "PENDING"
                          ? "bg-yellow-500/30 border-yellow-400/50 text-yellow-100"
                          : "bg-black/40 border-gray-600/50 text-gray-200"
                      }`}>
                      {viewEmployee.subscription}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Total Leads</label>
                  <div className="mt-1 text-foreground font-medium">{viewEmployee._count?.leads || 0}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Total Campaigns</label>
                  <div className="mt-1 text-foreground font-medium">{viewEmployee._count?.campaigns || 0}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Joined</label>
                  <div className="mt-1 text-foreground font-medium">
                    {new Date(viewEmployee.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Last Updated</label>
                  <div className="mt-1 text-foreground font-medium">
                    {new Date(viewEmployee.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editEmployee && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black text-white p-6 rounded-lg max-w-md w-full mx-4 border border-gray-800 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Edit User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditEmployee(null)}
                className="h-8 w-8 p-0 hover:bg-destructive/20"
              >
                ✕
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Email</label>
                <Input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="bg-background border-border"
                  type="email"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full p-2 bg-black border border-border rounded-md text-white"
                >
                  <option value="EMPLOYEE" className="bg-black text-white">User</option>
                  <option value="ADMIN" className="bg-black text-white">Admin</option>
                </select>
              </div>
              {editForm.role !== "ADMIN" && (
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Subscription</label>
                  <select
                    value={editForm.subscription}
                    onChange={(e) => setEditForm({ ...editForm, subscription: e.target.value })}
                    className="w-full p-2 bg-black border border-border rounded-md text-white"
                  >
                    <option value="PENDING" className="bg-black text-yellow-400">Pending</option>
                    <option value="PREMIUM" className="bg-black text-green-400">Premium</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setEditEmployee(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateEmployee}
                  disabled={isEditing}
                  className="flex-1 border border-primary"
                >
                  {isEditing ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal
        open={showAddModal}
        close={() => setShowAddModal(false)}
        onCreated={fetchEmployees}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, employeeId: null, employeeName: "" })}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteModal.employeeName}"? This action cannot be undone and will remove all their data.`}
        confirmText="Delete User"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}