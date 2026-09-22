import React from "react";
import { cn } from "@/lib/utils/utils";
import { IconProps } from "./types";

interface BaseIconProps extends IconProps {
  children: React.ReactNode;
  viewBox?: string;
}

export const Icon: React.FC<BaseIconProps> = ({
  children,
  className,
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  fill = "none",
  viewBox = "0 0 24 24",
  onClick,
  style,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  ...props
}) => {
  return (
    <svg
      className={cn(
        "flex-shrink-0",
        onClick && "cursor-pointer",
        className
      )}
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      onClick={onClick}
      style={style}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      role={onClick ? "button" : "img"}
      {...props}
    >
      {children}
    </svg>
  );
};

export default Icon;