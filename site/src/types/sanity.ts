/**
 * Sanity CMS content types and interfaces
 * @fileoverview Comprehensive type definitions for Sanity content management
 */

import { SanityImageSource } from "@sanity/image-url/lib/types/types";

/**
 * Base section interface that all section types extend
 */
export interface BaseSectionProps {
  readonly _key: string;
  readonly _type: string;
  readonly title?: string;
  readonly heading?: string;
  readonly subheading?: string;
  readonly description?: string;
  readonly backgroundColor?: BackgroundColor;
}

/**
 * Supported background color variants
 */
export type BackgroundColor =
  | "white"
  | "gray-50"
  | "gray-900"
  | "black"
  | "primary";

/**
 * Feature item with icon and display order
 */
export interface Feature {
  readonly title: string;
  readonly description: string;
  readonly icon?: SanityImageSource;
  readonly value?: string;
  readonly order: number;
}

/**
 * Media types supported by sections
 */
export type MediaType = "image" | "video" | "images";

/**
 * Media position options
 */
export type MediaPosition = "left" | "right" | "top" | "bottom" | "background";

/**
 * Video asset from Sanity
 */
export interface SanityVideoAsset {
  readonly asset: {
    readonly _id: string;
    readonly url: string;
  };
}

/**
 * Gallery image structure
 */
export interface GalleryImage {
  readonly image: SanityImageSource;
  readonly alt: string;
  readonly caption?: string;
}

/**
 * Section media configuration
 */
export interface SectionMedia {
  readonly mediaType: MediaType;
  readonly image?: SanityImageSource;
  readonly video?: SanityVideoAsset;
  readonly videoUrl?: string;
  readonly images?: readonly GalleryImage[];
  readonly alt?: string;
  readonly caption?: string;
  readonly position: MediaPosition;
}

/**
 * Features section layout options
 */
export type FeaturesLayout = "grid-2" | "grid-3" | "list" | "side-by-side";

/**
 * Live chat widget configuration
 */
export interface LiveChatConfig {
  readonly title?: string;
  readonly subtitle?: string;
  readonly buttonText?: string;
  readonly showChat?: boolean;
}

/**
 * Features section props interface
 */
export interface FeaturesSectionProps {
  readonly heading?: string;
  readonly subheading?: string;
  readonly description?: string;
  readonly features?: readonly Feature[];
  readonly media?: SectionMedia;
  readonly backgroundColor?: BackgroundColor;
  readonly layout?: FeaturesLayout;
  readonly ctaButton?: CtaButton;
  readonly liveChat?: LiveChatConfig;
}

/**
 * Hero background image configuration
 */
export interface HeroBackgroundImage {
  readonly image: SanityImageSource;
  readonly alt: string;
  readonly position: string;
  readonly opacity: number;
  readonly order: number;
}

/**
 * Pricing information for CTA button
 */
export interface PricingInfo {
  readonly showPricing: boolean;
  readonly title?: string;
  readonly standardPrice?: {
    readonly label: string;
    readonly amount: string;
  };
  readonly offerPrice?: {
    readonly label: string;
    readonly amount: string;
  };
}

/**
 * Call-to-action button configuration
 */
export interface CtaButton {
  readonly text: string;
  readonly href: string;
  readonly style: "outlined" | "filled" | "primary";
  readonly showButton?: boolean;
  readonly pricing?: PricingInfo;
}

/**
 * Hero section props interface
 */
export interface HeroSectionProps {
  readonly heading?: string;
  readonly subheading?: string;
  readonly description?: string;
  readonly backgroundImages?: readonly HeroBackgroundImage[];
  readonly backgroundColor?: BackgroundColor;
  readonly ctaButton?: CtaButton;
}

/**
 * Section image with positioning
 */
export interface SectionImage {
  readonly asset: SanityImageSource;
  readonly alt: string;
  readonly caption?: string;
  readonly position?: string;
}

/**
 * About section props interface
 */
export interface AboutSectionProps extends BaseSectionProps {
  readonly content?: readonly any[]; // Portable Text content
  readonly images?: readonly SectionImage[];
  readonly features?: readonly Feature[];
}

/**
 * Content section props interface
 */
export interface ContentSectionProps extends BaseSectionProps {
  readonly content?: readonly any[]; // Portable Text content
  readonly images?: readonly SectionImage[];
}

/**
 * Contact information structure
 */
