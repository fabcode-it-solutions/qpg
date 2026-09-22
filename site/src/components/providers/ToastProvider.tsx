"use client";

import React, { createContext, useContext } from "react";
import { useToast } from "@/hooks/useToast";
import Toast, { ToastType } from "@/components/ui/Toast";

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => string;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps) {
  const { toasts, showToast, hideToast, success, error, warning, info } = useToast();

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Render toasts */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={() => hideToast(toast.id)}
          isVisible={true}
        />
      ))}
    </ToastContext.Provider>
  );
}