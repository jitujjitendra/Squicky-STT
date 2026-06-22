/**
 * Transcription Pipeline
 *
 * Orchestrates the full processing flow:
 * Upload -> Validate -> Queue -> Preprocess -> Transcribe -> Normalize -> Deliver
 *
 * Architecture decision: The pipeline is a coordinator, not a monolith.
 * Each stage delegates to its respective service. This enables independent
 * testing, replacement, and extension of individual stages.
 */

import type {
  TranscriptionJob,
  TranscriptionJobOptions,
  PipelineError,
} from '../types';
import { ValidationService } from './ValidationService';
import { QueueService } from './QueueService';
import { PreprocessingService } from './PreprocessingService';
import { EngineRegistry } from './EngineRegistry';

/** Generates a unique job ID */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export class TranscriptionPipeline {
  private validation: ValidationService;
  private queue: QueueService;
  private preprocessing: PreprocessingService;
  private engines: EngineRegistry;

  constructor(
    validation: ValidationService,
    queue: QueueService,
    preprocessing: PreprocessingService,
    engines: EngineRegistry
  ) {
    this.validation = validation;
    this.queue = queue;
    this.preprocessing = preprocessing;
    this.engines = engines;
  }

  /**
   * Submit a file for transcription
   * Validates and queues the file, returning the job reference
   */
  async submit(
    file: File,
    options?: Partial<TranscriptionJobOptions>
  ): Promise<TranscriptionJob> {
    // Stage 1: Validate
    const validationResult = await this.validation.validate(file);

    if (!validationResult.valid || !validationResult.metadata) {
      const error: PipelineError = {
        code: 'VALIDATION_FAILED',
        message: validationResult.errors[0]?.message ?? 'Validation failed',
        stage: 'validation',
        retryable: false,
        timestamp: Date.now(),
      };

      const failedJob: TranscriptionJob = {
        id: generateJobId(),
        file,
        metadata: {
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          duration_seconds: 0,
          has_video: false,
        },
        stage: 'failed',
        status: 'failed',
        priority: 'normal',
        progress: 0,
        engine_id: this.engines.getDefaultId() ?? 'mock',
        options: this.resolveOptions(options),
        error,
        retry_count: 0,
        max_retries: 0,
        created_at: Date.now(),
      };
      return failedJob;
    }

    // Stage 2: Create job and queue
    const metadata = validationResult.metadata;
    const job: TranscriptionJob = {
      id: generateJobId(),
      file,
      metadata,
      stage: 'queued',
      status: 'pending',
      priority: 'normal',
      progress: 0,
      engine_id: this.engines.getDefaultId() ?? 'mock',
      options: this.resolveOptions(options),
      retry_count: 0,
      max_retries: 3,
      created_at: Date.now(),
    };

    this.queue.enqueue(job);
    return job;
  }

  /**
   * Process the next job in the queue
   * Runs the full preprocessing -> transcription -> normalization flow
   */
  async processNext(): Promise<TranscriptionJob | undefined> {
    const job = this.queue.getNext();
    if (!job) return undefined;

    try {
      // Stage 3: Preprocess
      this.queue.updateProgress(job.id, 10, 'preprocessing');
      const preprocessResult = await this.preprocessing.process(
        job.file,
        job.metadata,
        (p) => this.queue.updateProgress(job.id, 10 + p * 0.3)
      );

      // Stage 4: Transcribe
      this.queue.updateProgress(job.id, 40, 'transcription');
      const engine = this.engines.get(job.engine_id) ?? this.engines.getDefault();
      if (!engine) {
        throw this.createError('ENGINE_NOT_READY', 'No transcription engine available', 'transcription');
      }

      if (!engine.isReady()) {
        await engine.initialize();
      }

      const transcript = await engine.transcribe(
        preprocessResult.audioRef,
        {
          language: job.options.language,
          diarization: job.options.diarization,
          word_timestamps: job.options.word_timestamps,
          model_size: job.options.model_size,
          on_progress: (p) => this.queue.updateProgress(job.id, 40 + p * 0.5),
        }
      );

      // Stage 5: Normalize (transcript is already normalized by the adapter)
      this.queue.updateProgress(job.id, 95, 'normalization');
      job.result = transcript;

      // Complete
      this.queue.complete(job.id);
      return job;
    } catch (err) {
      const pipelineError: PipelineError = err instanceof Error && 'code' in err
        ? err as unknown as PipelineError
        : {
            code: 'UNKNOWN_ERROR',
            message: err instanceof Error ? err.message : 'Unknown processing error',
            stage: job.stage,
            retryable: true,
            timestamp: Date.now(),
          };

      job.error = pipelineError;
      this.queue.fail(job.id, pipelineError.retryable);
      return job;
    }
  }

  /**
   * Process all pending jobs in sequence
   */
  async processAll(): Promise<TranscriptionJob[]> {
    const results: TranscriptionJob[] = [];
    let job = await this.processNext();
    while (job) {
      results.push(job);
      job = await this.processNext();
    }
    return results;
  }

  /**
   * Get the queue service for external monitoring
   */
  getQueue(): QueueService {
    return this.queue;
  }

  /**
   * Get the engine registry for engine management
   */
  getEngines(): EngineRegistry {
    return this.engines;
  }

  private resolveOptions(partial?: Partial<TranscriptionJobOptions>): TranscriptionJobOptions {
    return {
      language: partial?.language,
      diarization: partial?.diarization ?? false,
      word_timestamps: partial?.word_timestamps ?? true,
      model_size: partial?.model_size ?? 'base',
    };
  }

  private createError(
    code: PipelineError['code'],
    message: string,
    stage: PipelineError['stage']
  ): PipelineError & Error {
    const error = new Error(message) as PipelineError & Error;
    error.code = code;
    error.stage = stage;
    error.retryable = code !== 'ENGINE_NOT_READY';
    error.timestamp = Date.now();
    return error;
  }
}
