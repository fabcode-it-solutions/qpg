// Lazy-loaded components for better performance
import { lazy } from 'react';

// Blog components
export const LazyBlogGrid = lazy(() => 
  import('@/components/blog/BlogGrid').then(module => ({ default: module.BlogGrid }))
);

export const LazyFeaturedBlogPosts = lazy(() => 
  import('@/components/blog/FeaturedBlogPosts').then(module => ({ default: module.FeaturedBlogPosts }))
);

// Course components  
export const LazyCourseGrid = lazy(() => 
  import('@/components/courses/CourseGrid')
);

export const LazyVideoPlayer = lazy(() => 
  import('@/components/ui/VideoPlayer').then(module => ({ default: module.VideoPlayer }))
);

// Chat components
export const LazyChatInput = lazy(() => 
  import('@/components/chat/ChatInput').then(module => ({ default: module.ChatInput }))
);

export const LazyEnhancedChatInput = lazy(() => 
  import('@/components/chat/EnhancedChatInput').then(module => ({ default: module.EnhancedChatInput }))
);

// Dashboard components
export const LazyEnhancedUserDashboard = lazy(() => 
  import('@/components/dashboard/EnhancedUserDashboard')
);