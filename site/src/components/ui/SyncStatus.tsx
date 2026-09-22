'use client';

import { useSyncStatus } from '@/lib/hooks/use-content-sync';

export function SyncStatus() {
  const { isInitialSyncComplete, syncStats } = useSyncStatus();

  if (isInitialSyncComplete) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm">
      <div className="flex items-center space-x-2">
        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="text-sm text-blue-700">
          Initializing content...
        </span>
      </div>
      {syncStats.courses > 0 && (
        <div className="text-xs text-blue-600 mt-1">
          {syncStats.courses} courses, {syncStats.videos} videos
        </div>
      )}
    </div>
  );
}