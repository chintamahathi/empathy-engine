// Generates a weekly emotional pattern insight from recent journal entries (passed by client).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are an empathetic pattern reader. Given a user's recent journal entries (with dates, mood scores, emotions, themes), find 2-4 meaningful emotional patterns or trends and offer 2-3 gentle, personalized suggestions. Never diagnose. Be warm.`;

const tools = [{
  type: "function",
  function: {
    name: "summarize_patterns",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "2-3 sentence warm overview." },
        patterns: { type: "array", items: { type: "string" } },
        suggestions: { type: "array", items: { type: "string" } },
        dominant_emotions: { type: "array", items: { type: "string" } },
      },
      required: ["summary", "patterns", "suggestions", "dominant_emotions"],
      additionalProperties: false,
    },
  },
}];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { entries } = await req.json();
    if (!Array.isArray(entries) || entries.length === 0) {
      return new Response(JSON.stringify({ error: "No entries" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const KEY = Deno.env.get("GEMINI_API_KEY");
    if (!KEY) throw new Error("GEMINI_API_KEY not configured");
    const compact = entries.slice(0, 30).map((e: any) => ({
      date: e.created_at, mood: e.mood_score, emotions: e.emotions, themes: e.themes, sentiment: e.sentiment,
    }));
    const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Recent entries (JSON):\n${JSON.stringify(compact)}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "summarize_patterns" } },
      }),
    });
    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "err" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
