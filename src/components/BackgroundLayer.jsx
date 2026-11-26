import React from "react";

export default function BackgroundLayer({
  mediaType,
  wallpaperUrl,
  audioUrl,
  overlayOpacity,
  ytRef,
  videoRef,
  audioRef,
}) {
  const alpha = overlayOpacity / 100;
  const overlayGradient = `linear-gradient(180deg, rgba(8,10,15,${alpha}) 0%, rgba(8,10,15,${Math.max(
    0.15,
    alpha - 0.06
  )}) 50%, rgba(8,10,15,${Math.min(0.96, alpha + 0.14)}) 100%)`;

  const showYouTube = mediaType === "youtube" || !wallpaperUrl;
  const showVideo = mediaType === "video" && Boolean(wallpaperUrl);
  const showImage = mediaType === "image" && Boolean(wallpaperUrl);

  return (
    <>
      <div className="video-bg-wrapper" id="bgContainer">
        <div className="gear5-fallback-bg" id="fallbackBg" />

        <iframe
          ref={ytRef}
          id="ytBackground"
          className={showYouTube ? "" : "hidden"}
          src="https://www.youtube.com/embed/nhr0igKYIMQ?autoplay=1&mute=1&loop=1&playlist=nhr0igKYIMQ&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1"
          title="Luffy Gear 5 Background"
          allow="autoplay; encrypted-media; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
        />

        <video
          ref={videoRef}
          id="localVideoBg"
          src={showVideo ? wallpaperUrl : undefined}
          className={showVideo ? "" : "hidden"}
          autoPlay
          loop
          muted
          playsInline
        />

        <img
          id="customImageBg"
          src={showImage ? wallpaperUrl : undefined}
          className={showImage ? "" : "hidden"}
          alt="Custom Gear 5 Wallpaper"
        />
      </div>

      <div
        className="gear5-smoke-overlay"
        id="glassOverlay"
        style={{ background: overlayGradient }}
      />

      <audio
        ref={audioRef}
        id="localAudioPlayer"
        src={audioUrl || undefined}
        loop
        preload="auto"
        crossOrigin="anonymous"
      />
    </>
  );
}
