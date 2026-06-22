/**
 * Cleanup Service
 *
 * Manages temporary file references and session-based data lifecycle.
 * Ensures no audio data persists beyond the current session.
 *
 * Architecture decision: Privacy-first means all processing artifacts
 * are stored in memory or sessionStorage only. This service provides
 * explicit cleanup hooks and automatic cleanup on session end.
 */

type CleanupCallback = () => void;

export class CleanupService {
  private cleanupCallbacks: Set<CleanupCallback> = new Set();
  private objectUrls: Set<string> = new Set();
  private sessionKey = 'squicky-session-active';
  private isInitialized = false;

  /**
   * Initialize the cleanup service
   * Sets up session tracking and beforeunload handler
   */
  initialize(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Mark session as active
    sessionStorage.setItem(this.sessionKey, 'true');

    // Register cleanup on page unload
    window.addEventListener('beforeunload', this.handleUnload);

    // Register cleanup on visibility change (tab close)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Register a cleanup callback to run on session end
   */
  onCleanup(callback: CleanupCallback): () => void {
    this.cleanupCallbacks.add(callback);
    return () => this.cleanupCallbacks.delete(callback);
  }

  /**
   * Track an object URL for automatic revocation
   */
  trackObjectUrl(url: string): void {
    this.objectUrls.add(url);
  }

  /**
   * Revoke a tracked object URL
   */
  revokeObjectUrl(url: string): void {
    if (this.objectUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.objectUrls.delete(url);
    }
  }

  /**
   * Run all cleanup tasks immediately
   */
  cleanup(): void {
    // Revoke all object URLs
    this.objectUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.objectUrls.clear();

    // Run registered callbacks
    this.cleanupCallbacks.forEach((cb) => {
      try {
        cb();
      } catch {
        // Ignore cleanup errors
      }
    });

    // Clear session storage
    sessionStorage.removeItem(this.sessionKey);
  }

  /**
   * Dispose the service and remove event listeners
   */
  dispose(): void {
    this.cleanup();
    window.removeEventListener('beforeunload', this.handleUnload);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.cleanupCallbacks.clear();
    this.isInitialized = false;
  }

  /**
   * Check if the session is still active
   */
  isSessionActive(): boolean {
    return sessionStorage.getItem(this.sessionKey) === 'true';
  }

  private handleUnload = (): void => {
    this.cleanup();
  };

  private handleVisibilityChange = (): void => {
    // Only clean up if the page is being hidden (potential tab close)
    // Note: we don't clean up on every visibility change as user may just switch tabs
    if (document.visibilityState === 'hidden') {
      // Store a flag so that if the tab is actually closed, data is marked stale
      sessionStorage.setItem('squicky-last-hidden', Date.now().toString());
    }
  };
}
