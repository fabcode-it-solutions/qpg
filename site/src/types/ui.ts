import { ReactNode } from "react";

export interface PageHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  backgroundPattern?: boolean;
}

export interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

export interface FeatureGridProps {
  features: Feature[];
  className?: string;
  columns?: 2 | 3 | 4;
}

export interface ContactMethod {
  icon: ReactNode;
  title: string;
  description: string;
  value: string;
  href?: string;
  action?: string; // e.g., "Call", "Email", "Visit"
}

export interface ContactInfoProps {
  methods: ContactMethod[];
  className?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  businessAddress?: string;
  subject: string;
  message: string;
}

export interface ContactFormProps {
  className?: string;
}

export interface ContentSectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  background?: "default" | "subtle" | "gradient";
  centerText?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export interface GlassCardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  rounded?: "md" | "lg" | "xl" | "2xl";
}

export interface GoldButtonProps {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

// Team member interface for About page
export interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
}

// Support option interface for Contact page  
export interface SupportOption {
  title: string;
  description: string;
  hours: string;
  response: string;
}