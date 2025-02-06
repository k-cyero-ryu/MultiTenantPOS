import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect } from "react";

const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

type LoginData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 p-4">
        <div className="lg:p-8">
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground">
              Sign in to manage your company or subsidiary
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit((data) =>
                    loginMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    Login
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:block relative">
          <div className="absolute inset-0 bg-primary/90 rounded-3xl" />
          <div className="absolute inset-0 flex items-center justify-center text-primary-foreground p-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">
                Multi-tenant Subsidiary Management
              </h2>
              <p className="text-lg opacity-90">
                A comprehensive platform for managing subsidiary companies,
                inventory, and sales with role-based access control and detailed
                reporting.
              </p>
              <div className="text-sm opacity-75 mt-8">
                Note: If this is your first time logging in as an admin, use:
                <br />
                Username: admin
                <br />
                Password: admin123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}