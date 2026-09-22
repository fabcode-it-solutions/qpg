'use client';

import { useEffect, useState } from 'react';

export function CoursePageSync() {
  const [isLoading, setIsLoading] = useState(true);
  const [syncStats, setSyncStats] = useState({ courses: 0, videos: 0 });

  useEffect(() => {
    let mounted = true;

    const syncContent = async () => {
      try {
        const response = await fetch('/api/sync/content', {
          method: 'GET',
        });
        
        if (response.ok) {
          const result = await response.json();
          if (mounted) {
            setSyncStats(result.data || { courses: 0, videos: 0 });
            setIsLoading(false);
          }
        } else {
          if (mounted) {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Course page sync failed:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    syncContent();

    return () => {
      mounted = false;
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm">
      <div className="flex items-center space-x-2">
        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="text-sm text-blue-700">
          Loading courses...
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