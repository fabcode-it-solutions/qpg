import { duration } from "drizzle-orm/gel-core";
import { ReactNode } from "react";
import { number } from "zod";
import { Course, CourseProgress, UserSubscription } from "./course";

export interface OutlineTextType {
  text: string;
  className?: string;
}

export interface EffectPointsType {
  title: string;
  description: string;
}

export interface PricePlanCardType {
  duration: string;
  price: number;
  heading: string;
  features: string[];
}

export interface FeaturedCardType {
  imgSrc: string;
  number: number | string;
  description: string | ReactNode;
}

export interface BlogCardType {
  imgSrc: string;
  date: string;
  tags: string[];
  description: string;
  messageNumber: number;
}

export interface DashboardData {
  subscriptions: UserSubscription[];
  courses: Course[];
  progress: Record<string, CourseProgress>;
}

export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
  videoId?: string;
  userId?: string;
  expiresAt?: number;
}

export interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export interface FormData {
  plantImage: File | null;
  question: string;
  plantStage: string;
  weekNumber: number | string;
}

export interface FormErrors {
  plantImage?: string;
  question?: string;
  plantStage?: string;
  weekNumber?: string;
}
