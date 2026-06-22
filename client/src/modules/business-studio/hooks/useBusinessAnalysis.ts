/**
 * useBusinessAnalysis Hook
 *
 * Triggers the business analysis pipeline and populates the store
 * with results. Handles loading state and error management.
 *
 * Architecture decision: Wraps the synchronous pipeline in a setTimeout
 * to allow React to render the "analyzing" state before the potentially
 * heavy computation starts. Quality gate checks for "poor" transcripts.
 */

import { useCallback } from 'react';
import { useBusinessStudioStore } from '../store';
import { runBusinessAnalysis } from '../services/BusinessAnalysisPipeline';
import type { StandardTranscript } from '@/modules/speech-engine/types';

/**
 * Hook to run business analysis
 */
export function useBusinessAnalysis() {
  const setBusinessMode = useBusinessStudioStore((s) => s.setBusinessMode);
  const setCustomerProfile = useBusinessStudioStore((s) => s.setCustomerProfile);
  const setSalesInsights = useBusinessStudioStore((s) => s.setSalesInsights);
  const setSupportInsights = useBusinessStudioStore((s) => s.setSupportInsights);
  const setRisks = useBusinessStudioStore((s) => s.setRisks);
  const setOpportunities = useBusinessStudioStore((s) => s.setOpportunities);
  const setCommitments = useBusinessStudioStore((s) => s.setCommitments);
  const setFollowUps = useBusinessStudioStore((s) => s.setFollowUps);
  const setInterviewIntelligence = useBusinessStudioStore((s) => s.setInterviewIntelligence);
  const setAnalytics = useBusinessStudioStore((s) => s.setAnalytics);
  const setExecutiveSummary = useBusinessStudioStore((s) => s.setExecutiveSummary);
  const setIsAnalyzing = useBusinessStudioStore((s) => s.setIsAnalyzing);
  const setError = useBusinessStudioStore((s) => s.setError);
  const reset = useBusinessStudioStore((s) => s.reset);
  const isAnalyzing = useBusinessStudioStore((s) => s.isAnalyzing);
  const error = useBusinessStudioStore((s) => s.error);

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
        const result = runBusinessAnalysis(transcript);

        setBusinessMode(result.businessMode);
        setCustomerProfile(result.customerProfile);
        setSalesInsights(result.salesInsights);
        setSupportInsights(result.supportInsights);
        setRisks(result.risks);
        setOpportunities(result.opportunities);
        setCommitments(result.commitments);
        setFollowUps(result.followUps);
        setInterviewIntelligence(result.interviewIntelligence);
        setAnalytics(result.analytics);
        setExecutiveSummary(result.executiveSummary);
        setIsAnalyzing(false);

        // Quality gate: warn on "poor" transcript quality
        const quality = transcript.transcription_meta?.quality;
        if (quality && quality.quality_label === 'poor') {
          setError('Low-quality transcript - results may be inaccurate. Review all items carefully.');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis failed unexpectedly.';
        setError(message);
        setIsAnalyzing(false);
      }
    }, 0);
  }, [
    setBusinessMode, setCustomerProfile, setSalesInsights, setSupportInsights,
    setRisks, setOpportunities, setCommitments, setFollowUps,
    setInterviewIntelligence, setAnalytics, setExecutiveSummary,
    setIsAnalyzing, setError,
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
