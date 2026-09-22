"use client";

import React, { useState, useEffect } from "react";
import type { ErrorBoundaryProps, ErrorInfo } from "@/types/sanity";

/**
 * Error boundary state interface
 */
interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
}

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<{
  error: Error;
  reset: () => void;
}> = ({ error, reset }) => (
  <div
    className="min-h-[200px] flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-8"
    role="alert"
    aria-live="assertive"
  >
    <div className="text-center max-w-md">
      <div className="text-red-500 mb-4">
        <svg
          className="w-12 h-12 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-red-800 mb-2">
        Something went wrong
      </h2>

      <p className="text-red-600 mb-4 text-sm">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "An unexpected error occurred. Please try again."}
      </p>

      <button
        onClick={reset}
        className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        type="button"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Try again
      </button>

      {process.env.NODE_ENV === "development" && (
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-red-600 text-sm font-medium">
            Error details (development only)
          </summary>
          <pre className="mt-2 text-xs text-red-800 bg-red-100 p-2 rounded overflow-auto max-h-32">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  </div>
);

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback: FallbackComponent,
  onError,
}) => {
  const [errorState, setErrorState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
  });

  /**
   * Reset error boundary state
   */
  const resetErrorBoundary = (): void => {
    setErrorState({
      hasError: false,
      error: null,
    });
  };

  /**
   * Handle errors from child components
   */
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      setErrorState({
        hasError: true,
        error: new Error(error.message),
      });

      // Log error details in development
      if (process.env.NODE_ENV === "development") {
        console.group("🚨 Error Boundary Caught Error");
        console.error("Error:", error);
        console.error("Filename:", error.filename);
        console.error("Line:", error.lineno);
        console.error("Column:", error.colno);
        console.groupEnd();
      }

      // Call custom error handler if provided
      if (onError) {
        try {
          onError(new Error(error.message), {
            componentStack: error.filename
              ? `at ${error.filename}:${error.lineno}:${error.colno}`
              : "Unknown location",
          });
        } catch (handlerError) {
          console.error("Error in error handler:", handlerError);
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setErrorState({
        hasError: true,
        error: new Error(event.reason?.message || "Promise rejection"),
      });

      if (onError) {
        try {
          onError(new Error(event.reason?.message || "Promise rejection"), {
            componentStack: "Promise rejection",
          });
        } catch (handlerError) {
          console.error("Error in error handler:", handlerError);
        }
      }
    };

    // Add global error listeners
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, [onError]);

  /**
   * Render error fallback or children
   */
  if (errorState.hasError && errorState.error) {
    const FallbackComponentToRender = FallbackComponent || DefaultErrorFallback;

    return (
      <FallbackComponentToRender
        error={errorState.error}
        reset={resetErrorBoundary}
      />
    );
  }

  return <>{children}</>;
};

/**
 * HOC to wrap components with error boundary
 *
 * @param Component - Component to wrap with error boundary
 * @param errorBoundaryProps - Error boundary configuration
 * @returns Wrapped component with error boundary
 *
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   onError: (error) => console.error('Component error:', error)
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || "Component"
  })`;

  return WrappedComponent;
}

/**
 * Hook to throw errors for testing error boundaries
 * Only available in development mode
 *
 * @returns Function to throw test errors
 *
 * @example
 * ```tsx
 * const throwError = useErrorBoundaryTester();
 *
 * return (
 *   <button onClick={() => throwError('Test error')}>
 *     Test Error Boundary
 *   </button>
 * );
 * ```
 */
export function useErrorBoundaryTester(): (message?: string) => never {
  return React.useCallback(
    (message = "Test error from useErrorBoundaryTester") => {
      if (process.env.NODE_ENV !== "development") {
        console.warn(
          "useErrorBoundaryTester should only be used in development"
        );
        return {} as never;
      }

      throw new Error(message);
    },
    []
  );
}

/**
 * Simple error boundary wrapper for quick usage
 *
 * @example
 * ```tsx
 * <SafeComponent onError={console.error}>
 *   <MyComponent />
 * </SafeComponent>
 * ```
 */
export const SafeComponent: React.FC<{
  children: React.ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, onError }) => (
  <ErrorBoundary onError={onError ? (error) => onError(error) : undefined}>
    {children}
  </ErrorBoundary>
);

SafeComponent.displayName = "SafeComponent";
