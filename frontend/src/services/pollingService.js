/**
 * Global Polling Service
 * 
 * This service manages polling for document processing status across the entire application.
 * Polling continues even when components unmount or user navigates away, ensuring background
 * processing is tracked regardless of UI state.
 */

class PollingService {
  constructor() {
    this.intervals = new Map(); // Map<docId, intervalId>
    this.callbacks = new Map(); // Map<docId, Set<callback>>
    this.isPolling = new Map(); // Map<docId, boolean>
    
    // Listen for logout to stop all polling
    this.setupLogoutListener();
  }
  
  setupLogoutListener() {
    const handleLogout = () => {
      //console.log('[PollingService] Logout detected, stopping all polling');
      this.stopAllPolling();
    };
    
    // Listen for custom logout event
    window.addEventListener('userLogout', handleLogout);
    
    // Listen for storage changes (logout clears localStorage)
    const handleStorageChange = (e) => {
      if (e.key === 'access_token' && !e.newValue) {
        //console.log('[PollingService] Token removed, stopping all polling');
        this.stopAllPolling();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
  }

  /**
   * Start polling for a document
   * @param {number} docId - Document ID to poll
   * @param {Function} callback - Callback function to call with status updates
   * @param {number} intervalMs - Polling interval in milliseconds (default: 5000)
   */
  startPolling(docId, callback, intervalMs = 5000) {
    if (!docId || !callback) {
      console.warn('[PollingService] Invalid parameters for startPolling');
      return;
    }

    // Add callback to set
    if (!this.callbacks.has(docId)) {
      this.callbacks.set(docId, new Set());
    }
    this.callbacks.get(docId).add(callback);

    // If already polling, just add the callback
    if (this.intervals.has(docId)) {
      //console.log(`[PollingService] Already polling document ${docId}, added callback`);
      return;
    }

    // Start polling
    //console.log(`[PollingService] Starting polling for document ${docId} (interval: ${intervalMs}ms)`);
    this.isPolling.set(docId, true);

    const intervalId = setInterval(async () => {
      // Check if still polling (might have been stopped)
      if (!this.isPolling.get(docId)) {
        return;
      }

      try {
        // Import apiService dynamically to avoid circular dependencies
        const apiService = (await import('./api')).default;
        const statusResponse = await apiService.getProcessingStatus(docId);
        
        // Call all registered callbacks
        const callbacks = this.callbacks.get(docId);
        if (callbacks) {
          callbacks.forEach(cb => {
            try {
              cb(statusResponse);
            } catch (error) {
              console.error(`[PollingService] Error in callback for document ${docId}:`, error);
            }
          });
        }

        // Stop polling if status is SUCCESS
        if (statusResponse.overall_status === 'SUCCESS') {
          //console.log(`[PollingService] Document ${docId} completed, stopping polling`);
          this.stopPolling(docId);
        }
      } catch (error) {
        console.error(`[PollingService] Error polling document ${docId}:`, error);
        // Continue polling on error (might be temporary network issue)
        // Stop only on 401 Unauthorized
        if (error.message === 'Unauthorized') {
          //console.log(`[PollingService] Unauthorized error, stopping polling for document ${docId}`);
          this.stopPolling(docId);
        }
      }
    }, intervalMs);

    this.intervals.set(docId, intervalId);
  }

  /**
   * Stop polling for a document
   * @param {number} docId - Document ID to stop polling
   * @param {Function} callback - Optional: remove only this callback
   */
  stopPolling(docId, callback = null) {
    if (!docId) return;

    // If specific callback provided, just remove that callback
    if (callback && this.callbacks.has(docId)) {
      this.callbacks.get(docId).delete(callback);
      // If no more callbacks, stop the interval
      if (this.callbacks.get(docId).size === 0) {
        this.callbacks.delete(docId);
        if (this.intervals.has(docId)) {
          clearInterval(this.intervals.get(docId));
          this.intervals.delete(docId);
          this.isPolling.delete(docId);
          //console.log(`[PollingService] Stopped polling for document ${docId} (no more callbacks)`);
        }
      }
      return;
    }

    // Stop all polling for this document
    if (this.intervals.has(docId)) {
      clearInterval(this.intervals.get(docId));
      this.intervals.delete(docId);
      this.isPolling.delete(docId);
      this.callbacks.delete(docId);
      //console.log(`[PollingService] Stopped polling for document ${docId}`);
    }
  }

  /**
   * Check if polling is active for a document
   * @param {number} docId - Document ID to check
   * @returns {boolean}
   */
  isPollingActive(docId) {
    return this.isPolling.get(docId) === true;
  }

  /**
   * Stop all polling (useful for logout)
   */
  stopAllPolling() {
    //console.log('[PollingService] Stopping all polling');
    this.intervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.intervals.clear();
    this.callbacks.clear();
    this.isPolling.clear();
  }
}

// Export singleton instance
const pollingService = new PollingService();
export default pollingService;
