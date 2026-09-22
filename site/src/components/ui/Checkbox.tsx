"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils/utils";
import { CheckIcon, AlertIcon } from "@/components/icons";

interface CheckboxProps {
  id: string;
  name?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gold";
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id,
      name,
      checked,
      onChange,
      label,
      required = false,
      disabled = false,
      error,
      className,
      size = "md",
      variant = "gold",
      ...props
    },
    ref
  ) => {
    const sizeConfig = {
      sm: { box: "h-4 w-4", icon: 12, text: "text-xs" },
      md: { box: "h-5 w-5", icon: 14, text: "text-sm" },
      lg: { box: "h-6 w-6", icon: 16, text: "text-base" },
    };

    const config = sizeConfig[size];

    return (
      <div className={cn("flex items-start gap-3", className)}>
        {/* Hidden native input for accessibility */}
        <input
          ref={ref}
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          disabled={disabled}
          className="sr-only"
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />

        {/* Custom checkbox */}
        <div
          className={cn(
            "relative flex items-center justify-center rounded-md border-2 transition-all duration-200 cursor-pointer group",
            config.box,
            // Base state
            !checked && !error && "border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10",
            // Checked state
            checked && !error && variant === "gold" && "border-[var(--color-gold)] bg-[var(--color-gold)] hover:border-[var(--color-gold)]/80 hover:bg-[var(--color-gold)]/80",
            checked && !error && variant === "default" && "border-blue-500 bg-blue-500 hover:border-blue-400 hover:bg-blue-400",
            // Error state
            error && !checked && "border-red-500 bg-red-500/10 hover:border-red-400",
            error && checked && "border-red-500 bg-red-500 hover:border-red-400 hover:bg-red-400",
            // Disabled state
            disabled && "opacity-50 cursor-not-allowed hover:border-white/30 hover:bg-white/5",
            // Focus styles
            "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-black",
            variant === "gold" && "focus-within:ring-[var(--color-gold)]/20",
            variant === "default" && "focus-within:ring-blue-500/20",
            error && "focus-within:ring-red-500/20"
          )}
          onClick={() => !disabled && onChange(!checked)}
        >
          {/* Checkmark */}
          <div
            className={cn(
              "transition-all duration-200 transform",
              checked ? "scale-100 opacity-100" : "scale-0 opacity-0"
            )}
          >
            <CheckIcon
              size={config.icon}
              className={cn(
                "transition-colors duration-200",
                variant === "gold" && "text-black",
                variant === "default" && "text-white",
                error && "text-white"
              )}
            />
          </div>
        </div>

        {/* Label and error */}
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={id}
              className={cn(
                "cursor-pointer select-none leading-relaxed transition-colors duration-200",
                config.text,
                disabled && "opacity-50 cursor-not-allowed",
                error ? "text-red-400" : "text-gray-300 hover:text-white"
              )}
            >
              {label}
              {required && <span className="text-red-400 ml-1">*</span>}
            </label>
          )}

          {error && (
            <div className="flex items-center gap-2 mt-1" id={`${id}-error`}>
              <AlertIcon size={14} className="text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-xs">{error}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;