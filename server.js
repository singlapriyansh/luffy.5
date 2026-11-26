import indexHtml from "./index.html";
import chatHandler from "./api/chat.js";

const PORT = Number(process.env.PORT) || 3000;

async function handleApiChat(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  let body = {};
  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: { message: "Invalid JSON request body." } },
        { status: 400 }
      );
    }
  }

  let statusCode = 200;
  let responseBody = null;

  const mockReq = {
    method: req.method,
    body,
  };

  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      responseBody = payload;
      return this;
    },
  };

  await chatHandler(mockReq, mockRes);
  return Response.json(responseBody ?? {}, { status: statusCode });
}

const server = Bun.serve({
  port: PORT,
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
  routes: {
    "/": indexHtml,
    "/index.html": indexHtml,
    "/health": () => {
      const hasGemini = Boolean(process.env.GEMINI_API_KEY);
      const hasXai = Boolean(process.env.XAI_API_KEY);
      return Response.json({
        ok: true,
        runtime: "bun",
        configured: hasGemini || hasXai,
        providers: { gemini: hasGemini, xai: hasXai },
      });
    },
    "/api/chat": handleApiChat,
  },
});

const activeKey = process.env.GEMINI_API_KEY
  ? "GEMINI_API_KEY"
  : process.env.XAI_API_KEY
    ? "XAI_API_KEY"
    : "none";

console.log(`LUFFY AI (React + Bun) running at ${server.url} (API key: ${activeKey})`);
