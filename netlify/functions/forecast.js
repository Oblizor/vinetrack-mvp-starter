export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback demo mode
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forecast: "Demo mode: No OPENAI_API_KEY set. Assuming healthy fermentation. ETA ~3-5 days to dry. No anomalies detected.",
          demo: true
        })
      };
    }
    const payload = JSON.parse(event.body || "{}");
    const { tankName = "Tank", readings = [] } = payload;

    // Build a compact prompt using recent readings
    const latest = readings.slice(-7); // last 7 entries
    const summaryLines = latest.map(r => {
      const d = r.date || r.timestamp || "unknown date";
      const sugar = (r.brix != null) ? `${r.brix} Brix` : (r.sg != null) ? `SG ${r.sg}` : "sugar ?";
      const temp = (r.temp != null) ? `${r.temp}°C` : "?°C";
      return `- ${d}: ${sugar}, ${temp}`;
    }).join("\n");

    const system = "You are an expert winemaking assistant. Be concise (max 4 sentences).";
    const user = `Fermentation readings for ${tankName} (most recent last):\n${summaryLines}\n\nTasks:\n1) Estimate days to dryness from now.\n2) Flag anomalies (stuck/slow or temp too high/low) with short reasons.\n3) Give 1 actionable suggestion if needed (nutrients, temp control, punchdown).\nRespond in Romanian.`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return { statusCode: resp.status, body: text };
    }
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "Nicio predicție disponibilă.";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forecast: content, demo: false })
    };
  } catch (err) {
    return { statusCode: 500, body: `Error: ${err.message}` };
  }
}
