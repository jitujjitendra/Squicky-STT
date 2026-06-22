/**
 * Transcription Job Hook
 *
 * Provides reactive access to a single transcription job's state.
 * Used by job-specific UI components (progress bars, result views).
 *
 * Architecture decision: Selecting a single job from the store via
 * a selector avoids re-renders when other jobs update.
 */

import { useMemo } from 'react';
import { useSpeechEngineStore } from '../store';
import type { TranscriptionJob, StandardTranscript } from '../types';

export interface UseTranscriptionJobReturn {
  /** The job data (undefined if not found) */
  job: TranscriptionJob | undefined;
  /** The transcript result (undefined if not completed) */
  transcript: StandardTranscript | undefined;
  /** Whether the job is actively processing */
  isProcessing: boolean;
  /** Whether the job has completed successfully */
  isCompleted: boolean;
  /** Whether the job has failed */
  isFailed: boolean;
  /** Formatted progress string */
  progressLabel: string;
  /** Formatted duration string */
  durationLabel: string;
}

export function useTranscriptionJob(jobId: string | null): UseTranscriptionJobReturn {
  const jobs = useSpeechEngineStore((s) => s.jobs);
  const transcripts = useSpeechEngineStore((s) => s.transcripts);

  const job = useMemo(
    () => (jobId ? jobs.find((j) => j.id === jobId) : undefined),
    [jobs, jobId]
  );

  const transcript = useMemo(
    () => (jobId ? transcripts.get(jobId) : undefined),
    [transcripts, jobId]
  );

  const isProcessing = job?.status === 'processing';
  const isCompleted = job?.status === 'completed';
  const isFailed = job?.status === 'failed';

  const progressLabel = useMemo(() => {
    if (!job) return '';
    if (isCompleted) return 'Completed';
    if (isFailed) return 'Failed';
    if (isProcessing) {
      const stageLabels: Record<string, string> = {
        preprocessing: 'Preprocessing',
        transcription: 'Transcribing',
        normalization: 'Finalizing',
      };
      const stageLabel = stageLabels[job.stage] ?? job.stage;
      return `${stageLabel}... ${Math.round(job.progress)}%`;
    }
    return 'Queued';
  }, [job, isProcessing, isCompleted, isFailed]);

  const durationLabel = useMemo(() => {
    if (!job) return '';
    const seconds = Math.round(job.metadata.duration_seconds);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }, [job]);

  return {
    job,
    transcript,
    isProcessing,
    isCompleted,
    isFailed,
    progressLabel,
    durationLabel,
  };
}
