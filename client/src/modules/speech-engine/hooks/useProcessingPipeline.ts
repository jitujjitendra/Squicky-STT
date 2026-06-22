/**
 * Processing Pipeline Hook
 *
 * Provides pipeline initialization, job submission, and processing
 * controls. Manages the lifecycle of the TranscriptionPipeline instance.
 *
 * Architecture decision: The pipeline is a singleton initialized once
 * per session. The hook exposes an imperative API for submitting files
 * and triggering processing, while the store holds reactive state.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSpeechEngineStore } from '../store';
import {
  ValidationService,
  QueueService,
  PreprocessingService,
  EngineRegistry,
  TranscriptionPipeline,
  CleanupService,
} from '../services';
import { MockAdapter, WhisperAdapter, FasterWhisperAdapter } from '../engines';
import type { TranscriptionJobOptions } from '../types';

/** Singleton pipeline instance */
let pipelineInstance: TranscriptionPipeline | null = null;
let cleanupInstance: CleanupService | null = null;

function getPipeline(): TranscriptionPipeline {
  if (!pipelineInstance) {
    const validation = new ValidationService();
    const queue = new QueueService();
    const preprocessing = new PreprocessingService();
    const engines = new EngineRegistry();

    // Register available engines
    engines.register('mock', new MockAdapter());
    engines.register('whisper', new WhisperAdapter());
    engines.register('faster-whisper', new FasterWhisperAdapter());
    engines.setDefault('mock');

    pipelineInstance = new TranscriptionPipeline(validation, queue, preprocessing, engines);
  }
  return pipelineInstance;
}

function getCleanup(): CleanupService {
  if (!cleanupInstance) {
    cleanupInstance = new CleanupService();
    cleanupInstance.initialize();
  }
  return cleanupInstance;
}

export interface UseProcessingPipelineReturn {
  /** Submit files for transcription */
  submitFiles: (files: File[], options?: Partial<TranscriptionJobOptions>) => Promise<void>;
  /** Process the next job in queue */
  processNext: () => Promise<void>;
  /** Process all pending jobs */
  processAll: () => Promise<void>;
  /** Cancel a job */
  cancelJob: (jobId: string) => void;
  /** Clear completed jobs */
  clearCompleted: () => void;
  /** Whether the pipeline is initialized */
  isInitialized: boolean;
}

export function useProcessingPipeline(): UseProcessingPipelineReturn {
  const {
    addJob,
    updateJob,
    addTranscript,
    defaultOptions,
    setEngines,
  } = useSpeechEngineStore();

  const isInitialized = useRef(false);

  // Initialize pipeline and cleanup on mount
  useEffect(() => {
    const pipeline = getPipeline();
    const cleanup = getCleanup();

    // Populate engine list in store
    setEngines(pipeline.getEngines().list());

    // Register cleanup for session end
    cleanup.onCleanup(() => {
      useSpeechEngineStore.getState().reset();
    });

    // Subscribe to queue updates
    const unsubscribe = pipeline.getQueue().subscribe((job) => {
      updateJob({ ...job });
      if (job.status === 'completed' && job.result) {
        addTranscript(job.id, job.result);
      }
    });

    isInitialized.current = true;

    return () => {
      unsubscribe();
    };
  }, [setEngines, updateJob, addTranscript]);

  const submitFiles = useCallback(
    async (files: File[], options?: Partial<TranscriptionJobOptions>) => {
      const pipeline = getPipeline();
      const mergedOptions = { ...defaultOptions, ...options };

      for (const file of files) {
        const job = await pipeline.submit(file, mergedOptions);
        addJob(job);
      }
    },
    [addJob, defaultOptions]
  );

  const processNext = useCallback(async () => {
    const pipeline = getPipeline();
    await pipeline.processNext();
  }, []);

  const processAll = useCallback(async () => {
    const pipeline = getPipeline();
    await pipeline.processAll();
  }, []);

  const cancelJob = useCallback((jobId: string) => {
    const pipeline = getPipeline();
    pipeline.getQueue().cancel(jobId);
  }, []);

  const clearCompleted = useCallback(() => {
    const pipeline = getPipeline();
    pipeline.getQueue().clearCompleted();
    useSpeechEngineStore.getState().clearCompletedJobs();
  }, []);

  return {
    submitFiles,
    processNext,
    processAll,
    cancelJob,
    clearCompleted,
    isInitialized: isInitialized.current,
  };
}
