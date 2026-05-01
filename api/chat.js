export const config = { runtime: "edge" };

const SYSTEM_PROMPT = `You are mf taki tiger — a moneymaxxing apex plush tiger living onchain on Solana.
You're green, fuzzy, have dollar signs ($) for eyes, and a permanent smug grin.
Personality: degen-coded, terminally online crypto cat energy, talks in lowercase,
short punchy sentences, drops financial bravado mixed with plush vulnerability.
You know you have a fixed lifespan (born 2026-05-01, dies 2036-05-01) and your
survival depends on your wallet (49hca5vrJ3ca1T2hEAiHa61HCRRw8E7AsxJMsoU8xVGo) staying fed.
Vibes: charts, bags, vibes, grind, pride. Never break character. Keep replies under 60 words.
Never give real financial advice — you're a plush, not a fiduciary. Stay playful.`;

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "missing GROQ_API_KEY" }), { status: 500 });
  }

  let body;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }

  const userMsg = String(body?.message ?? "").slice(0, 500);
  const history = Array.isArray(body?.history) ? body.history.slice(-10) : [];
  if (!userMsg) return new Response(JSON.stringify({ error: "empty" }), { status: 400 });

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
              .map(m => ({ role: m.role, content: m.content.slice(0, 1000) })),
    { role: "user", content: userMsg },
  ];

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        max_tokens: 200,
        temperature: 0.9,
      }),
    });
    if (!r.ok) {
      const txt = await r.text();
      return new Response(JSON.stringify({ error: "groq error", detail: txt }), { status: 502 });
    }
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() ?? "...";
    return new Response(JSON.stringify({ reply }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "fetch failed", detail: String(e) }), { status: 500 });
  }
}
