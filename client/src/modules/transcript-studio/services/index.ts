/**
 * Transcript Studio Services - Barrel exports
 */

export {
  createTextEdit,
  createSplitOperation,
  createMergeOperation,
  createDeleteOperation,
  createRestoreOperation,
  createSpeakerChangeOperation,
  createSpeakerRenameOperation,
  applyOperation,
  revertOperation,
} from './EditService';

export {
  searchTranscript,
  getSegmentMatches,
  getNextMatchIndex,
  getPrevMatchIndex,
} from './SearchService';

export {
  saveSession,
  loadSession,
  removeSession,
  hasUnsavedChanges,
  hasRecoverableSession,
  cleanExpiredSessions,
} from './SessionService';

export {
  computeDisplaySegments,
  computeStats,
} from './MergeService';
