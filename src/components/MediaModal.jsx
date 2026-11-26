import React from "react";
import { Tv, X, HardDrive, Volume2, Image, Music } from "lucide-react";

export default function MediaModal({
  isOpen,
  onClose,
  audioVolume,
  onVolumeChange,
  overlayOpacity,
  onOverlayChange,
  wallpaperName,
  audioName,
  hasWallpaper,
  hasAudio,
  customApiKey,
  onCustomApiKeyChange,
  onToggleAudio,
  onRestoreYouTube,
  onWallpaperUpload,
  onAudioUpload,
}) {
  if (!isOpen) return null;

  const vaultParts = [];
  if (hasWallpaper) vaultParts.push("Wallpaper");
  if (hasAudio) vaultParts.push("Song");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900/95 border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-sm max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 font-semibold text-base text-white">
            <Tv className="w-5 h-5 text-purple-400" />
            <span>Global Background & Drums Audio</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 px-3.5 py-2.5 rounded-2xl bg-purple-500/10 border border-purple-400/25 text-xs">
          <div className="text-emerald-300/90 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 shrink-0" />
            <span>
              {vaultParts.length > 0
                ? `Saved in Browser Vault (${vaultParts.join(" & ")}) • Survives Reloads`
                : "Browser Vault Ready (Bun /api/chat backend active)"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
            YouTube Background Video (nhr0igKYIMQ)
          </label>
          <div className="flex gap-2">
            <button
              onClick={onToggleAudio}
              className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/45 border border-purple-400/30 text-white font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Volume2 className="w-4 h-4 text-yellow-300" />
              <span>Toggle Mute / Unmute</span>
            </button>
            <button
              onClick={onRestoreYouTube}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 transition-all"
              title="Reset back to YouTube video"
            >
              Reset YT
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-medium uppercase tracking-wider">
              Background Music Volume
            </span>
            <span className="text-yellow-300 font-mono">{audioVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={audioVolume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-full accent-yellow-300 cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-medium uppercase tracking-wider">
              Overlay Darkness (Readability)
            </span>
            <span className="text-yellow-300 font-mono">{overlayOpacity}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="92"
            value={overlayOpacity}
            onChange={(e) => onOverlayChange(Number(e.target.value))}
            className="w-full accent-purple-400 cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
            Wallpaper Photo or Video (.jpg, .png, .webp, .mp4, .webm)
          </label>
          <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 cursor-pointer text-slate-200 transition-all">
            <Image className="w-4 h-4 text-purple-300" />
            <span className="truncate max-w-[260px]">
              {wallpaperName || "Upload Photo or Video Wallpaper"}
            </span>
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={onWallpaperUpload}
            />
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
            Background Song / MP3 Track
          </label>
          <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 cursor-pointer text-slate-200 transition-all">
            <Music className="w-4 h-4 text-yellow-300" />
            <span className="truncate max-w-[260px]">
              {audioName || "Upload MP3 / Audio Track"}
            </span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={onAudioUpload}
            />
          </label>
        </div>

        <div className="space-y-2 pt-1 border-t border-white/10">
          <label
            htmlFor="customApiKeyInput"
            className="block text-xs font-medium uppercase tracking-wider text-slate-400"
          >
            Custom Gemini API Key Override (Optional — uses .env /api/chat by default)
          </label>
          <input
            type="password"
            id="customApiKeyInput"
            value={customApiKey}
            onChange={(e) => onCustomApiKeyChange(e.target.value)}
            placeholder="Leave blank to use .env GEMINI_API_KEY via /api/chat"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400/60"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-yellow-200 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
