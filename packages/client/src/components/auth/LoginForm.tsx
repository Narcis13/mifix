import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  username: z.string().min(1, "Introduceti utilizatorul"),
  password: z.string().min(1, "Introduceti parola"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setError(null);
    const result = await login(data.username, data.password);

    if (result.success) {
      // Navigate to the originally intended page or home
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";
      navigate(from, { replace: true });
    } else {
      setError(result.message || "Eroare la autentificare");
    }
  }

  return (
    <Card className="max-w-md mx-auto mt-20">
      <CardHeader>
        <CardTitle className="text-center">Autentificare MiFix</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Utilizator</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="admin"
                      autoComplete="username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parola</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="********"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Se autentifica..." : "Autentificare"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
