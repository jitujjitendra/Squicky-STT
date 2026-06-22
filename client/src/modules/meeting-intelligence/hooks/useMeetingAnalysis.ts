/**
 * useMeetingAnalysis Hook
 *
 * Triggers the meeting analysis pipeline and populates the store
 * with results. Handles loading state and error management.
 *
 * Architecture decision: Wraps the synchronous pipeline in a setTimeout
 * to allow React to render the "analyzing" state before the potentially
 * heavy computation starts.
 */

import { useCallback } from 'react';
import { useMeetingIntelligenceStore } from '../store';
import { runMeetingAnalysis } from '../services/MeetingAnalysisPipeline';
import type { StandardTranscript } from '@/modules/speech-engine/types';

/**
 * Hook to run meeting analysis
 */
export function useMeetingAnalysis() {
  const setMeetingType = useMeetingIntelligenceStore((s) => s.setMeetingType);
  const setActionItems = useMeetingIntelligenceStore((s) => s.setActionItems);
  const setDecisions = useMeetingIntelligenceStore((s) => s.setDecisions);
  const setRisks = useMeetingIntelligenceStore((s) => s.setRisks);
  const setDeadlines = useMeetingIntelligenceStore((s) => s.setDeadlines);
  const setSpeakerStats = useMeetingIntelligenceStore((s) => s.setSpeakerStats);
  const setSummary = useMeetingIntelligenceStore((s) => s.setSummary);
  const setIsAnalyzing = useMeetingIntelligenceStore((s) => s.setIsAnalyzing);
  const setError = useMeetingIntelligenceStore((s) => s.setError);
  const reset = useMeetingIntelligenceStore((s) => s.reset);
  const isAnalyzing = useMeetingIntelligenceStore((s) => s.isAnalyzing);
  const error = useMeetingIntelligenceStore((s) => s.error);

  const analyze = useCallback((transcript: StandardTranscript) => {
    // Validate transcript
    if (!transcript.segments || transcript.segments.length === 0) {
      setError('Transcript has no segments to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    // Defer computation to allow UI update
    setTimeout(() => {
      try {
        const result = runMeetingAnalysis(transcript);

        setMeetingType(result.meetingType);
        setActionItems(result.actionItems);
        setDecisions(result.decisions);
        setRisks(result.risks);
        setDeadlines(result.deadlines);
        setSpeakerStats(result.speakerStats);
        setSummary(result.summary);
        setIsAnalyzing(false);

        // Show quality warning AFTER results are ready (not before, not overwritten)
        const quality = transcript.transcription_meta?.quality;
        if (quality && quality.quality_label === 'poor') {
          setError('Low-quality transcript — results may be inaccurate. Review all items carefully.');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis failed unexpectedly.';
        setError(message);
        setIsAnalyzing(false);
      }
    }, 0);
  }, [
    setMeetingType, setActionItems, setDecisions, setRisks,
    setDeadlines, setSpeakerStats, setSummary, setIsAnalyzing, setError,
  ]);

  const resetAnalysis = useCallback(() => {
    reset();
  }, [reset]);

  return {
    analyze,
    reset: resetAnalysis,
    isAnalyzing,
    error,
  };
}
