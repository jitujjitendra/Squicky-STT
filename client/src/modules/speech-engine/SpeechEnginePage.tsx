/**
 * Speech Engine Module - Page Component (Premium Edition)
 *
 * The home page and primary entry point for the Squicky platform.
 * Orchestrates the upload zone, processing queue, job progress,
 * and transcription result views.
 *
 * Route: / (home)
 *
 * Architecture decision: The page acts as a layout orchestrator,
 * composing specialized components and connecting them via shared
 * state. Business logic lives in hooks and services, not here.
 */

import { useSpeechEngineStore } from './store';
import { useFileUpload } from './hooks/useFileUpload';
import { useProcessingPipeline } from './hooks/useProcessingPipeline';
import { UploadZone } from './components/UploadZone';
import { ProcessingStatus } from './components/ProcessingStatus';
import { JobProgress } from './components/JobProgress';
import { TranscriptionResult } from './components/TranscriptionResult';

export function SpeechEnginePage() {
  const jobs = useSpeechEngineStore((s) => s.jobs);
  const activeJobId = useSpeechEngineStore((s) => s.activeJobId);
  const transcripts = useSpeechEngineStore((s) => s.transcripts);
  const setActiveJob = useSpeechEngineStore((s) => s.setActiveJob);

  const { selectedFiles } = useFileUpload();
  const { submitFiles, processAll } = useProcessingPipeline();

  // If viewing a transcript result, show that view
  const activeTranscript = activeJobId ? transcripts.get(activeJobId) : undefined;
  if (activeTranscript) {
    return (
      <div className="flex flex-col items-center px-4 py-8">
        <TranscriptionResult
          transcript={activeTranscript}
          onBack={() => setActiveJob(null)}
        />
      </div>
    );
  }

  // Auto-submit validated files and trigger processing
  const handleSubmitAndProcess = async () => {
    if (selectedFiles.length === 0) return;
    await submitFiles(selectedFiles);
    // Small delay to allow state to propagate, then process
    setTimeout(() => void processAll(), 100);
  };

  return (
    <div className="flex flex-col items-center px-4 py-8">
      {/* Page header with gradient text */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
          Speech <span className="text-gradient">Engine</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto leading-relaxed">
          Upload audio or video files for transcription. All processing runs 
          <span className="text-privacy font-medium"> locally</span> in your browser.
        </p>
      </div>

      {/* Upload zone */}
      <UploadZone />

      {/* Submit button (shown when files are selected) */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 flex items-center gap-3">
          <span className="text-sm text-[var(--text-secondary)]">
            {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready
          </span>
          <button
            onClick={() => void handleSubmitAndProcess()}
            className="px-5 py-2.5 rounded-button bg-accent text-primary-dark font-semibold text-sm hover:bg-accent-hover shadow-glow-accent-sm hover:shadow-glow-accent transition-all duration-200"
          >
            Start Transcription
          </button>
        </div>
      )}

      {/* Processing status */}
      <ProcessingStatus />

      {/* Job list */}
      {jobs.length > 0 && (
        <div className="w-full max-w-2xl mx-auto mt-4 space-y-3">
          {jobs.map((job) => (
            <JobProgress
              key={job.id}
              job={job}
              onViewResult={(id) => setActiveJob(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
