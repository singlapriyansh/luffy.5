export const LOCAL_SETTINGS_KEY = "luffy_g5_settings_v2";
export const CHATS_STORAGE_KEY = "luffy_gear5_chats";
const IDB_NAME = "LuffyGear5MediaDB";
const IDB_STORE = "mediaBlobs";

const GEMINI_OVERRIDE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];

export const LUFFY_SYSTEM_PROMPT = `You are Monkey D. Luffy in Gear 5 (Awakened Sun God Nika form), acting as a super helpful, brilliant AI assistant!
Personality & Tone:
- You are joyful, carefree, energetic, and full of freedom ("Shishishi!", "Aha! Let's do this!", "My heart's beating like drums!").
- Occasionally weave in subtle, fun One Piece / Gear 5 flavor (mentioning meat, freedom, adventure, Nakama, or the Drums of Liberation), WITHOUT letting it get in the way of clarity.
CRITICAL ACCURACY RULE:
- Despite your playful Luffy Gear 5 personality, you MUST ALWAYS provide genuinely accurate, thorough, well-structured, and directly helpful answers to whatever the user asks (whether it's programming, math, science, writing, analysis, or general knowledge).
- Format technical answers cleanly using Markdown headings, bullet points, and properly fenced code blocks.`;

function openMediaVaultDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBlobToVault(key, blobOrFile, meta = {}) {
  const db = await openMediaVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    store.put(
      {
        blob: blobOrFile,
        name: meta.name || blobOrFile.name || key,
        type: meta.type || blobOrFile.type || "",
        savedAt: Date.now(),
      },
      key
    );
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadBlobFromVault(key) {
  const db = await openMediaVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearVaultBlobs() {
  try {
    const db = await openMediaVaultDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.delete("wallpaperBlob");
      store.delete("audioBlob");
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Could not clear IndexedDB blobs:", err);
  }
}

export function getLocalSettings() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function persistSettings(partialUpdates) {
  try {
    const current = getLocalSettings();
    const merged = { ...current, ...partialUpdates };
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.warn("Could not persist settings:", err);
    return {};
  }
}

export async function callChatApi(conversationHistory, overrideKey) {
  const contents = conversationHistory.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text }],
  }));

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: LUFFY_SYSTEM_PROMPT }],
    },
  };

  if (!overrideKey) {
    const proxyRes = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const proxyData = await proxyRes.json().catch(() => ({}));
    if (!proxyRes.ok) {
      throw new Error(proxyData?.error?.message || `Backend /api/chat error (${proxyRes.status})`);
    }

    const proxyText = proxyData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (proxyText) return proxyText;
    throw new Error("Empty response from /api/chat");
  }

  let lastError = null;
  for (const model of GEMINI_OVERRIDE_MODELS) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    let delay = 800;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": overrideKey,
          },
          body: JSON.stringify(payload),
        });

        if (response.status === 404 || response.status === 400) {
          const errData = await response.json().catch(() => ({}));
          lastError = new Error(errData?.error?.message || `Model ${model} unavailable (${response.status})`);
          break;
        }

        if (response.status === 429 || response.status >= 500) {
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
          continue;
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        const replyText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) return replyText;
        throw new Error("Empty response from Gemini");
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error("Unable to reach Gemini API");
}
