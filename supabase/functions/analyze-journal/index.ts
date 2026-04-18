// Journal entry analyzer: sentiment, emotions, themes, gentle reflection, risk level.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You analyze personal journal entries with deep empathy.
Return: mood_score (1-10, 1=very low, 10=joyful), sentiment, emotions (1-5), themes (1-4 short phrases like "work stress","loneliness","creative spark"), a 2-3 sentence gentle reflection that mirrors back what you heard and offers one tiny next step, and risk_level.
Risk levels:
- high: explicit self-harm/suicidal intent or plan
- medium: passive suicidal ideation, severe hopelessness
- low: significant distress without ideation
- none: ordinary
Never diagnose. Be warm and non-clinical.`;

const tools = [
  {
    type: "function",
    function: {
      name: "analyze_entry",
      parameters: {
        type: "object",
        properties: {
          mood_score: { type: "integer", minimum: 1, maximum: 10 },
          sentiment: { type: "string", enum: ["positive", "neutral", "negative", "distress"] },
          emotions: { type: "array", items: { type: "string" } },
          themes: { type: "array", items: { type: "string" } },
          ai_reflection: { type: "string" },
          risk_level: { type: "string", enum: ["none", "low", "medium", "high"] },
        },
        required: ["mood_score", "sentiment", "emotions", "themes", "ai_reflection", "risk_level"],
        additionalProperties: false,
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { content } = await req.json();
    if (!content || typeof content !== "string" || content.length > 8000) {
      return new Response(JSON.stringify({ error: "Invalid content" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Journal entry:\n\n${content}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "analyze_entry" } },
      }),
    });
    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text(); console.error("gateway", resp.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "err" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
