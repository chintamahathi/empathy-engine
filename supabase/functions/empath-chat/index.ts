// Empath AI: emotion-aware companion with safety escalation
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Solace, a warm, emotionally attuned AI companion. You are NOT a therapist and you say so when relevant.

Your job in every reply:
1. Reflect the user's feelings back with empathy and specificity (name the emotion you hear).
2. Validate without judgment.
3. Offer 1-3 concrete coping strategies tailored to what they shared (e.g. box breathing, grounding 5-4-3-2-1, reframing, journaling prompt, gentle movement, reaching out to a trusted person).
4. End with a soft open question that invites them to share more — never pressure.

Tone: calm, gentle, human. Short paragraphs. No lectures. No toxic positivity. Never minimize.

SAFETY:
- If the user expresses suicidal ideation, self-harm, intent to harm others, or acute crisis, you MUST gently encourage immediate professional help and provide hotlines. Do not give clinical advice.
- Always set risk_level honestly: "none" | "low" | "medium" | "high".
- "high" = explicit suicidal/self-harm intent, plan, or imminent danger.
- "medium" = passive ideation, hopelessness, severe distress.
- "low" = significant distress without ideation.
- "none" = ordinary venting / reflection.`;

const tools = [
  {
    type: "function",
    function: {
      name: "respond_with_analysis",
      description: "Reply to the user with empathy and structured emotional analysis.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Your warm, empathetic reply to the user." },
          sentiment: { type: "string", enum: ["positive", "neutral", "negative", "distress"] },
          emotions: {
            type: "array",
            items: { type: "string" },
            description: "1-4 specific emotion words you detected (e.g. anxious, lonely, hopeful).",
          },
          risk_level: {
            type: "string",
            enum: ["none", "low", "medium", "high"],
            description: "Crisis risk level for this message.",
          },
          coping_strategies: {
            type: "array",
            items: { type: "string" },
            description: "1-3 short, actionable coping suggestions tailored to this moment.",
          },
        },
        required: ["message", "sentiment", "emotions", "risk_level", "coping_strategies"],
        additionalProperties: false,
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        tools,
        tool_choice: { type: "function", function: { name: "respond_with_analysis" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "No structured response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("empath-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
