
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: { message: "Method not allowed" }
    });
  }

  try {
    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: { message: "XAI_API_KEY is missing in Vercel." }
      });
    }

    const { contents, systemInstruction } = req.body || {};

    if (!Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({
        error: { message: "Invalid conversation history." }
      });
    }

    const input = [];

    const systemText = systemInstruction?.parts
      ?.map(part => part.text || "")
      .join("\n");

    if (systemText) {
      input.push({
        role: "system",
        content: systemText
      });
    }

    for (const item of contents) {
      const role = item.role === "model" ? "assistant" : "user";
      const content = (item.parts || [])
        .map(part => part.text || "")
        .join("\n");

      if (content) {
        input.push({ role, content });
      }
    }

    const grokResponse = await fetch(
      "https://api.x.ai/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "grok-4.7",
          input
        })
      }
    );

    const data = await grokResponse.json();

    if (!grokResponse.ok) {
      console.error("xAI API error:", data);

      return res.status(grokResponse.status).json({
        error: {
          message: data.error?.message || "Grok API request failed."
        }
      });
    }

    const reply = data.output_text ||
      (data.output || [])
        .filter(item => item.type === "message")
        .flatMap(item => item.content || [])
        .filter(item => item.type === "output_text")
        .map(item => item.text)
        .join("");

    if (!reply) {
      throw new Error("Grok returned an empty response.");
    }

    return res.status(200).json({
      candidates: [
        {
          content: {
            parts: [{ text: reply }]
          }
        }
      ]
    });

  } catch (error) {
    console.error("Chat function error:", error);

    return res.status(500).json({
      error: { message: error.message || "Internal server error." }
    });
  }
};
