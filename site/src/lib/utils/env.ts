// This script injects environment variables into the window object
// It should be included in the _document.js or layout.tsx file

declare global {
  interface Window {
    __ENV: {
      AI_SOCKET_URL: string | undefined;
      // Add other environment variables as needed
    };
  }
}

export function injectEnvVars() {
  if (typeof window !== 'undefined') {
    window.__ENV = {
      AI_SOCKET_URL: process.env.NEXT_PUBLIC_AI_SOCKET_URL || process.env.AI_SOCKET_URL,
      // Add other environment variables as needed
    };
    
    console.log('Environment variables injected:', window.__ENV);
  }
}