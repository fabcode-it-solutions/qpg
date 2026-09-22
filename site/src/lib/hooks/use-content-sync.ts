import { useEffect } from 'react';
import { contentSyncService } from '@/lib/services/content-sync.service';
import { useContentSyncContext } from '@/components/providers/ContentSyncProvider';

/**
 * Hook to ensure content is synced when components mount
 * Only syncs after initial sync is complete to avoid conflicts
 */
export function useContentSync(courseId?: string, videoId?: string) {
  const { isInitialSyncComplete } = useContentSyncContext();

  useEffect(() => {
    if (isInitialSyncComplete && (courseId || videoId)) {
      contentSyncService.ensureContentExists(courseId, videoId).catch(error => {
        console.warn('Content sync failed:', error);
      });
    }
  }, [courseId, videoId, isInitialSyncComplete]);
}

/**
 * Hook for manual full sync (admin use only)
 * Bypasses smart throttling
 */
export function useManualFullSync() {
  const syncContent = async () => {
    try {
      contentSyncService.clearCache();
      return await contentSyncService.syncAllContent();
    } catch (error) {
      console.error('Manual full sync failed:', error);
      throw error;
    }
  };

  return { syncContent };
}

/**
 * Hook to get sync status and stats
 */
export function useSyncStatus() {
  return useContentSyncContext();
}