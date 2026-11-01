import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { KeyRound, UserRound, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useToast } from "@/components/ui/Toast";
import { logout, selectCurrentUser } from "@/features/auth/authSlice";
import { useChangePasswordMutation, useUpdateAccountMutation } from "@/features/auth/api";
import { baseApi } from "@/lib/baseApi";

export function SettingsPage() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [updateAccount, accountState] = useUpdateAccountMutation();
  const [changePassword, passwordState] = useChangePasswordMutation();
  const [account, setAccount] = useState({ name: "", email: "", avatar: "", currentPassword: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [accountError, setAccountError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    setAccount({
      name: user?.name || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
      currentPassword: "",
    });
  }, [user]);

  const onAccountSubmit = async (event) => {
    event.preventDefault();
    setAccountError("");
    const email = account.email.trim().toLowerCase();
    if (email !== user?.email && !account.currentPassword) {
      setAccountError("Enter your current password to change your email address.");
      return;
    }

    try {
      await updateAccount({
        name: account.name.trim(),
        email,
        avatar: account.avatar.trim() || null,
        ...(email !== user?.email ? { currentPassword: account.currentPassword } : {}),
      }).unwrap();
      setAccount((previous) => ({ ...previous, currentPassword: "" }));
      toast({ title: "Account updated", description: "Your account details have been saved.", variant: "success" });
    } catch (error) {
      setAccountError(error.data?.message || "Could not update your account. Please try again.");
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
              <CardDescription>Update your name, email address, or profile photo.</CardDescription>
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
                <Input id="account-email" type="email" autoComplete="email" required value={account.email} onChange={(event) => setAccount({ ...account, email: event.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="account-avatar" className="text-sm font-medium">Avatar image URL</label>
              <Input id="account-avatar" type="url" placeholder="https://example.com/photo.jpg" value={account.avatar} onChange={(event) => setAccount({ ...account, avatar: event.target.value })} />
              <p className="text-xs text-muted-foreground">Leave blank to remove your current avatar.</p>
            </div>
            {account.email.trim().toLowerCase() !== user?.email && (
              <div className="space-y-1.5">
                <label htmlFor="email-current-password" className="text-sm font-medium">Current password (required to change email)</label>
                <PasswordInput id="email-current-password" autoComplete="current-password" value={account.currentPassword} onChange={(event) => setAccount({ ...account, currentPassword: event.target.value })} />
              </div>
            )}
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
