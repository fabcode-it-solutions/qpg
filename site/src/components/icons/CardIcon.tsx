import React from "react";
import { IconProps } from "./types";

const CardIcon: React.FC<IconProps> = ({ 
  size = 24, 
  className = "", 
  ...props 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="2"
        y="8"
        width="20"
        height="3"
        fill="currentColor"
      />
      <rect
        x="4"
        y="14"
        width="4"
        height="2"
        rx="1"
        fill="currentColor"
      />
      <rect
        x="10"
        y="14"
        width="6"
        height="2"
        rx="1"
        fill="currentColor"
      />
    </svg>
  );
};

export default CardIcon;