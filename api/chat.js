
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "XAI_API_KEY is missing in Vercel"
      });
    }

    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Messages must be an array"
      });
    }

    const response = await fetch(
      "https://api.x.ai/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "grok-4.7",
          input: messages
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Grok API error"
      });
    }

    const reply =
      data.output_text ||
      data.output
        ?.filter(item => item.type === "message")
        .flatMap(item => item.content || [])
        .filter(item => item.type === "output_text")
        .map(item => item.text)
        .join("") || "";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Chat API error:", error);

    return res.status(500).json({
      error: "Something went wrong"
    });
  }
};
