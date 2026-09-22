/**
 * Comprehensive logout utility for handling OAuth provider sessions
 */

export const clearGoogleSession = () => {
  // Clear Google OAuth cookies if they exist
  if (typeof window !== 'undefined') {
    // Clear any Google-related cookies
    const cookiesToClear = [
      'accounts.google.com',
      '__Secure-1PSID',
      '__Secure-3PSID',
      '__Secure-1PAPISID',
      '__Secure-3PAPISID',
      'HSID',
      'SSID',
      'APISID',
      'SAPISID',
      'SID'
    ];

    cookiesToClear.forEach(cookieName => {
      // Clear for different domain variations
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.google.com`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.accounts.google.com`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // Clear any cached Google data from localStorage
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('google') || key.includes('oauth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Could not clear localStorage:', error);
    }

    // Clear sessionStorage as well
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('google') || key.includes('oauth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('Could not clear sessionStorage:', error);
    }
  }
};

export const performCompleteLogout = async (signOutFunction: () => Promise<void>) => {
  try {
    // Clear Google session data first
    clearGoogleSession();
    
    // Then perform NextAuth signout
    await signOutFunction();
  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails, redirect to home
    window.location.href = '/';
  }
};