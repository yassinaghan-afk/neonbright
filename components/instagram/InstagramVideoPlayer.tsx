"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  poster?: string;
  className?: string;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function InstagramVideoPlayer({
  src,
  poster,
  className,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    video.load();

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  }, [src]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const target = containerRef.current ?? videoRef.current;
    if (!target) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await target.requestFullscreen();
    }
  }, []);

  const onProgressClick = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video || duration <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      video.currentTime = ratio * duration;
      setCurrentTime(video.currentTime);
    },
    [duration]
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative flex w-full max-w-full items-center justify-center bg-black",
        className
      )}
      style={{ maxHeight: "min(78vh, 900px)" }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        muted={muted}
        preload="metadata"
        className="max-h-[min(78vh,900px)] max-w-full object-contain"
        style={{ objectFit: "contain", width: "auto", height: "auto" }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <div
          role="slider"
          aria-label="Progression de la vidéo"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="pointer-events-auto mb-3 h-1.5 cursor-pointer rounded-full bg-white/20"
          onPointerDown={onProgressClick}
        >
          <div
            className="h-full rounded-full bg-neon-pink transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="pointer-events-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Lecture"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition hover:border-neon-pink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink/50"
            >
              {playing ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5.14v13.72L19 12 8 5.14z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Activer le son" : "Couper le son"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition hover:border-neon-pink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink/50"
            >
              {muted ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M11 5L6 9H3v6h3l5 4V5z" />
                  <path d="M16 9l4 4M20 9l-4 4" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M11 5L6 9H3v6h3l5 4V5z" />
                  <path d="M15 9a4 4 0 010 6M17 7a7 7 0 010 10" />
                </svg>
              )}
            </button>

            <span className="font-mono text-[11px] text-white/60">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition hover:border-neon-pink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink/50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {isFullscreen ? (
                <path d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4" />
              ) : (
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
