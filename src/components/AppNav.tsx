import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageCircleHeart, BookHeart, Sparkles, LogOut, LifeBuoy } from "lucide-react";
import { useState } from "react";
import { CrisisDialog } from "./CrisisDialog";

const links = [
  { to: "/companion", label: "Companion", icon: MessageCircleHeart },
  { to: "/journal", label: "Journal", icon: BookHeart },
  { to: "/insights", label: "Insights", icon: Sparkles },
];

export const AppNav = () => {
  const { signOut, user } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [crisis, setCrisis] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="container flex items-center justify-between py-4">
        <Link to="/companion" className="flex items-center gap-2">
          <img src="/logo.png" alt="Solace Logo" className="h-8 w-8 object-contain" />
          <span className="font-display text-2xl">Solace</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-soft ${
                  active ? "bg-primary-soft text-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCrisis(true)} className="gap-2 text-foreground">
            <LifeBuoy className="h-4 w-4 text-destructive" /> <span className="hidden sm:inline">Crisis help</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={async () => { await signOut(); nav("/"); }} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* mobile nav */}
      <nav className="md:hidden flex items-center justify-around border-t border-border/50 py-2">
        {links.map(({ to, label, icon: Icon }) => {
          const active = loc.pathname.startsWith(to);
          return (
            <Link key={to} to={to} className={`flex flex-col items-center gap-0.5 text-xs px-3 py-1 rounded-lg ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="h-5 w-5" /> {label}
            </Link>
          );
        })}
      </nav>
      <CrisisDialog open={crisis} onOpenChange={setCrisis} />
      {user && <span className="sr-only">Signed in as {user.email}</span>}
    </header>
  );
};
