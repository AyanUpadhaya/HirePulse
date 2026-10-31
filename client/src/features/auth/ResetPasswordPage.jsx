import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, Briefcase, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useResetPasswordMutation } from "./api";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [complete, setComplete] = useState(false);
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();

  const onSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password) || password.length < 8) {
      setLocalError("Use at least 8 characters, including a letter and a number.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    try {
      await resetPassword({ token, password }).unwrap();
      setComplete(true);
    } catch {
      setLocalError("");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground mb-3">
            <Briefcase className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl">{complete ? "Password updated" : "Choose a new password"}</CardTitle>
          <CardDescription>
            {complete ? "Your password has been reset. Sign in with your new password." : "Create a strong password for your HirePulse account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {complete ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <Link to="/login" className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
                Continue to sign in
              </Link>
            </div>
          ) : !token ? (
            <div className="space-y-4 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <p className="text-sm text-muted-foreground">This reset link is missing its token. Request a new link to continue.</p>
              <Link to="/forgot-password" className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
                Request a reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {(localError || error?.data?.message) && (
                <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                  {localError || error.data.message}
                </p>
              )}
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-sm font-medium">New password</label>
                <Input id="new-password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-sm font-medium">Confirm new password</label>
                <Input id="confirm-password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">At least 8 characters, including one letter and one number.</p>
              <Button type="submit" className="w-full" isLoading={isLoading}>Reset password</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
