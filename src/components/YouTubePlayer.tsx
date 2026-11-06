import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { MOVIE_SETTINGS, ONE_LINE_CREDIT } from '../types';
import { ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerRef {
  playSegment: (start: number, end: number, loop?: boolean, onSegmentEnd?: () => void) => void;
  pause: () => void;
  stop: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  setPlaybackRate: (rate: number) => void;
  isPlaying: () => boolean;
}

interface YouTubePlayerProps {
  onTimeUpdate?: (currentTime: number) => void;
  onPlayerReady?: () => void;
  onSegmentFinished?: () => void;
  isLooping?: boolean;
  currentSpeed?: number;
}

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  ({ onTimeUpdate, onPlayerReady, onSegmentFinished, isLooping = false, currentSpeed = 1.0 }, ref) => {
    const containerId = useRef(`yt-player-${Math.random().toString(36).substring(2, 9)}`);
    const playerInstance = useRef<any>(null);
    const [isApiReady, setIsApiReady] = useState(false);
    const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);
    const [hasEmbedError, setHasEmbedError] = useState(false);
    const [simulatedTime, setSimulatedTime] = useState(0);

    // Segment tracking refs
    const segmentRef = useRef<{
      start: number;
      end: number;
      loop: boolean;
      onEnd?: () => void;
      active: boolean;
    }>({
      start: 0,
      end: 47,
      loop: false,
      active: false,
    });

    const isLoopingRef = useRef(isLooping);
    isLoopingRef.current = isLooping;

    const currentSpeedRef = useRef(currentSpeed);
    currentSpeedRef.current = currentSpeed;

    const pollIntervalRef = useRef<any>(null);
    const loopTimeoutRef = useRef<any>(null);

    // Fallback simulation timer for when video embedding is blocked (error 101/150)
    const fallbackTimerRef = useRef<any>(null);

    // Stop segment polling
    const clearSegmentChecking = useCallback(() => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    }, []);

    // 1. Load YouTube IFrame API script once
    useEffect(() => {
      if (window.YT && window.YT.Player) {
        setIsApiReady(true);
        return;
      }

      const existingScript = document.getElementById('youtube-iframe-api-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        setIsApiReady(true);
      };
    }, []);

    // 2. Initialize YouTube Player
    useEffect(() => {
      if (!isApiReady || isPlayerInitialized || !document.getElementById(containerId.current)) {
        return;
      }

      try {
        const player = new window.YT.Player(containerId.current, {
          videoId: MOVIE_SETTINGS.videoId,
          playerVars: {
            start: MOVIE_SETTINGS.practiceStart,
            end: MOVIE_SETTINGS.practiceEnd,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            controls: 1,
            cc_load_policy: 0,
            disablekb: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              playerInstance.current = event.target;
              setIsPlayerInitialized(true);
              if (currentSpeedRef.current) {
                event.target.setPlaybackRate(currentSpeedRef.current);
              }
              onPlayerReady?.();
            },
            onError: (event: any) => {
              console.warn('YouTube Player Error code:', event.data);
              // Error 101 or 150 = Embedding not allowed by copyright owner
              if (event.data === 101 || event.data === 150 || event.data === 2 || event.data === 5) {
                setHasEmbedError(true);
              }
            },
            onStateChange: (event: any) => {
              // Loop boundary protection if user manually plays outside practice range
              if (event.data === window.YT.PlayerState.PLAYING) {
                try {
                  const t = event.target.getCurrentTime();
                  if (t < MOVIE_SETTINGS.practiceStart || t > MOVIE_SETTINGS.practiceEnd) {
                    event.target.seekTo(MOVIE_SETTINGS.practiceStart, true);
                  }
                } catch {
                  // ignore
                }
              }
            },
          },
        });
      } catch (err) {
        console.error('Error creating YouTube player:', err);
        setHasEmbedError(true);
      }

      return () => {
        clearSegmentChecking();
      };
    }, [isApiReady, isPlayerInitialized, onPlayerReady, clearSegmentChecking]);

    // Handle speed changes
    useEffect(() => {
      if (playerInstance.current && typeof playerInstance.current.setPlaybackRate === 'function') {
        try {
          playerInstance.current.setPlaybackRate(currentSpeed);
        } catch (e) {
          console.warn('Could not set playback rate:', e);
        }
      }
    }, [currentSpeed]);

    // Segment execution logic
    const executePlaySegment = useCallback(
      (start: number, end: number, loop = false, onEnd?: () => void) => {
        clearSegmentChecking();
        segmentRef.current = { start, end, loop, onEnd, active: true };

        const duration = Math.max(0.5, (end - start) / (currentSpeedRef.current || 1));

        // If player has embedding error or is not ready, simulate segment progress so learning keeps working
        if (hasEmbedError || !playerInstance.current) {
          setSimulatedTime(start);
          let elapsed = 0;
          const intervalMs = 100;
          fallbackTimerRef.current = setInterval(() => {
            elapsed += intervalMs / 1000;
            const currentT = start + elapsed * (currentSpeedRef.current || 1);
            setSimulatedTime(currentT);
            onTimeUpdate?.(currentT);

            if (currentT >= end) {
              clearInterval(fallbackTimerRef.current);
              fallbackTimerRef.current = null;
              segmentRef.current.active = false;
              onEnd?.();
              onSegmentFinished?.();

              if (loop || isLoopingRef.current) {
                loopTimeoutRef.current = setTimeout(() => {
                  executePlaySegment(start, end, loop, onEnd);
                }, 1500); // 1.5s speech gap
              }
            }
          }, intervalMs);
          return;
        }

        try {
          // 1. player.seekTo(sentence.start, true) then player.playVideo()
          playerInstance.current.seekTo(start, true);
          playerInstance.current.playVideo();

          // 2. Check player.getCurrentTime() every 100 ms
          pollIntervalRef.current = setInterval(() => {
            if (!playerInstance.current) return;
            try {
              const currentT = playerInstance.current.getCurrentTime();
              onTimeUpdate?.(currentT);

              // 3. When current time >= sentence.end, call player.pauseVideo()
              if (currentT >= end) {
                playerInstance.current.pauseVideo();
                clearSegmentChecking();
                segmentRef.current.active = false;
                onEnd?.();
                onSegmentFinished?.();

                // 4. If Loop is on, wait 1.5 seconds, then play again
                if (loop || isLoopingRef.current) {
                  loopTimeoutRef.current = setTimeout(() => {
                    executePlaySegment(start, end, loop, onEnd);
                  }, 1500);
                }
              }
            } catch (err) {
              console.warn('Error polling video time:', err);
            }
          }, 100);
        } catch (err) {
          console.warn('Failed to play segment:', err);
        }
      },
      [clearSegmentChecking, hasEmbedError, onSegmentFinished, onTimeUpdate]
    );

    // Pause player
    const pausePlayer = useCallback(() => {
      clearSegmentChecking();
      segmentRef.current.active = false;
      if (playerInstance.current && typeof playerInstance.current.pauseVideo === 'function') {
        try {
          playerInstance.current.pauseVideo();
        } catch {
          // ignore
        }
      }
    }, [clearSegmentChecking]);

    // Imperative handle for parent screens
    useImperativeHandle(
      ref,
      () => ({
        playSegment: (start: number, end: number, loop?: boolean, onEnd?: () => void) => {
          const shouldLoop = loop !== undefined ? loop : isLoopingRef.current;
          executePlaySegment(start, end, shouldLoop, onEnd);
        },
        pause: () => {
          pausePlayer();
        },
        stop: () => {
          pausePlayer();
        },
        seekTo: (seconds: number) => {
          if (playerInstance.current && typeof playerInstance.current.seekTo === 'function') {
            try {
              playerInstance.current.seekTo(seconds, true);
            } catch {
              // ignore
            }
          }
        },
        getCurrentTime: () => {
          if (hasEmbedError || !playerInstance.current) {
            return simulatedTime;
          }
          try {
            return playerInstance.current.getCurrentTime() || 0;
          } catch {
            return 0;
          }
        },
        setPlaybackRate: (rate: number) => {
          currentSpeedRef.current = rate;
          if (playerInstance.current && typeof playerInstance.current.setPlaybackRate === 'function') {
            try {
              playerInstance.current.setPlaybackRate(rate);
            } catch {
              // ignore
            }
          }
        },
        isPlaying: () => {
          if (hasEmbedError) {
            return !!fallbackTimerRef.current;
          }
          if (playerInstance.current && typeof playerInstance.current.getPlayerState === 'function') {
            try {
              return playerInstance.current.getPlayerState() === window.YT?.PlayerState?.PLAYING;
            } catch {
              return false;
            }
          }
          return false;
        },
      }),
      [executePlaySegment, hasEmbedError, pausePlayer, simulatedTime]
    );

    return (
      <div className="w-full bg-[#18131C] rounded-2xl overflow-hidden shadow-lg border border-[#3A2D42]/40">
        {/* 16:9 Video Container */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          {/* YouTube IFrame target element */}
          <div
            id={containerId.current}
            className={`w-full h-full ${hasEmbedError ? 'hidden' : 'block'}`}
          />

          {/* Loading indicator prior to API ready */}
          {!isPlayerInitialized && !hasEmbedError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-200/80 gap-2 bg-[#18131C]">
              <RefreshCw className="w-6 h-6 animate-spin text-pink-400" />
              <span className="text-xs font-medium tracking-wide">Loading movie scene...</span>
            </div>
          )}

          {/* Fallback when YouTube restricts embedded playback (101 / 150) */}
          {hasEmbedError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#251B2E] to-[#16101D] text-white">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mb-2">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-rose-100 max-w-xs mb-1">
                This video can't play inside the app. Tap to open it on YouTube.
              </p>
              <p className="text-xs text-rose-300/80 mb-3">
                이 영상은 앱 내 재생이 제한되어 있습니다. 유튜브에서 열어 시청하실 수 있습니다.
              </p>
              <a
                href={`https://www.youtube.com/watch?v=${MOVIE_SETTINGS.videoId}&t=${MOVIE_SETTINGS.practiceStart}s`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl text-xs font-medium shadow-md transition-transform active:scale-95"
              >
                <span>Open on YouTube (0:00 – 0:47)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-[11px] text-zinc-400 mt-2">
                * 문장 대본, 음성 녹음, 발음 자가진단 기능은 앱에서 정상 동작합니다.
              </span>
            </div>
          )}
        </div>

        {/* Mandatory one gray line under video player on every screen (at least 13px) */}
        <div className="px-3.5 py-2.5 bg-[#1F1826] border-t border-purple-950/40 text-center">
          <p className="text-[13px] text-zinc-300/90 leading-snug tracking-tight">
            Clip: <span className="italic font-medium text-pink-200">{MOVIE_SETTINGS.titleEn}</span> ({MOVIE_SETTINGS.releaseYear}), {MOVIE_SETTINGS.distributionCompany} / {MOVIE_SETTINGS.productionCompany} · via YouTube · For educational use only
          </p>
        </div>
      </div>
    );
  }
);

YouTubePlayer.displayName = 'YouTubePlayer';
