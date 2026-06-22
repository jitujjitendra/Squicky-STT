/**
 * useAudioSync Hook
 *
 * Manages audio playback synchronization with the transcript.
 * Handles play/pause, seek, playback rate, and active segment tracking.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useTranscriptStudioStore } from '../store';

/**
 * Hook providing audio synchronization capabilities
 */
export function useAudioSync() {
  const audio = useTranscriptStudioStore((s) => s.audio);
  const setPlaying = useTranscriptStudioStore((s) => s.setPlaying);
  const setCurrentTime = useTranscriptStudioStore((s) => s.setCurrentTime);
  const setDuration = useTranscriptStudioStore((s) => s.setDuration);
  const setPlaybackRate = useTranscriptStudioStore((s) => s.setPlaybackRate);
  const seekTo = useTranscriptStudioStore((s) => s.seekTo);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  /** Update current time from audio element */
  const updateTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
    if (audio.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [audio.isPlaying, setCurrentTime]);

  /** Start time tracking loop */
  useEffect(() => {
    if (audio.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audio.isPlaying, updateTime]);

  /** Toggle play/pause */
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (audio.isPlaying) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      void audioRef.current.play();
      setPlaying(true);
    }
  }, [audio.isPlaying, setPlaying]);

  /** Seek to specific time */
  const seek = useCallback(
    (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
      seekTo(time);
      setCurrentTime(time);
    },
    [seekTo, setCurrentTime]
  );

  /** Change playback rate */
  const changeRate = useCallback(
    (rate: number) => {
      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
      }
      setPlaybackRate(rate);
    },
    [setPlaybackRate]
  );

  /** Set audio element ref */
  const setAudioRef = useCallback(
    (element: HTMLAudioElement | null) => {
      audioRef.current = element;
      if (element) {
        setDuration(element.duration || 0);
        element.addEventListener('loadedmetadata', () => {
          setDuration(element.duration);
        });
        element.addEventListener('ended', () => {
          setPlaying(false);
        });
      }
    },
    [setDuration, setPlaying]
  );

  return {
    isPlaying: audio.isPlaying,
    currentTime: audio.currentTime,
    duration: audio.duration,
    playbackRate: audio.playbackRate,
    activeSegmentId: audio.activeSegmentId,
    togglePlayPause,
    seek,
    changeRate,
    setAudioRef,
  };
}
