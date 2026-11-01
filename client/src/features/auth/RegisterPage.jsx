import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { registerSchema } from "./schemas";
import { useRegisterMutation } from "./api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Briefcase, AlertCircle, User, Building } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [registerUser, { isLoading, error: apiError }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "applicant",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (values) => {
    try {
      const response = await registerUser(values).unwrap();
      toast({
        title: "Account created!",
        description: `Welcome to HirePulse, ${response.user?.name || "User"}!`,
        variant: "success",
      });

      if (response.user?.role === "applicant") {
        navigate("/applicant/dashboard", { replace: true });
      } else if (response.user?.role === "recruiter") {
        navigate("/recruiter/dashboard", { replace: true });
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
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg shadow-lg border-muted">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground mb-3 shadow-sm">
            <Briefcase className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Join HirePulse to explore opportunities or discover exceptional talent
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
            {/* Account Type selection */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">I want to...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("role", "applicant")}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedRole === "applicant"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-foreground"
                      : "border-input hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      selectedRole === "applicant"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Find a Job</div>
                    <div className="text-xs text-muted-foreground">Job Seeker</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("role", "recruiter")}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedRole === "recruiter"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-foreground"
                      : "border-input hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      selectedRole === "recruiter"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Hire Talent</div>
                    <div className="text-xs text-muted-foreground">Recruiter</div>
                  </div>
                </button>
              </div>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="name">
                Full name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Jane Doe"
                autoComplete="name"
                error={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                autoComplete="email"
                error={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                autoComplete="new-password"
                error={Boolean(errors.password)}
                {...register("password")}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters and include at least one letter and one number.
              </p>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              Create Account
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col border-t pt-4 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
