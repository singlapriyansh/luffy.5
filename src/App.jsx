import React, { useState, useEffect, useRef, useCallback } from "react";
import BackgroundLayer from "./components/BackgroundLayer.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ChatArea from "./components/ChatArea.jsx";
import MediaModal from "./components/MediaModal.jsx";
import {
  CHATS_STORAGE_KEY,
  getLocalSettings,
  persistSettings,
  saveBlobToVault,
  loadBlobFromVault,
  clearVaultBlobs,
  callChatApi,
} from "./utils/vault.js";

function createEmptyChat() {
  return {
    id: "chat_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
    title: "New Adventure",
    messages: [],
    updatedAt: Date.now(),
  };
}

export default function App() {
  const [chats, setChats] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHATS_STORAGE_KEY) || "[]");
      return saved.length > 0 ? saved : [createEmptyChat()];
    } catch {
      return [createEmptyChat()];
    }
  });

  const [currentChatId, setCurrentChatId] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHATS_STORAGE_KEY) || "[]");
      return saved[0]?.id || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!currentChatId && chats.length > 0) {
      setCurrentChatId(chats[0].id);
    }
  }, [currentChatId, chats]);

  const initialSettings = getLocalSettings();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const [isBgMuted, setIsBgMuted] = useState(true);
  const [audioVolume, setAudioVolume] = useState(
    typeof initialSettings.audioVolume === "number" ? initialSettings.audioVolume : 80
  );
  const [overlayOpacity, setOverlayOpacity] = useState(
    typeof initialSettings.overlayOpacity === "number" ? initialSettings.overlayOpacity : 68
  );
  const [customApiKey, setCustomApiKey] = useState(
    initialSettings.customApiKey || localStorage.getItem("luffy_gear5_api_key") || ""
  );

  const [mediaType, setMediaType] = useState("youtube");
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [wallpaperName, setWallpaperName] = useState(initialSettings.wallpaperName || "");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioName, setAudioName] = useState(initialSettings.audioName || "");

  const ytRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(""), 2800);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
    } catch (err) {
      console.warn("Could not persist chats:", err);
    }
  }, [chats]);

  useEffect(() => {
    let active = true;
    (async () => {
      const s = getLocalSettings();
      try {
        if (s.hasLocalWallpaperBlob) {
          const wp = await loadBlobFromVault("wallpaperBlob");
          if (active && wp?.blob) {
            setWallpaperUrl(URL.createObjectURL(wp.blob));
            setMediaType(wp.type?.startsWith("video/") ? "video" : s.mediaType || "image");
            setWallpaperName(wp.name || s.wallpaperName || "");
          }
        }
        if (s.hasLocalAudioBlob) {
          const aud = await loadBlobFromVault("audioBlob");
          if (active && aud?.blob) {
            setAudioUrl(URL.createObjectURL(aud.blob));
            setAudioName(aud.name || s.audioName || "");
          }
        }
      } catch (err) {
        console.warn("Browser vault hydration error:", err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const normVol = Math.max(0, Math.min(1, audioVolume / 100));
    if (audioRef.current) audioRef.current.volume = normVol;
    if (videoRef.current) videoRef.current.volume = normVol;
    ytRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "setVolume", args: [audioVolume] }),
      "*"
    );
  }, [audioVolume]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onstart = () => {
      setIsRecording(true);
      showToast("Listening... Speak now!");
    };
    rec.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setPromptText(transcript);
    };
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => {
      setIsRecording(false);
      showToast("Voice input unavailable or blocked.");
    };
    recognitionRef.current = rec;
  }, [showToast]);

  const currentChat = chats.find((c) => c.id === currentChatId) || chats[0];

  const handleNewChat = () => {
    const next = createEmptyChat();
    setChats((prev) => [next, ...prev]);
    setCurrentChatId(next.id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleDeleteChat = (chatId) => {
    setChats((prev) => {
      const filtered = prev.filter((c) => c.id !== chatId);
      if (filtered.length === 0) {
        const fresh = createEmptyChat();
        setCurrentChatId(fresh.id);
        return [fresh];
      }
      if (currentChatId === chatId) {
        setCurrentChatId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleSendMessage = async (text) => {
    if (isGenerating || !text.trim()) return;
    const targetId = currentChat?.id;
    const updatedHistory = [...(currentChat?.messages || []), { role: "user", text }];

    setChats((prev) =>
      prev.map((c) =>
        c.id === targetId
          ? {
              ...c,
              title:
                c.messages.length === 0
                  ? text.length > 36
                    ? text.slice(0, 36) + "..."
                    : text
                  : c.title,
              messages: updatedHistory,
              updatedAt: Date.now(),
            }
          : c
      )
    );
    setPromptText("");
    setIsGenerating(true);

    try {
      const reply = await callChatApi(updatedHistory, customApiKey.trim());
      setChats((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? {
                ...c,
                messages: [...updatedHistory, { role: "assistant", text: reply }],
                updatedAt: Date.now(),
              }
            : c
        )
      );
    } catch (err) {
      const isAuthError = /api key|permission|403|401|unauthenticated|GEMINI_API_KEY|XAI_API_KEY/i.test(
        err.message || ""
      );
      const friendlyError = isAuthError
        ? `Shishishi! Looks like your API key needs to be set in **.env** (\`GEMINI_API_KEY\` or \`XAI_API_KEY\`), or pasted into **Media / BG** (top-right sparkles icon)!\n\n*(Details: ${err.message})*`
        : `Whoa! Hit a rough wave on the Grand Line while trying to answer that! Try sending your message again in a moment.\n\n*(Details: ${err.message})*`;

      setChats((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? {
                ...c,
                messages: [...updatedHistory, { role: "assistant", text: friendlyError }],
                updatedAt: Date.now(),
              }
            : c
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleAudio = () => {
    const nextMuted = !isBgMuted;
    setIsBgMuted(nextMuted);

    const hasCustomAudio = Boolean(audioUrl);
    const hasCustomVideo = mediaType === "video" && Boolean(wallpaperUrl);

    if (hasCustomAudio && audioRef.current) {
      audioRef.current.muted = nextMuted;
      if (!nextMuted) audioRef.current.play().catch(() => {});
    }

    if (hasCustomVideo && videoRef.current) {
      videoRef.current.muted = hasCustomAudio ? true : nextMuted;
      if (!nextMuted && !hasCustomAudio) videoRef.current.play().catch(() => {});
    } else if (!hasCustomAudio && mediaType === "youtube") {
      ytRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: nextMuted ? "mute" : "unMute", args: [] }),
        "*"
      );
      if (!nextMuted) {
        ytRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: [] }),
          "*"
        );
      }
    }

    showToast(nextMuted ? "Background audio muted" : "Drums of Liberation unmuted! 🥁");
  };

  const handleWallpaperUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const nextType = file.type.startsWith("video/") ? "video" : "image";

    try {
      await saveBlobToVault("wallpaperBlob", file, { name: file.name, type: file.type });
      persistSettings({
        mediaType: nextType,
        hasLocalWallpaperBlob: true,
        wallpaperName: file.name,
      });
    } catch (err) {
      console.warn("IndexedDB wallpaper save warning:", err);
    }

    setWallpaperUrl(URL.createObjectURL(file));
    setMediaType(nextType);
    setWallpaperName(file.name);
    showToast(`Saved wallpaper in Browser Vault: ${file.name} 💾`);
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await saveBlobToVault("audioBlob", file, { name: file.name, type: file.type });
      persistSettings({
        hasLocalAudioBlob: true,
        audioName: file.name,
      });
    } catch (err) {
      console.warn("IndexedDB audio save warning:", err);
    }

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setAudioName(file.name);
    setIsBgMuted(false);

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.play().catch(() => {});
      }
    }, 50);

    showToast(`Saved song in Browser Vault: ${file.name} 🎵💾`);
  };

  const handleRestoreYouTube = async () => {
    await clearVaultBlobs();
    persistSettings({
      mediaType: "youtube",
      hasLocalWallpaperBlob: false,
      hasLocalAudioBlob: false,
      wallpaperName: "",
      audioName: "",
    });
    setMediaType("youtube");
    setWallpaperUrl("");
    setWallpaperName("");
    setAudioUrl("");
    setAudioName("");
    showToast("Restored YouTube Gear 5 background");
  };

  const handleCopyText = useCallback(
    (text, toastMessage) => {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
        } catch {}
        document.body.removeChild(ta);
      }
      if (toastMessage) showToast(toastMessage);
    },
    [showToast]
  );

  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      showToast("Speech recognition is not supported in this browser.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="text-slate-100 font-sans antialiased selection:bg-purple-500/40 selection:text-white overflow-hidden h-screen w-screen flex">
      <BackgroundLayer
        mediaType={mediaType}
        wallpaperUrl={wallpaperUrl}
        audioUrl={audioUrl}
        overlayOpacity={overlayOpacity}
        ytRef={ytRef}
        videoRef={videoRef}
        audioRef={audioRef}
      />

      <Sidebar
        chats={chats}
        currentChatId={currentChat?.id}
        sidebarOpen={sidebarOpen}
        isBgMuted={isBgMuted}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onToggleSidebar={(force) =>
          setSidebarOpen((prev) => (typeof force === "boolean" ? force : !prev))
        }
        onToggleAudio={handleToggleAudio}
        onOpenMediaModal={() => setMediaModalOpen(true)}
      />

      <ChatArea
        messages={currentChat?.messages || []}
        isGenerating={isGenerating}
        isBgMuted={isBgMuted}
        isRecording={isRecording}
        promptText={promptText}
        onPromptChange={setPromptText}
        onSendMessage={handleSendMessage}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onToggleAudio={handleToggleAudio}
        onOpenMediaModal={() => setMediaModalOpen(true)}
        onToggleVoice={handleToggleVoice}
        onCopyText={handleCopyText}
      />

      <MediaModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        audioVolume={audioVolume}
        onVolumeChange={(val) => {
          setAudioVolume(val);
          persistSettings({ audioVolume: val });
        }}
        overlayOpacity={overlayOpacity}
        onOverlayChange={(val) => {
          setOverlayOpacity(val);
          persistSettings({ overlayOpacity: val });
        }}
        wallpaperName={wallpaperName}
        audioName={audioName}
        hasWallpaper={Boolean(wallpaperUrl)}
        hasAudio={Boolean(audioUrl)}
        customApiKey={customApiKey}
        onCustomApiKeyChange={(val) => {
          setCustomApiKey(val);
          localStorage.setItem("luffy_gear5_api_key", val.trim());
          persistSettings({ customApiKey: val.trim() });
        }}
        onToggleAudio={handleToggleAudio}
        onRestoreYouTube={handleRestoreYouTube}
        onWallpaperUpload={handleWallpaperUpload}
        onAudioUpload={handleAudioUpload}
      />

      <div
        className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900/95 border border-white/15 text-xs text-white shadow-xl backdrop-blur-md pointer-events-none transition-opacity duration-300 ${
          toastMsg ? "opacity-100" : "opacity-0"
        }`}
      >
        {toastMsg}
      </div>
    </div>
  );
}
