import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { CrisisDialog } from "@/components/CrisisDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Feather } from "lucide-react";
import { toast } from "sonner";

type Entry = {
  id: string; content: string; mood_score: number | null; sentiment: string | null;
  emotions: string[] | null; themes: string[] | null; ai_reflection: string | null;
  risk_level: string | null; created_at: string;
};

const moodLabel = (s: number | null) =>
  s == null ? "—" : s >= 8 ? "Bright" : s >= 6 ? "Steady" : s >= 4 ? "Mixed" : s >= 2 ? "Heavy" : "Very low";

const Journal = () => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [crisis, setCrisis] = useState(false);
  const [crisisSeverity, setCrisisSeverity] = useState<"medium" | "high">("high");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setEntries((data as Entry[]) ?? []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const save = async () => {
    const text = content.trim();
    if (!text || !user || busy) return;
    if (text.length > 8000) { toast.error("Entry is too long (max 8000 chars)"); return; }
    setBusy(true);
    try {
      const { data: analysis, error } = await supabase.functions.invoke("analyze-journal", { body: { content: text } });
      if (error || !analysis || analysis.error) { throw new Error(analysis?.error || error?.message || "AI error"); }
      const { error: insErr } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        content: text,
        mood_score: analysis.mood_score,
        sentiment: analysis.sentiment,
        emotions: analysis.emotions,
        themes: analysis.themes,
        ai_reflection: analysis.ai_reflection,
        risk_level: analysis.risk_level,
      });
      if (insErr) throw insErr;
      setContent("");
      toast.success("Held safely 💛");
      if (analysis.risk_level === "high" || analysis.risk_level === "medium") {
        setCrisisSeverity(analysis.risk_level); setCrisis(true);
      }
      load();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't save entry");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <main className="flex-1 container max-w-3xl py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Feather className="h-4 w-4" /> Today</div>
          <h1 className="font-display text-4xl mb-1">What's alive in you?</h1>
          <p className="text-muted-foreground">Write freely. Solace will gently mirror what it hears.</p>
        </div>

        <div className="glass rounded-3xl p-5 shadow-soft border border-border/40 mb-10">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Today I noticed..."
            rows={8}
            maxLength={8000}
            className="border-0 bg-transparent focus-visible:ring-0 resize-none text-base leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/40">
            <span className="text-xs text-muted-foreground">{content.length} / 8000</span>
            <Button onClick={save} disabled={busy || !content.trim()} className="rounded-full bg-gradient-primary shadow-glow">
              {busy ? "Reflecting..." : <><Sparkles className="h-4 w-4 mr-2" /> Hold this entry</>}
            </Button>
          </div>
        </div>

        <h2 className="font-display text-2xl mb-4">Past entries</h2>
        <div className="space-y-4">
          {entries.length === 0 && (
            <div className="text-center text-muted-foreground py-12">No entries yet. Your first one starts a quiet record.</div>
          )}
          {entries.map((e) => (
            <article key={e.id} className="bg-card/80 backdrop-blur rounded-3xl p-6 shadow-card border border-border/40 animate-fade-up">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <time>{new Date(e.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>
                <span className="px-2.5 py-0.5 rounded-full bg-muted">Mood: {moodLabel(e.mood_score)} {e.mood_score && `· ${e.mood_score}/10`}</span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-foreground/90 mb-4">{e.content}</p>
              {e.emotions && e.emotions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {e.emotions.map((em) => <span key={em} className="text-xs px-2.5 py-1 rounded-full bg-accent-soft">{em}</span>)}
                  {e.themes?.map((t) => <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-primary-soft">{t}</span>)}
                </div>
              )}
              {e.ai_reflection && (
                <div className="rounded-2xl bg-primary-soft/50 p-4 text-sm leading-relaxed">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><Sparkles className="h-3 w-3" /> Solace reflects</div>
                  {e.ai_reflection}
                </div>
              )}
            </article>
          ))}
        </div>
      </main>
      <CrisisDialog open={crisis} onOpenChange={setCrisis} severity={crisisSeverity} />
    </div>
  );
};

export default Journal;
