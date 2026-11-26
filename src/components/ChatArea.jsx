import React, { useEffect, useRef } from "react";
import {
  PanelLeft,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowUpRight,
  Copy,
  Mic,
  ArrowUp,
} from "lucide-react";
import { marked } from "marked";
import hljs from "highlight.js";

marked.setOptions({
  breaks: true,
  gfm: true,
});

const STARTER_PROMPTS = [
  {
    title: "Explain Quantum Computing",
    subtitle: "Straw Hat analogy + real technical breakdown",
    prompt:
      "Explain quantum computing like I am part of the Straw Hat crew, then give me a real technical summary!",
  },
  {
    title: "Write a Python API Script",
    subtitle: "Production-ready code with clear explanation",
    prompt:
      "Write a clean, modern Python script to fetch weather data from an API with error handling.",
  },
  {
    title: "Pirate King Protein Meal Plan",
    subtitle: "Sanji-approved nutrition & macros",
    prompt:
      "Give me a high-protein meat lover meal plan for muscle recovery and energy!",
  },
  {
    title: "Weekend Web App Ideas",
    subtitle: "Fun, practical projects with tech stacks",
    prompt: "Help me brainstorm 5 creative web app ideas I can build this weekend.",
  },
];

export default function ChatArea({
  messages,
  isGenerating,
  isBgMuted,
  isRecording,
  promptText,
  onPromptChange,
  onSendMessage,
  onToggleSidebar,
  onToggleAudio,
  onOpenMediaModal,
  onToggleVoice,
  onCopyText,
}) {
  const scrollContainerRef = useRef(null);
  const messagesListRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }

    const container = messagesListRef.current;
    if (!container) return;

    container.querySelectorAll("pre code").forEach((block) => {
      if (!block.dataset.highlighted) {
        hljs.highlightElement(block);
      }
    });

    container.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".copy-code-btn")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "copy-code-btn absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-slate-200 font-sans transition-colors";
      btn.textContent = "Copy code";
      btn.onclick = () => {
        const code = pre.querySelector("code")?.innerText || pre.innerText;
        onCopyText(code, null);
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.textContent = "Copy code";
        }, 1800);
      };
      pre.appendChild(btn);
    });
  }, [messages, isGenerating, onCopyText]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [promptText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = promptText.trim();
    if (!trimmed || isGenerating) return;
    onSendMessage(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 relative z-20 pointer-events-auto">
      <header className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-zinc-950/35 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onToggleSidebar()}
            title="Toggle Sidebar"
            className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 select-none">
            <span className="font-semibold tracking-tight text-base text-white flex items-center gap-2">
              LUFFY AI
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/15 text-yellow-200 border border-white/15 backdrop-blur-xs">
                Gear 5
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAudio}
            title="Toggle Background Video/Music Audio"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-white transition-all backdrop-blur-md"
          >
            {isBgMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-yellow-300" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-yellow-300" />
            )}
            <span className="hidden sm:inline">
              {isBgMuted ? "Unmute Drums" : "Mute Drums"}
            </span>
          </button>

          <button
            onClick={onOpenMediaModal}
            title="Background & Audio Settings"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white transition-all"
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
          </button>
        </div>
      </header>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-8 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {messages.length === 0 && !isGenerating ? (
            <div className="flex flex-col items-center justify-center text-center pt-8 sm:pt-14 pb-6 px-2">
              <div className="w-16 h-16 rounded-full bg-white/95 text-zinc-950 flex items-center justify-center text-3xl shadow-xl sun-god-glow mb-5 border-2 border-purple-300/60">
                ☀
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 drop-shadow">
                Shishishi! What do you wanna ask?
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-lg mb-8 leading-relaxed">
                I’m at my absolute peak! Ask me anything—coding, science, stories,
                math, or life advice—and I’ll give you real answers while the
                Drums of Liberation beat!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                {STARTER_PROMPTS.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => onSendMessage(item.prompt)}
                    className="group p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/75 backdrop-blur-md border border-white/10 hover:border-purple-400/40 transition-all shadow-sm"
                  >
                    <div className="text-sm font-medium text-white group-hover:text-yellow-200 transition-colors flex items-center justify-between">
                      <span>{item.title}</span>
                      <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{item.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div ref={messagesListRef} className="space-y-6">
              {messages.map((msg, idx) =>
                msg.role === "user" ? (
                  <div key={idx} className="flex justify-end">
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl rounded-br-md px-4 py-3 bg-purple-600/35 border border-purple-400/30 backdrop-blur-md text-white text-sm sm:text-base leading-relaxed shadow-lg whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center font-bold text-base shadow-md shrink-0 sun-god-glow mt-0.5">
                      ☀
                    </div>
                    <div className="flex-1 min-w-0 rounded-3xl rounded-tl-md px-4 sm:px-5 py-3.5 bg-zinc-900/75 border border-white/10 backdrop-blur-md shadow-xl">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-yellow-200 tracking-wide">
                          Luffy • Gear 5
                        </span>
                        <button
                          onClick={() =>
                            onCopyText(msg.text, "Response copied to clipboard!")
                          }
                          title="Copy response"
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                      <div
                        className="markdown-body"
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(msg.text || ""),
                        }}
                      />
                    </div>
                  </div>
                )
              )}

              {isGenerating && (
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center font-bold text-base shadow-md shrink-0 sun-god-glow mt-0.5">
                    ☀
                  </div>
                  <div className="rounded-3xl rounded-tl-md px-5 py-4 bg-zinc-900/75 border border-white/10 backdrop-blur-md shadow-xl flex items-center gap-3">
                    <div className="dot-flashing">
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="text-xs text-purple-200">
                      Drums of Liberation beating...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 relative z-30 bg-gradient-to-t from-zinc-950/95 via-zinc-950/75 to-transparent pt-3 pb-4 px-4 sm:px-6 pointer-events-auto">
        <div className="max-w-3xl mx-auto w-full pointer-events-auto">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-end gap-2 bg-zinc-900/85 backdrop-blur-xl border border-white/15 focus-within:border-purple-400/60 rounded-3xl px-3.5 py-2.5 shadow-2xl transition-all"
          >
            <button
              type="button"
              onClick={onToggleVoice}
              title="Voice Input"
              className={`p-2.5 rounded-full transition-all shrink-0 mb-0.5 ${
                isRecording
                  ? "bg-red-500/25 text-red-300 animate-pulse"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={promptText}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Luffy Gear 5..."
              className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base resize-none focus:outline-none py-2 max-h-40 leading-relaxed pointer-events-auto"
            />

            <button
              type="submit"
              disabled={isGenerating}
              title="Send Message"
              className="p-2.5 rounded-full bg-white text-zinc-950 hover:bg-yellow-200 disabled:opacity-40 disabled:hover:bg-white transition-all shrink-0 mb-0.5 shadow-md"
            >
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            </button>
          </form>

          <div className="text-center mt-2 text-[11px] text-slate-400/90">
            Luffy Gear 5 AI • React + Bun Backend • Responses are joyful yet accurate
          </div>
        </div>
      </div>
    </main>
  );
}
