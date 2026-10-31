import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginSchema } from "./schemas";
import { useLoginMutation } from "./api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Briefcase, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [login, { isLoading, error: apiError }] = useLoginMutation();

  const from = location.state?.from?.pathname || null;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      const response = await login(values).unwrap();
      toast({
        title: "Welcome back!",
        description: `Signed in as ${response.user?.name || "User"}.`,
        variant: "success",
      });

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      // Default role redirect
      const role = response.user?.role;
      if (role === "applicant") {
        navigate("/applicant/dashboard", { replace: true });
      } else if (role === "recruiter") {
        navigate("/recruiter/dashboard", { replace: true });
      } else if (role === "admin") {
        navigate("/admin/users", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      if (err.data?.errors && Array.isArray(err.data.errors)) {
        err.data.errors.forEach((validationErr) => {
          if (validationErr.field) {
            setError(validationErr.field, { message: validationErr.message });
          }
        });
      }
    }
  };

  const serverErrorMessage =
    apiError?.data?.message || (apiError?.status === "FETCH_ERROR" ? "Cannot reach server. Check your connection or API status." : null);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-muted">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground mb-3 shadow-sm">
            <Briefcase className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your HirePulse account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {serverErrorMessage && (
            <div className="mb-4 flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverErrorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                error={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground" htmlFor="password">
                  Password
                </label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                error={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              Sign In
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col border-t pt-4 text-center text-sm text-muted-foreground">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

