'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { contentSyncService } from '@/lib/services/content-sync.service';

interface ContentSyncContextType {
  isInitialSyncComplete: boolean;
  syncStats: { courses: number; videos: number };
}

const ContentSyncContext = createContext<ContentSyncContextType>({
  isInitialSyncComplete: false,
  syncStats: { courses: 0, videos: 0 },
});

export function ContentSyncProvider({ children }: { children: React.ReactNode }) {
  const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false);
  const [syncStats, setSyncStats] = useState({ courses: 0, videos: 0 });

  useEffect(() => {
    let mounted = true;

    const performInitialSync = async () => {
      try {
        const stats = await contentSyncService.smartInitialSync();
        
        if (mounted) {
          setSyncStats(stats);
          setIsInitialSyncComplete(true);
        }
      } catch (error) {
        console.error('Initial content sync failed:', error);
        if (mounted) {
          setIsInitialSyncComplete(true); // Don't block the app
        }
      }
    };

    performInitialSync();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ContentSyncContext.Provider value={{ isInitialSyncComplete, syncStats }}>
      {children}
    </ContentSyncContext.Provider>
  );
}

export const useContentSyncContext = () => useContext(ContentSyncContext);