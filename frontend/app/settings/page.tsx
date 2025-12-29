"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  updateProfile,
  changePassword,
  setTogglToken,
  removeTogglToken,
  getTogglTokenStatus,
} from "@/lib/api";

export default function SettingsPage() {
  const { user, checkAuth } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [togglToken, setTogglTokenState] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [savedWorkspaceId, setSavedWorkspaceId] = useState<string | null>(null);
  const [togglLoading, setTogglLoading] = useState(false);
  const [togglStatusLoading, setTogglStatusLoading] = useState(true);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  useEffect(() => {
    loadTogglStatus();
  }, []);

  const loadTogglStatus = async () => {
    try {
      const status = await getTogglTokenStatus();
      setHasToken(status.hasToken);
      setSavedWorkspaceId(status.workspaceId);
      if (status.workspaceId) {
        setWorkspaceId(status.workspaceId);
      }
    } catch (error) {
      console.error("Failed to load Toggl status:", error);
    } finally {
      setTogglStatusLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateProfile({ name });
      await checkAuth();
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      toast.success("Password changed. Please log in again.");
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTogglSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!togglToken || !workspaceId) {
      toast.error("Please enter both token and workspace ID");
      return;
    }
    setTogglLoading(true);
    try {
      await setTogglToken(togglToken, workspaceId);
      setHasToken(true);
      setSavedWorkspaceId(workspaceId);
      setTogglTokenState("");
      toast.success("Toggl API token saved successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save Toggl token"
      );
    } finally {
      setTogglLoading(false);
    }
  };

  const handleTogglRemove = async () => {
    setTogglLoading(true);
    try {
      await removeTogglToken();
      setHasToken(false);
      setSavedWorkspaceId(null);
      setWorkspaceId("");
      toast.success("Toggl API token removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove Toggl token"
      );
    } finally {
      setTogglLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and integrations
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <Button type="submit" disabled={profileLoading}>
                  {profileLoading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password. You&apos;ll be logged out after changing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Toggl Integration</CardTitle>
              <CardDescription>
                Connect your Toggl account to sync time entries.
                {hasToken && savedWorkspaceId && (
                  <span className="block mt-1 text-success">
                    Connected (Workspace: {savedWorkspaceId})
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {togglStatusLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : hasToken ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Your Toggl API token is securely stored. You can update it
                    or remove it below.
                  </p>
                  <form onSubmit={handleTogglSave} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="togglToken">
                        New API Token (optional)
                      </Label>
                      <Input
                        id="togglToken"
                        type="password"
                        value={togglToken}
                        onChange={(e) => setTogglTokenState(e.target.value)}
                        placeholder="Enter new token to update"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workspaceId">Workspace ID</Label>
                      <Input
                        id="workspaceId"
                        value={workspaceId}
                        onChange={(e) => setWorkspaceId(e.target.value)}
                        placeholder="Your Toggl workspace ID"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={togglLoading || !togglToken}
                      >
                        {togglLoading ? "Saving..." : "Update Token"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleTogglRemove}
                        disabled={togglLoading}
                      >
                        Remove
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <form onSubmit={handleTogglSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="togglToken">API Token</Label>
                    <Input
                      id="togglToken"
                      type="password"
                      value={togglToken}
                      onChange={(e) => setTogglTokenState(e.target.value)}
                      placeholder="Your Toggl API token"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Find your API token at{" "}
                      <a
                        href="https://track.toggl.com/profile"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Toggl Profile Settings
                      </a>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workspaceId">Workspace ID</Label>
                    <Input
                      id="workspaceId"
                      value={workspaceId}
                      onChange={(e) => setWorkspaceId(e.target.value)}
                      placeholder="Your Toggl workspace ID"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Find your workspace ID in the URL when viewing your
                      workspace
                    </p>
                  </div>
                  <Button type="submit" disabled={togglLoading}>
                    {togglLoading ? "Connecting..." : "Connect Toggl"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
