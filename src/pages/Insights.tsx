import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type Entry = { id: string; mood_score: number | null; sentiment: string | null; emotions: string[] | null; themes: string[] | null; created_at: string };
type Insight = { summary: string; patterns: string[]; suggestions: string[]; dominant_emotions: string[] };

const Insights = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("journal_entries")
        .select("id,mood_score,sentiment,emotions,themes,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setEntries((data as Entry[]) ?? []);
    })();
  }, [user]);

  const generate = async () => {
    if (entries.length === 0) { toast.error("Write a few journal entries first"); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("insights", { body: { entries } });
      if (error || !data || data.error) throw new Error(data?.error || error?.message || "AI error");
      setInsight(data as Insight);
    } catch (e: any) { toast.error(e?.message || "Couldn't generate insights"); }
    finally { setBusy(false); }
  };

  // Last 14 days mood sparkline
  const recent = [...entries].reverse().slice(-14);
  const max = 10;
  const moodColor = (s: number | null) =>
    s == null ? "hsl(var(--muted))" : s >= 7 ? "hsl(var(--mood-high))" : s >= 4 ? "hsl(var(--mood-mid))" : "hsl(var(--mood-low))";

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <main className="flex-1 container max-w-4xl py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="h-4 w-4" /> Patterns</div>
          <h1 className="font-display text-4xl">Your inner weather</h1>
          <p className="text-muted-foreground">Notice the rhythms beneath your weeks.</p>
        </div>

        <section className="bg-card/80 backdrop-blur rounded-3xl p-6 shadow-card border border-border/40 mb-6">
          <h2 className="font-display text-2xl mb-4">Mood over time</h2>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">Write your first journal entry to see your mood take shape here.</p>
          ) : (
            <div className="flex items-end gap-2 h-44">
              {recent.map((e) => (
                <div key={e.id} className="flex-1 flex flex-col items-center gap-2" title={`${new Date(e.created_at).toLocaleDateString()} · ${e.mood_score ?? "?"}/10`}>
                  <div
                    className="w-full rounded-t-xl rounded-b-md transition-soft hover:opacity-80"
                    style={{
                      height: `${((e.mood_score ?? 0) / max) * 100}%`,
                      minHeight: "8px",
                      background: moodColor(e.mood_score),
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleDateString(undefined, { month: "numeric", day: "numeric" })}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-gradient-warm rounded-3xl p-6 shadow-soft mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-display text-2xl mb-1">AI pattern read</h2>
            <p className="text-sm text-foreground/70">Let Solace reflect on your last {entries.length || 0} entries.</p>
          </div>
          <Button onClick={generate} disabled={busy || entries.length === 0} className="rounded-full bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 mr-2" /> {busy ? "Reading..." : "Generate insight"}
          </Button>
        </section>

        {insight && (
          <section className="bg-card/80 backdrop-blur rounded-3xl p-6 shadow-card border border-border/40 animate-fade-up space-y-5">
            <p className="text-lg font-display leading-relaxed">{insight.summary}</p>

            {insight.dominant_emotions?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Threads of feeling</div>
                <div className="flex flex-wrap gap-1.5">
                  {insight.dominant_emotions.map((e) => <span key={e} className="text-sm px-3 py-1 rounded-full bg-accent-soft">{e}</span>)}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Patterns</div>
              <ul className="space-y-2">
                {insight.patterns.map((p, i) => <li key={i} className="rounded-2xl bg-muted/60 p-3 text-sm">{p}</li>)}
              </ul>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Tiny next steps</div>
              <ul className="space-y-2">
                {insight.suggestions.map((s, i) => <li key={i} className="rounded-2xl bg-primary-soft/60 p-3 text-sm">✦ {s}</li>)}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Insights;
