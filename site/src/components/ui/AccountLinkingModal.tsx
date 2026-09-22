'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { X, Mail, Key, Link } from 'lucide-react';

interface AccountLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  provider: string; // 'google', 'github', etc.
}

export default function AccountLinkingModal({ 
  isOpen, 
  onClose, 
  email, 
  provider 
}: AccountLinkingModalProps) {
  const [isLinking, setIsLinking] = useState(false);

  if (!isOpen) return null;

  const handleOAuthSignIn = async () => {
    setIsLinking(true);
    try {
      await signIn(provider, { 
        callbackUrl: '/dashboard',
        email 
      });
    } catch (error) {
      console.error('OAuth sign in failed:', error);
      setIsLinking(false);
    }
  };

  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Account Already Exists
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {email}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                This email is already registered with {providerName}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              To access your account, please sign in using {providerName} or contact support if you need help.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleOAuthSignIn}
                disabled={isLinking}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLinking ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                Sign in with {providerName}
              </button>

              <button
                onClick={onClose}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Need help? Contact our support team for assistance with your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}