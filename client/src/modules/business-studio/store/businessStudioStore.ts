/**
 * Business Studio Zustand Store
 *
 * Central state management for the business intelligence pipeline.
 * Manages business mode, customer/sales/support insights, risks,
 * opportunities, commitments, follow-ups, CRM output, analytics,
 * and the review workflow.
 *
 * Architecture decision: Zustand matches the pattern used by other modules.
 * The updateItemStatus action enables human-in-the-loop review by toggling
 * items between suggested/confirmed/dismissed.
 */

import { create } from 'zustand';
import type {
  BusinessStudioState,
  BusinessMode,
  CustomerProfile,
  SalesSignal,
  SupportSignal,
  BusinessRisk,
  BusinessOpportunity,
  Commitment,
  FollowUp,
  InterviewIntelligence,
  CrmOutput,
  BusinessAnalytics,
  ReviewStatus,
} from '../types';

/** Empty customer profile */
const EMPTY_PROFILE: CustomerProfile = {
  painPoints: [],
  requirements: [],
  expectations: [],
  concerns: [],
};

export const useBusinessStudioStore = create<BusinessStudioState>((set) => ({
  // Initial state
  businessMode: null,
  customerProfile: EMPTY_PROFILE,
  salesInsights: [],
  supportInsights: [],
  risks: [],
  opportunities: [],
  commitments: [],
  followUps: [],
  interviewIntelligence: null,
  crmOutput: null,
  analytics: null,
  executiveSummary: [],
  isAnalyzing: false,
  error: null,

  // Actions
  setBusinessMode: (mode: BusinessMode | null) => set({ businessMode: mode }),

  setCustomerProfile: (profile: CustomerProfile) => set({ customerProfile: profile }),

  setSalesInsights: (insights: SalesSignal[]) => set({ salesInsights: insights }),

  setSupportInsights: (insights: SupportSignal[]) => set({ supportInsights: insights }),

  setRisks: (risks: BusinessRisk[]) => set({ risks }),

  setOpportunities: (opportunities: BusinessOpportunity[]) => set({ opportunities }),

  setCommitments: (commitments: Commitment[]) => set({ commitments }),

  setFollowUps: (followUps: FollowUp[]) => set({ followUps }),

  setInterviewIntelligence: (intel: InterviewIntelligence | null) =>
    set({ interviewIntelligence: intel }),

  setCrmOutput: (output: CrmOutput | null) => set({ crmOutput: output }),

  setAnalytics: (analytics: BusinessAnalytics | null) => set({ analytics }),

  setExecutiveSummary: (sentences: string[]) => set({ executiveSummary: sentences }),

  setIsAnalyzing: (isAnalyzing: boolean) => set({ isAnalyzing }),

  setError: (error: string | null) => set({ error }),

  updateItemStatus: (
    category: 'customerInsights' | 'salesInsights' | 'supportInsights' | 'risks' | 'opportunities' | 'commitments' | 'followUps',
    id: string,
    status: ReviewStatus
  ) =>
    set((state) => {
      switch (category) {
        case 'customerInsights': {
          // Update across all profile arrays
          const updateInsights = <T extends { id: string; status: ReviewStatus }>(arr: T[]) =>
            arr.map((item) => (item.id === id ? { ...item, status } : item));
          return {
            customerProfile: {
              painPoints: updateInsights(state.customerProfile.painPoints),
              requirements: updateInsights(state.customerProfile.requirements),
              expectations: updateInsights(state.customerProfile.expectations),
              concerns: updateInsights(state.customerProfile.concerns),
            },
          };
        }
        case 'salesInsights': {
          const items = state.salesInsights.map((item) =>
            item.id === id ? { ...item, status } : item
          );
          return { salesInsights: items };
        }
        case 'supportInsights': {
          const items = state.supportInsights.map((item) =>
            item.id === id ? { ...item, status } : item
          );
          return { supportInsights: items };
        }
        case 'risks': {
          const items = state.risks.map((item) =>
            item.id === id ? { ...item, status } : item
          );
          return { risks: items };
        }
        case 'opportunities': {
          const items = state.opportunities.map((item) =>
            item.id === id ? { ...item, status } : item
          );
          return { opportunities: items };
        }
        case 'commitments': {
          const items = state.commitments.map((item) =>
            item.id === id ? { ...item, status } : item
          );
          return { commitments: items };
        }
        case 'followUps': {
          const items = state.followUps.map((item) =>
            item.id === id ? { ...item, status } : item
          );
          return { followUps: items };
        }
        default:
          return state;
      }
    }),

  reset: () =>
    set({
      businessMode: null,
      customerProfile: EMPTY_PROFILE,
      salesInsights: [],
      supportInsights: [],
      risks: [],
      opportunities: [],
      commitments: [],
      followUps: [],
      interviewIntelligence: null,
      crmOutput: null,
      analytics: null,
      executiveSummary: [],
      isAnalyzing: false,
      error: null,
    }),
}));
