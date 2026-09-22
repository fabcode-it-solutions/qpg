import { cn } from "@/lib/utils/utils";
import { GoldButtonProps } from "@/types";

export function GoldButton({
  children,
  className,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  type = "button",
}: GoldButtonProps) {
  const baseClasses = "font-medium transition-all duration-200 rounded-lg";

  const variantClasses = {
    primary: "bg-(--color-gold) text-black hover:bg-(--color-gold)/80",
    secondary:
      "bg-white/10 text-white hover:bg-white/20 border border-white/20",
    outline:
      "border border-(--color-gold) text-(--color-gold) hover:bg-(--color-gold)/10",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2 text-base",
    lg: "px-8 py-3 text-lg",
  };

  const disabledClasses = "opacity-50 cursor-not-allowed";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && disabledClasses,
        className
      )}
    >
      {children}
    </button>
  );
}
