import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircleHeart, BookHeart, Sparkles, ShieldCheck } from "lucide-react";

const Landing = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/companion" replace />;

  return (
    <div className="min-h-screen bg-gradient-sky">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Solace Logo" className="h-8 w-8 object-contain" />
          <span className="font-display text-2xl">Solace</span>
        </div>
        <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
      </header>

      <main>
        <section className="container pt-12 pb-24 grid md:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-soft text-sm">
              <ShieldCheck className="h-4 w-4" /> Private. Gentle. Safe escalation.
            </span>
            <h1 className="font-display text-5xl md:text-6xl mt-6 leading-[1.05]">
              A quiet place<br />for everything<br /><em className="text-primary not-italic">you're feeling.</em>
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-md">
              Solace is an emotionally attuned companion. Talk through your day, journal your feelings,
              and notice the patterns — with caring escalation when you need real human support.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/auth"><Button size="lg" className="rounded-full px-8 h-12 bg-gradient-primary shadow-glow">Begin gently</Button></Link>
              <Link to="/auth"><Button size="lg" variant="ghost" className="rounded-full">I have an account</Button></Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-sunrise rounded-[3rem] blur-3xl opacity-60" />
            <div className="relative glass rounded-[2.5rem] p-8 shadow-soft animate-float-slow">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="Solace Logo" className="h-10 w-10 object-contain" />
                <div>
                  <div className="font-medium">Solace</div>
                  <div className="text-xs text-muted-foreground">listening...</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-muted rounded-2xl rounded-tl-sm p-4 text-sm">
                  It sounds like you've been carrying a quiet kind of heavy this week — like nothing's wrong,
                  but nothing feels light either. That's a real thing to feel. 💛
                </div>
                <div className="bg-primary-soft rounded-2xl p-4 text-sm">
                  <div className="text-xs text-muted-foreground mb-2">A small thing to try</div>
                  Try the 4-7-8 breath: inhale for 4, hold for 7, exhale for 8. Three rounds.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container pb-24 grid md:grid-cols-3 gap-6">
          {[
            { icon: MessageCircleHeart, title: "Companion chat", body: "Reflective conversations that name what you're feeling and offer tiny, doable coping steps." },
            { icon: BookHeart, title: "Sentient journaling", body: "Write freely. Solace surfaces emotions, themes and a gentle reflection for each entry." },
            { icon: Sparkles, title: "Pattern insights", body: "See your moods over time and discover the rhythms beneath your weeks." },
          ].map((f) => (
            <div key={f.title} className="bg-card/70 backdrop-blur rounded-3xl p-6 shadow-card border border-border/40">
              <div className="h-12 w-12 rounded-2xl bg-primary-soft flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-2xl mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="container py-10 text-center text-xs text-muted-foreground">
        Solace is a supportive companion, not a substitute for professional care. In crisis? Call or text 988.
      </footer>
    </div>
  );
};

export default Landing;
