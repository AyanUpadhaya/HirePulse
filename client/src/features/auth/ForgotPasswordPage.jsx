import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Briefcase, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useRequestPasswordResetMutation } from "./api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const [requestReset, { isLoading, error }] = useRequestPasswordResetMutation();

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      await requestReset(email.trim()).unwrap();
      setSubmitted(true);
    } catch (requestError) {
      toast({
        title: "Unable to request a reset",
        description: requestError.data?.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground mb-3">
            <Briefcase className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl">Forgot your password?</CardTitle>
          <CardDescription>
            Enter your account email and we’ll send you a password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">
                If an account exists for that email, password reset instructions have been sent.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error?.data?.message && (
                <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                  {error.data.message}
                </p>
              )}
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="text-sm font-medium">Email address</label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Send reset link
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remembered it? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
