import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { KeyRound, UserRound, LogOut, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useToast } from "@/components/ui/Toast";
import { logout, selectCurrentUser } from "@/features/auth/authSlice";
import {
  useChangePasswordMutation,
  useRemoveAvatarMutation,
  useUpdateAccountMutation,
  useUploadAvatarMutation,
} from "@/features/auth/api";
import { baseApi } from "@/lib/baseApi";

export function SettingsPage() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [updateAccount, accountState] = useUpdateAccountMutation();
  const [changePassword, passwordState] = useChangePasswordMutation();
  const [account, setAccount] = useState({ name: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [accountError, setAccountError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef(null);
  const [uploadAvatar, avatarUploadState] = useUploadAvatarMutation();
  const [removeAvatar, avatarRemoveState] = useRemoveAvatarMutation();

  useEffect(() => {
    setAccount({
      name: user?.name || "",
    });
  }, [user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

  const onAccountSubmit = async (event) => {
    event.preventDefault();
    setAccountError("");
    try {
      await updateAccount({
        name: account.name.trim(),
      }).unwrap();
      toast({ title: "Account updated", description: "Your account details have been saved.", variant: "success" });
    } catch (error) {
      setAccountError(error.data?.message || "Could not update your account. Please try again.");
    }
  };

  const onAvatarFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setAvatarError("");
    if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarFile(null);
      setAvatarError("Choose a JPEG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setAvatarFile(null);
      setAvatarError("Choose an image that is 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setAvatarFile(file);
  };

  const onAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarError("");
    const formData = new FormData();
    formData.append("avatar", avatarFile);
    try {
      await uploadAvatar(formData).unwrap();
      setAvatarFile(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      toast({ title: "Profile photo updated", description: "Your new photo is now visible across HirePulse.", variant: "success" });
    } catch (error) {
      setAvatarError(error.data?.message || "Could not upload your photo. Please try again.");
    }
  };

  const onAvatarRemove = async () => {
    setAvatarError("");
    try {
      await removeAvatar().unwrap();
      setAvatarFile(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      toast({ title: "Profile photo removed", description: "Your profile no longer has a photo.", variant: "success" });
    } catch (error) {
      setAvatarError(error.data?.message || "Could not remove your photo. Please try again.");
    }
  };

  const onPasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    if (passwords.newPassword.length < 8 || !/[A-Za-z]/.test(passwords.newPassword) || !/[0-9]/.test(passwords.newPassword)) {
      setPasswordError("Use at least 8 characters, including one letter and one number.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwords.newPassword === passwords.currentPassword) {
      setPasswordError("Choose a new password different from your current password.");
      return;
    }

    try {
      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      }).unwrap();
      dispatch(logout());
      dispatch(baseApi.util.resetApiState());
      toast({
        title: "Password changed",
        description: "Sign in again using your new password.",
        variant: "success",
      });
      navigate("/login", { replace: true });
    } catch (error) {
      setPasswordError(error.data?.message || "Could not change your password. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account details and sign-in security.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary"><UserRound className="h-5 w-5" /></div>
            <div>
              <CardTitle>Personal details</CardTitle>
              <CardDescription>Update your name and profile photo. Your email address cannot be changed.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onAccountSubmit} className="space-y-4">
            {accountError && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{accountError}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="account-name" className="text-sm font-medium">Full name</label>
                <Input id="account-name" autoComplete="name" required minLength={2} maxLength={50} value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="account-email" className="text-sm font-medium">Email address</label>
                <Input id="account-email" type="email" autoComplete="email" value={user?.email || ""} disabled />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Profile photo</p>
              <div className="flex flex-wrap items-center gap-4">
                {avatarPreview || user?.avatar ? (
                  <img
                    src={avatarPreview || user.avatar}
                    alt="Profile photo preview"
                    className="h-16 w-16 rounded-full border object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="h-7 w-7" />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    ref={avatarInputRef}
                    id="account-avatar"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onAvatarFileChange}
                    disabled={avatarUploadState.isLoading || avatarRemoveState.isLoading}
                    aria-describedby="account-avatar-help"
                  />
                  <p id="account-avatar-help" className="text-xs text-muted-foreground">
                    JPEG, PNG, or WebP. Maximum file size: 5 MB.
                    {avatarFile ? ` Selected: ${avatarFile.name}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={onAvatarUpload}
                    disabled={!avatarFile || avatarRemoveState.isLoading}
                    isLoading={avatarUploadState.isLoading}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Upload photo
                  </Button>
                  {user?.avatar && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onAvatarRemove}
                      disabled={avatarUploadState.isLoading}
                      isLoading={avatarRemoveState.isLoading}
                      aria-label="Remove profile photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {avatarError && <p className="text-sm text-destructive" role="alert">{avatarError}</p>}
            </div>
            {accountState.error?.data?.message && !accountError && (
              <p className="text-sm text-destructive" role="alert">{accountState.error.data.message}</p>
            )}
            <Button type="submit" isLoading={accountState.isLoading}>Save account details</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary"><KeyRound className="h-5 w-5" /></div>
            <div>
              <CardTitle>Change password</CardTitle>
              <CardDescription>Changing your password signs out all active sessions.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onPasswordSubmit} className="space-y-4">
            {passwordError && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{passwordError}</p>}
            <div className="space-y-1.5">
              <label htmlFor="current-password" className="text-sm font-medium">Current password</label>
              <PasswordInput id="current-password" autoComplete="current-password" required value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-sm font-medium">New password</label>
                <PasswordInput id="new-password" autoComplete="new-password" minLength={8} required value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirm-new-password" className="text-sm font-medium">Confirm new password</label>
                <PasswordInput id="confirm-new-password" autoComplete="new-password" required value={passwords.confirmPassword} onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Use at least 8 characters, including one letter and one number.</p>
            {passwordState.error?.data?.message && !passwordError && (
              <p className="text-sm text-destructive" role="alert">{passwordState.error.data.message}</p>
            )}
            <Button type="submit" isLoading={passwordState.isLoading}>
              <LogOut className="mr-2 h-4 w-4" /> Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