export interface ContactInfo {
  readonly email?: string;
  readonly phone?: string;
  readonly address?: string;
}

/**
 * Contact section props interface
 */
export interface ContactSectionProps extends BaseSectionProps {
  readonly contactInfo?: ContactInfo;
  readonly showContactForm?: boolean;
}

/**
 * Video item for videos section
 */
export interface VideoItem {
  readonly title: string;
  readonly description?: string;
  readonly bunnyVideoId: string;
  readonly bunnyLibraryId: string;
  readonly thumbnailUrl?: string;
  readonly duration?: number;
  readonly order: number;
  readonly isActive: boolean;
}

/**
 * Access control configuration for videos
 */
export interface VideoAccessControl {
  readonly requireLogin: boolean;
  readonly loginMessage?: string;
  readonly subscriptionRequired: boolean;
}

/**
 * Videos section layout options
 */
export type VideosLayout = "grid-2x2" | "row-4" | "featured-grid";

/**
 * Enrollment button configuration
 */
export interface EnrollButton {
  readonly text: string;
  readonly href: string;
  readonly showButton: boolean;
}

/**
 * Videos section props interface
 */
export interface VideosSectionProps {
  readonly heading?: string;
  readonly subheading?: string;
  readonly description?: string;
  readonly videos?: readonly VideoItem[];
  readonly backgroundColor?: BackgroundColor;
  readonly accessControl?: VideoAccessControl;
  readonly layout?: VideosLayout;
  readonly enrollButton?: EnrollButton;
}

/**
 * Union type for all possible section types
 */
export type SectionType =
  | "heroSection"
  | "aboutSection"
  | "contentSection"
  | "contactSection"
  | "featuresSection"
  | "videosSection";

/**
 * Generic section data structure from Sanity
 */
export interface SectionData extends BaseSectionProps {
  readonly _type: SectionType;
  readonly content?: readonly any[];
  readonly backgroundImages?: readonly HeroBackgroundImage[];
  readonly ctaButton?: CtaButton;
  readonly images?: readonly SectionImage[];
  readonly features?: readonly Feature[];
  readonly contactInfo?: ContactInfo;
  readonly showContactForm?: boolean;
  readonly media?: SectionMedia;
  readonly layout?: FeaturesLayout | VideosLayout;
  readonly liveChat?: LiveChatConfig;
  readonly videos?: readonly VideoItem[];
  readonly accessControl?: VideoAccessControl;
  readonly enrollButton?: EnrollButton;
}

/**
 * SEO metadata structure
 */
export interface SeoMetadata {
  readonly metaTitle?: string;
  readonly metaDescription?: string;
  readonly shareImage?: SanityImageSource;
}

/**
 * Complete page content structure from Sanity
 */
export interface PageContent {
  readonly _id: string;
  readonly title: string;
  readonly slug: {
    readonly current: string;
  };
  readonly pageType: string;
  readonly seo?: SeoMetadata;
  readonly sections: readonly SectionData[];
  readonly isPublished: boolean;
  readonly publishedAt: string;
}

/**
 * Error boundary error info
 */
export interface ErrorInfo {
  readonly componentStack: string;
}

/**
 * Video player error types
 */
export type VideoError = "loading" | "network" | "decode" | "src_not_supported";

/**
 * Video player state
 */
export interface VideoPlayerState {
  readonly isPlaying: boolean;
  readonly isLoading: boolean;
  readonly error: VideoError | null;
  readonly currentTime: number;
  readonly duration: number;
}

/**
 * Hero image grid layout options
 */
export type HeroImageGridLayout = "row" | "grid-2x2" | "masonry";

/**
 * Hero image grid props interface
 */
export interface HeroImageGridProps {
  readonly images: readonly HeroBackgroundImage[];
  readonly layout?: HeroImageGridLayout;
  readonly className?: string;
}

/**
 * Page wrapper props interface
 */
export interface SanityPageWrapperProps {
  readonly pageIdentifier: string;
  readonly fallbackContent?: React.ReactNode;
}

/**
 * Section renderer props interface
 */
export interface SectionRendererProps {
  readonly section: SectionData;
}

/**
 * Responsive breakpoint configuration
 */
export interface ResponsiveBreakpoints {
  readonly mobile: number;
  readonly tablet: number;
  readonly desktop: number;
  readonly large: number;
  readonly xlarge?: number;
  readonly wide?: number;
}

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  readonly children: React.ReactNode;
  readonly fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  readonly onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
