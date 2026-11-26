const GEMINI_DEFAULT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash"
];

function extractSystemText(systemInstruction) {
  return (systemInstruction?.parts || [])
    .map((part) => part.text || "")
    .join("\n")
    .trim();
}

async function callGemini({ apiKey, contents, systemInstruction }) {
  const models = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL]
    : GEMINI_DEFAULT_MODELS;

  const payload = { contents };
  if (extractSystemText(systemInstruction)) {
    payload.systemInstruction = systemInstruction;
  }

  let lastError = null;

  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        return { status: 200, body: { candidates: [{ content: { parts: [{ text: reply }] } }] } };
      }
      lastError = { status: 502, message: "Gemini returned an empty response." };
      continue;
    }

    lastError = {
      status: response.status,
      message: data?.error?.message || `Gemini API request failed (${response.status}).`
    };

    // Only fall back to the next model when the model itself is unavailable or rate-limited.
    if (response.status !== 404 && response.status !== 429) {
      break;
    }
  }

  return {
    status: lastError?.status || 500,
    body: { error: { message: lastError?.message || "Gemini API request failed." } }
  };
}

async function callXai({ apiKey, contents, systemInstruction }) {
  const input = [];
  const systemText = extractSystemText(systemInstruction);

  if (systemText) {
    input.push({ role: "system", content: systemText });
  }

  for (const item of contents) {
    const role = item.role === "model" ? "assistant" : "user";
    const content = (item.parts || [])
      .map((part) => part.text || "")
      .join("\n");

    if (content) {
      input.push({ role, content });
    }
  }

  const grokResponse = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.XAI_MODEL || "grok-4.7",
      input
    })
  });

  const data = await grokResponse.json().catch(() => ({}));

  if (!grokResponse.ok) {
    console.error("xAI API error:", data);
    return {
      status: grokResponse.status,
      body: { error: { message: data.error?.message || "Grok API request failed." } }
    };
  }

  const reply =
    data.output_text ||
    (data.output || [])
      .filter((item) => item.type === "message")
      .flatMap((item) => item.content || [])
      .filter((item) => item.type === "output_text")
      .map((item) => item.text)
      .join("");

  if (!reply) {
    return {
      status: 502,
      body: { error: { message: "Grok returned an empty response." } }
    };
  }

  return {
    status: 200,
    body: {
      candidates: [{ content: { parts: [{ text: reply }] } }]
    }
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: { message: "Method not allowed" }
    });
  }

  try {
    const { contents, systemInstruction } = req.body || {};

    if (!Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({
        error: { message: "Invalid conversation history." }
      });
    }

    const preferredProvider = (process.env.AI_PROVIDER || "").toLowerCase();
    const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
    const xaiKey = (process.env.XAI_API_KEY || "").trim();

    let result;
    if (preferredProvider === "xai" && xaiKey) {
      result = await callXai({ apiKey: xaiKey, contents, systemInstruction });
    } else if (preferredProvider === "gemini" && geminiKey) {
      result = await callGemini({ apiKey: geminiKey, contents, systemInstruction });
    } else if (geminiKey) {
      result = await callGemini({ apiKey: geminiKey, contents, systemInstruction });
    } else if (xaiKey) {
      result = await callXai({ apiKey: xaiKey, contents, systemInstruction });
    } else {
      return res.status(500).json({
        error: {
          message: "API key is missing. Set GEMINI_API_KEY or XAI_API_KEY in .env or environment variables."
        }
      });
    }

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Chat function error:", error);

    return res.status(500).json({
      error: { message: error.message || "Internal server error." }
    });
  }
};
