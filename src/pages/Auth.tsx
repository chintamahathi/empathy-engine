import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const signUpSchema = z.object({
  displayName: z.string().trim().min(1, "Please share a name").max(60),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});
const signInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});
type SignIn = z.infer<typeof signInSchema>;

const Auth = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/companion" replace />;

  const onSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      displayName: f.get("displayName"),
      email: f.get("email"),
      password: f.get("password"),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/companion`,
        data: { display_name: parsed.data.displayName },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome to Solace 💛");
    nav("/companion");
  };

  const onSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({ email: f.get("email"), password: f.get("password") });
    if (!parsed.success) { toast.error("Please check your email and password"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    nav("/companion");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-sky">
      <header className="container py-6">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <img src="/logo.png" alt="Solace Logo" className="h-8 w-8 object-contain" />
          <span className="font-display text-2xl">Solace</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md glass rounded-3xl p-8 shadow-soft border border-border/40 animate-fade-up">
          <h1 className="font-display text-3xl text-center mb-1">Take a breath.</h1>
          <p className="text-center text-muted-foreground text-sm mb-6">Your private space awaits.</p>

          <Tabs defaultValue="signup">
            <TabsList className="grid grid-cols-2 w-full rounded-full bg-muted">
              <TabsTrigger value="signup" className="rounded-full">Sign up</TabsTrigger>
              <TabsTrigger value="signin" className="rounded-full">Sign in</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <form onSubmit={onSignUp} className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="displayName">What should we call you?</Label>
                  <Input id="displayName" name="displayName" placeholder="Your name" className="rounded-xl" required maxLength={60} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" className="rounded-xl" required maxLength={255} />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="6+ characters" className="rounded-xl" required minLength={6} maxLength={72} />
                </div>
                <Button type="submit" disabled={busy} className="w-full h-11 rounded-full bg-gradient-primary shadow-glow">
                  {busy ? "Creating your space..." : "Begin gently"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signin">
              <form onSubmit={onSignIn} className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" name="email" type="email" className="rounded-xl" required maxLength={255} />
                </div>
                <div>
                  <Label htmlFor="password2">Password</Label>
                  <Input id="password2" name="password" type="password" className="rounded-xl" required maxLength={72} />
                </div>
                <Button type="submit" disabled={busy} className="w-full h-11 rounded-full bg-gradient-primary shadow-glow">
                  {busy ? "Welcoming you back..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Auth;
