import { useEffect, useRef, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { CrisisDialog } from "@/components/CrisisDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  emotions?: string[];
  coping_strategies?: string[];
  risk_level?: string;
};

const Companion = () => {
  const { user } = useAuth();
  const [convoId, setConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [crisisSeverity, setCrisisSeverity] = useState<"medium" | "high">("high");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Init or load most recent conversation
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1);
      let id = convos?.[0]?.id;
      if (!id) {
        const { data: created } = await supabase
          .from("conversations")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        id = created?.id;
      }
      if (!id) return;
      setConvoId(id);
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      if (msgs && msgs.length) {
        setMessages(msgs.map((m: any) => ({
          id: m.id, role: m.role, content: m.content,
          emotions: m.emotions, coping_strategies: m.coping_strategies, risk_level: m.risk_level,
        })));
      } else {
        setMessages([{
          role: "assistant",
          content: "Hi, I'm Solace. There's no right or wrong thing to say here — share whatever's on your mind, even if it doesn't feel important. I'm listening.",
        }]);
      }
    })();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || !convoId || !user || busy) return;
    setBusy(true);
    const userMsg: Msg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    await supabase.from("chat_messages").insert({
      conversation_id: convoId, user_id: user.id, role: "user", content: text,
    });

    try {
      const history = [...messages, userMsg].slice(-12).map(({ role, content }) => ({ role, content }));
      const { data, error } = await supabase.functions.invoke("empath-chat", { body: { messages: history } });
      if (error || !data || data.error) {
        toast.error(data?.error || error?.message || "Couldn't reach Solace");
        setBusy(false);
        return;
      }
      const reply: Msg = {
        role: "assistant",
        content: data.message,
        emotions: data.emotions,
        coping_strategies: data.coping_strategies,
        risk_level: data.risk_level,
      };
      setMessages((m) => [...m, reply]);
      await supabase.from("chat_messages").insert({
        conversation_id: convoId, user_id: user.id, role: "assistant",
        content: reply.content, emotions: reply.emotions ?? [],
        coping_strategies: reply.coping_strategies ?? [], risk_level: reply.risk_level ?? "none",
        sentiment: data.sentiment,
      });
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convoId);

      if (data.risk_level === "high" || data.risk_level === "medium") {
        setCrisisSeverity(data.risk_level);
        setCrisis(true);
      }
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <main className="flex-1 container max-w-3xl py-6 flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1" style={{ maxHeight: "calc(100vh - 240px)" }}>
          {messages.map((m, i) => (
            <div key={m.id ?? i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}>
              <div className={`max-w-[85%] rounded-3xl px-5 py-3 shadow-card ${
                m.role === "user" ? "bg-gradient-primary text-primary-foreground rounded-br-md" : "bg-card border border-border/40 rounded-bl-md"
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                {m.role === "assistant" && m.emotions && m.emotions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.emotions.map((e) => (
                      <span key={e} className="text-xs px-2.5 py-1 rounded-full bg-accent-soft text-foreground/80">{e}</span>
                    ))}
                  </div>
                )}
                {m.role === "assistant" && m.coping_strategies && m.coping_strategies.length > 0 && (
                  <div className="mt-3 p-3 rounded-2xl bg-primary-soft/60">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                      <Sparkles className="h-3 w-3" /> Things to try
                    </div>
                    <ul className="space-y-1 text-sm">
                      {m.coping_strategies.map((s, idx) => <li key={idx}>• {s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start"><div className="bg-card border border-border/40 rounded-3xl rounded-bl-md px-5 py-4 flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary/60 animate-breathe" />
              <div className="h-2 w-2 rounded-full bg-primary/60 animate-breathe" style={{ animationDelay: "0.3s" }} />
              <div className="h-2 w-2 rounded-full bg-primary/60 animate-breathe" style={{ animationDelay: "0.6s" }} />
            </div></div>
          )}
        </div>

        <div className="glass rounded-3xl p-3 shadow-soft border border-border/40 flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Share whatever's on your mind..."
            rows={1}
            maxLength={2000}
            className="flex-1 min-h-[48px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 px-3"
          />
          <Button onClick={send} disabled={busy || !input.trim()} size="icon" className="h-12 w-12 rounded-2xl bg-gradient-primary shadow-glow shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </main>
      <CrisisDialog open={crisis} onOpenChange={setCrisis} severity={crisisSeverity} />
    </div>
  );
};

export default Companion;
