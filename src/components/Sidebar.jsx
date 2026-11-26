import React from "react";
import {
  Plus,
  PanelLeftClose,
  MessageSquare,
  Trash2,
  Volume2,
  VolumeX,
  SlidersHorizontal,
} from "lucide-react";

export default function Sidebar({
  chats,
  currentChatId,
  sidebarOpen,
  isBgMuted,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onToggleSidebar,
  onToggleAudio,
  onOpenMediaModal,
}) {
  return (
    <>
      {sidebarOpen && (
        <div
          onClick={() => onToggleSidebar(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-zinc-950/75 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:hidden"
        }`}
      >
        <div className="p-3.5 flex items-center justify-between gap-2 border-b border-white/10">
          <button
            onClick={onNewChat}
            className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.99] text-sm font-medium text-white border border-white/10 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-yellow-300" />
            <span>New Chat</span>
          </button>

          <button
            onClick={() => onToggleSidebar(false)}
            title="Close Sidebar"
            className="p-2.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
          {chats.length === 0 ? (
            <div className="text-xs text-slate-400 px-3 py-4 text-center">
              No adventures yet!
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = chat.id === currentChatId;
              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all ${
                    isActive
                      ? "bg-white/15 text-white font-medium border border-white/15 shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-yellow-300" : "text-slate-400"
                      }`}
                    />
                    <span className="truncate">
                      {chat.title || "New Adventure"}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    title="Delete Chat"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-white/10 bg-black/30 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-400 px-1 font-medium uppercase tracking-wider text-[10px]">
            <span>Drums of Liberation • Media</span>
            <span className={isBgMuted ? "text-slate-400" : "text-yellow-300 font-semibold"}>
              {isBgMuted ? "Muted" : "Playing"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={onToggleAudio}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 transition-all"
            >
              {isBgMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-purple-300" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-yellow-300" />
              )}
              <span>{isBgMuted ? "Unmute BG" : "Mute BG"}</span>
            </button>

            <button
              onClick={onOpenMediaModal}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-yellow-300" />
              <span>Media / BG</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-gradient-to-r from-purple-500/15 to-yellow-400/10 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-white text-zinc-950 flex items-center justify-center font-bold text-sm shadow-md shrink-0 sun-god-glow">
              ☀
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                Monkey D. Luffy (Gear 5)
              </div>
              <div className="text-[11px] text-purple-200/80 truncate">
                Sun God Nika • Freedom Mode
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
