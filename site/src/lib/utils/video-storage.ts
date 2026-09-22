/**
 * Utility functions for managing video progress in local storage
 */

/**
 * Clear all video progress from local storage
 */
export function clearAllVideoProgress(): void {
  try {
    const keysToRemove: string[] = [];
    
    // Find all video progress keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('video_progress_')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all video progress keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`[VideoStorage] Cleared ${keysToRemove.length} video progress entries from localStorage`);
  } catch (error) {
    console.warn('Failed to clear video progress from localStorage:', error);
  }
}

/**
 * Clear video progress for a specific course
 */
export function clearCourseVideoProgress(courseId: string): void {
  try {
    const keysToRemove: string[] = [];
    
    // Find all video progress keys for this course
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('video_progress_') && key.includes(`_${courseId}`)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove course-specific video progress keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`[VideoStorage] Cleared ${keysToRemove.length} video progress entries for course ${courseId}`);
  } catch (error) {
    console.warn(`Failed to clear video progress for course ${courseId}:`, error);
  }
}

/**
 * Get all video progress from local storage
 */
export function getAllVideoProgress(): Record<string, any> {
  try {
    const progressData: Record<string, any> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('video_progress_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            progressData[key] = JSON.parse(data);
          }
        } catch (parseError) {
          console.warn(`Failed to parse progress data for key ${key}:`, parseError);
        }
      }
    }
    
    return progressData;
  } catch (error) {
    console.warn('Failed to get all video progress:', error);
    return {};
  }
}

/**
 * Validate and sync local storage with server data
 * This can be called to clean up inconsistent data
 */
export async function validateVideoProgressWithServer(
  userId: string,
  courseId: string
): Promise<void> {
  try {
    // This would typically call an API to get all user progress for a course
    // and compare with local storage, removing any inconsistent entries
    
    console.log(`[VideoStorage] Validating progress for user ${userId} in course ${courseId}`);
    
    // For now, we'll just log the action
    // In a full implementation, this would:
    // 1. Fetch all user progress from server
    // 2. Compare with local storage
    // 3. Remove/update inconsistent entries
    
  } catch (error) {
    console.warn('Failed to validate video progress with server:', error);
  }
}