"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Shield, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  Trash2,
  Check,
  Users
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import toast, { Toaster } from "react-hot-toast";
import AdminUserManagement from "@/components/AdminUserManagement";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  subscription: string;
  createdAt: string;
  verified: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Admin user management state
  const [showUserManagement, setShowUserManagement] = useState(false);
  const isAdmin = profile?.role === "ADMIN";

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;
      
      try {
        const res = await fetch(`/api/auth/user/${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          setProfile({
            id: data.id || session.user.id,
            name: data.name || session.user.name || "User",
            email: data.email || session.user.email || "",
            role: data.role || session.user.role || "USER",
            subscription: data.subscription || "FREE",
            createdAt: data.createdAt || new Date().toISOString(),
            verified: true // Assuming verified if logged in
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session]);

  // Calculate password strength
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: "", color: "" };
    
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 3) return { score, label: "Medium", color: "bg-yellow-500" };
    return { score, label: "Strong", color: "bg-green-500" };
  };

  const oldPasswordStrength = getPasswordStrength(oldPassword);
  const newPasswordStrength = getPasswordStrength(newPassword);

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword,
          confirmPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }

      toast.success("Account deleted successfully");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="inline-flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 w-full">
      <Toaster position="top-right" />

      {/* Admin User Management Modal */}
      <AdminUserManagement 
        isOpen={showUserManagement} 
        onClose={() => setShowUserManagement(false)} 
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your experience across theme, language, and accessibility.
        </p>
      </div>

      {/* Admin Section - Only visible to admins */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Administration</h2>
            <p className="text-sm text-muted-foreground">Admin settings</p>
          </div>

          <Card className="bg-card border-border p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    User Management
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create and manage user accounts for your team
                  </p>
                </div>
                <Button
                  onClick={() => setShowUserManagement(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  <strong>Tip:</strong> Create user accounts for your team members. 
                  Each user will receive login credentials that work in both the web app and desktop app.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          <p className="text-sm text-muted-foreground">Profile settings</p>
        </div>

        <Card className="bg-card border-border p-6">
          <div className="space-y-0">
            {/* Avatar Row */}
            <div className="flex items-center justify-between py-4 border-b border-border">
              <span className="text-muted-foreground font-medium">Avatar</span>
              <Avatar className="w-12 h-12 bg-zinc-800 border border-zinc-700">
                <AvatarFallback className="bg-zinc-800 text-white font-semibold text-lg">
                  {profile?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name Row */}
            <div className="flex items-center justify-between py-4 border-b border-border">
              <span className="text-muted-foreground font-medium">Name</span>
              <span className="text-foreground">{profile?.name || "User"}</span>
            </div>

            {/* Email Row */}
            <div className="flex items-center justify-between py-4 border-b border-border">
              <span className="text-amber-500 font-medium">Email</span>
              <span className="text-foreground">{profile?.email || "N/A"}</span>
            </div>

            {/* User Type Row */}
            <div className="flex items-center justify-between py-4 border-b border-border">
              <span className="text-muted-foreground font-medium">User Type</span>
              <span className="text-foreground">{profile?.role || "User"}</span>
            </div>

            {/* ID Row */}
            <div className="flex items-center justify-between py-4 border-b border-border">
              <span className="text-muted-foreground font-medium">ID</span>
              <span className="text-foreground font-mono text-sm">{profile?.id || "N/A"}</span>
            </div>

            {/* Verified Row */}
            <div className="flex items-center justify-between py-4">
              <span className="text-amber-500 font-medium">Verified</span>
              <span className="text-foreground">{profile?.verified ? "Yes" : "No"}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Security Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Security</h2>
          <p className="text-sm text-muted-foreground">Security settings</p>
        </div>

        <Card className="bg-card border-border p-6">
          <div className="space-y-6">
            {/* Old Password */}
            <div>
              <label className="text-sm text-foreground block mb-2">Old Password</label>
              <div className="relative">
                <Input
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="bg-black border-border pr-10"
                  placeholder="Enter old password"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {oldPassword && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Password strength</span>
                  <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${oldPasswordStrength.color}`}
                      style={{ width: `${(oldPasswordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="text-sm text-foreground block mb-2">Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-black border-border pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Password strength</span>
                  <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${newPasswordStrength.color}`}
                      style={{ width: `${(newPasswordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm text-foreground block mb-2">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-black border-border pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword && (
                <div className="mt-2 flex items-center gap-2">
                  {confirmPassword === newPassword ? (
                    <span className="text-xs text-green-500 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-xs text-red-500">Passwords don't match</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handlePasswordChange}
                disabled={changingPassword}
                className="bg-white text-black hover:bg-gray-200"
              >
                {changingPassword ? "Updating..." : "Submit"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Account Section - Delete */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          <p className="text-sm text-muted-foreground">Account settings</p>
        </div>

        <Card className="bg-card border-border p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Delete your account</h3>
            <p className="text-muted-foreground">
              Permanently delete your account and all associated data
            </p>

            {/* Warning Box */}
            <div className="border border-red-500/50 bg-red-500/10 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-400">Delete Account</h4>
                  <p className="text-sm text-red-300">
                    Once you delete your account, there is no going back. This action cannot be undone. 
                    All your data including leads, orders, and subscription information will be permanently removed.
                  </p>
                </div>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <Button 
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Permanently Delete
              </Button>
            ) : (
              <div className="space-y-4 p-4 border border-red-500/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Type <span className="font-bold text-red-400">DELETE</span> to confirm:
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="bg-black border-border"
                />
                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmText !== "DELETE"}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? "Deleting..." : "Confirm Delete"}
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Soft delete will disable your account but preserve your data. 
              Permanent delete will remove all your data forever.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
