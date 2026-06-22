/**
 * Queue Service
 *
 * Manages the processing queue for transcription jobs.
 * Provides FIFO ordering with priority support, retry logic,
 * and concurrent processing limits.
 *
 * Architecture decision: The queue is in-memory (no persistence) because
 * the privacy model requires session-based processing with no permanent
 * storage. Jobs are lost on page refresh by design.
 */

import type { TranscriptionJob, JobStatus, JobPriority } from '../types';

/** Maximum concurrent jobs processing at once */
const MAX_CONCURRENT = 2;

/** Default maximum retry attempts */
const DEFAULT_MAX_RETRIES = 3;

type JobUpdateCallback = (job: TranscriptionJob) => void;

export class QueueService {
  private queue: TranscriptionJob[] = [];
  private processing: Set<string> = new Set();
  private listeners: Set<JobUpdateCallback> = new Set();

  /**
   * Add a job to the queue
   */
  enqueue(job: TranscriptionJob): void {
    job.status = 'pending';
    job.stage = 'queued';
    job.max_retries = job.max_retries || DEFAULT_MAX_RETRIES;
    this.queue.push(job);
    this.sortQueue();
    this.notifyListeners(job);
  }

  /**
   * Remove a job from the queue
   */
  dequeue(jobId: string): TranscriptionJob | undefined {
    const index = this.queue.findIndex((j) => j.id === jobId);
    if (index === -1) return undefined;
    const [job] = this.queue.splice(index, 1);
    this.processing.delete(jobId);
    return job;
  }

  /**
   * Get the next job ready for processing
   * Returns undefined if max concurrency reached or queue empty
   */
  getNext(): TranscriptionJob | undefined {
    if (this.processing.size >= MAX_CONCURRENT) return undefined;

    const job = this.queue.find(
      (j) => j.status === 'pending' || j.status === 'retrying'
    );
    if (job) {
      job.status = 'processing';
      job.started_at = Date.now();
      this.processing.add(job.id);
      this.notifyListeners(job);
    }
    return job;
  }

  /**
   * Mark a job as completed
   */
  complete(jobId: string): void {
    const job = this.findJob(jobId);
    if (!job) return;
    job.status = 'completed';
    job.stage = 'completed';
    job.progress = 100;
    job.completed_at = Date.now();
    this.processing.delete(jobId);
    this.notifyListeners(job);
  }

  /**
   * Mark a job as failed, potentially scheduling a retry
   */
  fail(jobId: string, retryable: boolean): void {
    const job = this.findJob(jobId);
    if (!job) return;

    this.processing.delete(jobId);

    if (retryable && job.retry_count < job.max_retries) {
      job.retry_count += 1;
      job.status = 'retrying';
      this.notifyListeners(job);
    } else {
      job.status = 'failed';
      job.stage = 'failed';
      job.completed_at = Date.now();
      this.notifyListeners(job);
    }
  }

  /**
   * Cancel a job
   */
  cancel(jobId: string): void {
    const job = this.findJob(jobId);
    if (!job) return;
    job.status = 'cancelled';
    job.completed_at = Date.now();
    this.processing.delete(jobId);
    this.notifyListeners(job);
  }

  /**
   * Update job progress
   */
  updateProgress(jobId: string, progress: number, stage?: TranscriptionJob['stage']): void {
    const job = this.findJob(jobId);
    if (!job) return;
    job.progress = Math.min(100, Math.max(0, progress));
    if (stage) job.stage = stage;
    this.notifyListeners(job);
  }

  /**
   * Get all jobs in the queue
   */
  getAll(): TranscriptionJob[] {
    return [...this.queue];
  }

  /**
   * Get jobs by status
   */
  getByStatus(status: JobStatus): TranscriptionJob[] {
    return this.queue.filter((j) => j.status === status);
  }

  /**
   * Find a specific job by ID
   */
  findJob(jobId: string): TranscriptionJob | undefined {
    return this.queue.find((j) => j.id === jobId);
  }

  /**
   * Get current number of processing jobs
   */
  get activeCount(): number {
    return this.processing.size;
  }

  /**
   * Get total number of jobs
   */
  get totalCount(): number {
    return this.queue.length;
  }

  /**
   * Whether the queue can accept more processing jobs
   */
  get canProcess(): boolean {
    return this.processing.size < MAX_CONCURRENT;
  }

  /**
   * Subscribe to job updates
   */
  subscribe(callback: JobUpdateCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Clear all completed/failed jobs
   */
  clearCompleted(): void {
    this.queue = this.queue.filter(
      (j) => j.status !== 'completed' && j.status !== 'failed' && j.status !== 'cancelled'
    );
  }

  /**
   * Clear all jobs and reset
   */
  reset(): void {
    this.queue = [];
    this.processing.clear();
  }

  /**
   * Sort queue by priority (high first) then by creation time
   */
  private sortQueue(): void {
    const priorityOrder: Record<JobPriority, number> = {
      high: 0,
      normal: 1,
      low: 2,
    };
    this.queue.sort((a, b) => {
      // Keep processing/completed jobs in place
      if (a.status === 'processing' || b.status === 'processing') return 0;
      if (a.status === 'completed' || b.status === 'completed') return 0;
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return a.created_at - b.created_at;
    });
  }

  /**
   * Notify all listeners of a job update
   */
  private notifyListeners(job: TranscriptionJob): void {
    this.listeners.forEach((cb) => cb(job));
  }
}
