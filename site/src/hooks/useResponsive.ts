import { useState, useEffect, useCallback } from "react";
import { debounce } from "@/lib/utils";
import type { ResponsiveBreakpoints } from "@/types/sanity";

/**
 * Default responsive breakpoints following Tailwind CSS conventions
 */
const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 640, // sm
  tablet: 768, // md
  desktop: 1024, // lg
  large: 1280, // xl
  xlarge: 1536, // 2xl
  wide: 1920, // Full HD
} as const;

/**
 * Responsive state interface
 */
export interface ResponsiveState {
  readonly width: number;
  readonly height: number;
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isDesktop: boolean;
  readonly isLarge: boolean;
  readonly isXLarge: boolean;
  readonly isWide: boolean;
  readonly isSmallScreen: boolean; // Convenience for < desktop
  readonly currentBreakpoint: 'mobile' | 'tablet' | 'desktop' | 'large' | 'xlarge' | 'wide';
}

/**
 * Hook options interface
 */
interface UseResponsiveOptions {
  /**
   * Custom breakpoints override
   */
  readonly breakpoints?: Partial<ResponsiveBreakpoints>;

  /**
   * Debounce delay for resize events in milliseconds
   * @default 150
   */
  readonly debounceMs?: number;

  /**
   * Enable server-side rendering support
   * @default true
   */
  readonly ssrSupport?: boolean;
}

/**
 * Get current window dimensions safely
 */
const getWindowDimensions = (): { width: number; height: number } => {
  if (typeof window === "undefined") {
    return { width: 1024, height: 768 }; // Default SSR dimensions
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

/**
 * Calculate responsive state based on current dimensions
 */
const calculateResponsiveState = (
  width: number,
  height: number,
  breakpoints: ResponsiveBreakpoints
): ResponsiveState => {
  const xlarge = breakpoints.xlarge || 1536;
  const wide = breakpoints.wide || 1920;
  
  let currentBreakpoint: 'mobile' | 'tablet' | 'desktop' | 'large' | 'xlarge' | 'wide';
  
  if (width < breakpoints.mobile) {
    currentBreakpoint = 'mobile';
  } else if (width < breakpoints.tablet) {
    currentBreakpoint = 'tablet';
  } else if (width < breakpoints.desktop) {
    currentBreakpoint = 'tablet';
  } else if (width < breakpoints.large) {
    currentBreakpoint = 'desktop';
  } else if (width < xlarge) {
    currentBreakpoint = 'large';
  } else if (width < wide) {
    currentBreakpoint = 'xlarge';
  } else {
    currentBreakpoint = 'wide';
  }
  
  return {
    width,
    height,
    isMobile: width < breakpoints.mobile,
    isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
    isDesktop: width >= breakpoints.desktop && width < breakpoints.large,
    isLarge: width >= breakpoints.large && width < xlarge,
    isXLarge: width >= xlarge && width < wide,
    isWide: width >= wide,
    isSmallScreen: width < breakpoints.desktop,
    currentBreakpoint,
  };
};

export const useResponsive = ({
  breakpoints: customBreakpoints = {},
  debounceMs = 150,
  ssrSupport = true,
}: UseResponsiveOptions = {}): ResponsiveState => {
  // Merge custom breakpoints with defaults
  const breakpoints: ResponsiveBreakpoints = {
    ...DEFAULT_BREAKPOINTS,
    ...customBreakpoints,
  };

  // Initialize state
  const [dimensions, setDimensions] = useState(() => {
    if (!ssrSupport || typeof window !== "undefined") {
      return getWindowDimensions();
    }
    return { width: breakpoints.desktop, height: 768 };
  });

  /**
   * Handle window resize with proper error handling
   */
  const handleResize = useCallback(() => {
    try {
      const newDimensions = getWindowDimensions();
      setDimensions(newDimensions);
    } catch (error) {
      console.warn("Error getting window dimensions:", error);
    }
  }, []);

  /**
   * Debounced resize handler for performance
   */
  const debouncedHandleResize = useCallback(
    debounce(handleResize, debounceMs),
    [handleResize, debounceMs]
  );

  /**
   * Set up resize event listener with proper cleanup
   */
  useEffect(() => {
    // Skip if running on server
    if (typeof window === "undefined") {
      return;
    }

    // Set initial dimensions on client-side hydration
    if (ssrSupport) {
      handleResize();
    }

    // Add event listener
    window.addEventListener("resize", debouncedHandleResize, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  }, [debouncedHandleResize, handleResize, ssrSupport]);

  // Calculate and return responsive state
  return calculateResponsiveState(
    dimensions.width,
    dimensions.height,
    breakpoints
  );
};

/**
 * Hook specifically for mobile detection (convenience wrapper)
 *
 * @param breakpoint - Custom mobile breakpoint (default: 768)
 * @returns Boolean indicating if current screen is mobile
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile(992); // Custom breakpoint at 992px
 *
 * return isMobile ? <MobileNav /> : <DesktopNav />;
 * ```
 */
export const useIsMobile = (
  breakpoint: number = DEFAULT_BREAKPOINTS.tablet
): boolean => {
  const { width } = useResponsive({
    breakpoints: { tablet: breakpoint },
    debounceMs: 100,
  });

  return width < breakpoint;
};

/**
 * Hook for detecting small screens (mobile + tablet)
 *
 * @param breakpoint - Custom desktop breakpoint (default: 1024)
 * @returns Boolean indicating if current screen is small
 *
 * @example
 * ```tsx
 * const isSmallScreen = useIsSmallScreen(992);
 *
 * return (
 *   <div className={isSmallScreen ? 'flex-col' : 'flex-row'}>
 *     {content}
 *   </div>
 * );
 * ```
 */
export const useIsSmallScreen = (
  breakpoint: number = DEFAULT_BREAKPOINTS.desktop
): boolean => {
  const { isSmallScreen } = useResponsive({
    breakpoints: { desktop: breakpoint },
    debounceMs: 100,
  });

  return isSmallScreen;
};
