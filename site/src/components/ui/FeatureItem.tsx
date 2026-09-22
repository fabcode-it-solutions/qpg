import React from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/sanity/client";
import { Feature } from "@/types/sanity";
import { cn } from "@/lib/utils/utils";

interface FeatureItemProps {
  /**
   * Feature data
   */
  readonly feature: Feature;

  /**
   * Layout variant
   */
  readonly variant?: "default" | "compact" | "minimal";

  /**
   * Icon size
   */
  readonly iconSize?: "sm" | "md" | "lg";

  /**
   * Show bullet point when no icon
   */
  readonly showBullet?: boolean;

  /**
   * Custom bullet color
   */
  readonly bulletColor?: "gold" | "primary" | "gray";

  /**
   * Additional CSS classes
   */
  readonly className?: string;

  /**
   * Title CSS classes
   */
  readonly titleClassName?: string;

  /**
   * Description CSS classes
   */
  readonly descriptionClassName?: string;
}

/**
 * Icon size configurations
 */
const iconSizes = {
  sm: {
    container: "w-5 h-5 lg:w-6 lg:h-6",
    image: { width: 24, height: 24 },
    bullet: "w-2 h-2",
  },
  md: {
    container: "w-6 h-6 lg:w-8 lg:h-8",
    image: { width: 32, height: 32 },
    bullet: "w-3 h-3",
  },
  lg: {
    container: "w-8 h-8 lg:w-10 lg:h-10",
    image: { width: 40, height: 40 },
    bullet: "w-4 h-4",
  },
} as const;

/**
 * Bullet color configurations
 */
const bulletColors = {
  gold: "bg-gradient-to-r from-yellow-400 to-yellow-600",
  primary: "bg-gradient-to-r from-green-400 to-green-600",
  gray: "bg-gradient-to-r from-gray-400 to-gray-600",
} as const;

/**
 * Variant configurations
 */
const variants = {
  default: {
    container: "flex items-start gap-4 lg:gap-6",
    content: "flex-1",
    title:
      "text-md 2xl:text-[24px] font-bold leading-[24px] 2xl:leading-[40px]",
    description: "leading-[150%] text-[14px] 2xl:text-[18px] font-normal",
    iconContainer: "flex-shrink-0 mt-1 lg:mt-2",
  },
  compact: {
    container: "flex items-start gap-3",
    content: "flex-1",
    title: "text-base lg:text-lg font-semibold mb-1 lg:mb-2",
    description: "leading-relaxed text-sm lg:text-base",
    iconContainer: "flex-shrink-0 mt-1",
  },
  minimal: {
    container: "flex items-center gap-2",
    content: "flex-1",
    title: "text-sm lg:text-base font-medium",
    description: "text-xs lg:text-sm text-gray-500",
    iconContainer: "flex-shrink-0",
  },
} as const;

export const FeatureItem: React.FC<FeatureItemProps> = ({
  feature,
  variant = "default",
  iconSize = "md",
  showBullet = true,
  bulletColor = "gold",
  className,
  titleClassName,
  descriptionClassName,
}) => {
  const variantStyles = variants[variant];
  const iconConfig = iconSizes[iconSize];
  const bulletColorClass = bulletColors[bulletColor];

  /**
   * Renders the feature icon or bullet point
   */
  const renderIcon = (): React.ReactNode => {
    if (feature.icon) {
      const iconUrl = getImageUrl(
        feature.icon,
        iconConfig.image.width,
        iconConfig.image.height
      );

      if (!iconUrl) {
        return showBullet ? (
          <div
            className={cn(
              iconConfig.bullet,
              bulletColorClass,
              "rounded-full shadow-lg"
            )}
            role="presentation"
            aria-hidden="true"
          />
        ) : null;
      }

      return (
        <div className={cn(iconConfig.container, "relative")}>
          <Image
            src={iconUrl}
            alt=""
            width={iconConfig.image.width}
            height={iconConfig.image.height}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      );
    }

    return showBullet ? (
      <div
        className={cn(
          iconConfig.bullet,
          bulletColorClass,
          "rounded-full shadow-lg"
        )}
        role="presentation"
        aria-hidden="true"
      />
    ) : null;
  };

  return (
    <article
      className={cn(variantStyles.container, className)}
      aria-labelledby={`feature-${feature.order}-title`}
    >
      {/* Icon or Bullet */}
      <div className={variantStyles.iconContainer}>{renderIcon()}</div>

      {/* Content */}
      <div className={variantStyles.content}>
        <h3
          id={`feature-${feature.order}-title`}
          className={cn(variantStyles.title, titleClassName)}
        >
          {feature.title}
          {feature.value && (
            <span className="ml-2 text-primary font-bold">{feature.value}</span>
          )}
        </h3>

        {feature.description && (
          <p className={cn(variantStyles.description, descriptionClassName)}>
            {feature.description}
          </p>
        )}
      </div>
    </article>
  );
};

/**
 * Feature list component for rendering multiple features
 */
interface FeatureListProps {
  readonly features: readonly Feature[];
  readonly variant?: FeatureItemProps["variant"];
  readonly iconSize?: FeatureItemProps["iconSize"];
  readonly showBullet?: boolean;
  readonly bulletColor?: FeatureItemProps["bulletColor"];
  readonly className?: string;
  readonly itemClassName?: string;
  readonly titleClassName?: string;
  readonly descriptionClassName?: string;
  readonly spacing?: "tight" | "normal" | "loose";
}

const spacingClasses = {
  tight: "space-y-4",
  normal: "space-y-6 lg:space-y-8",
  loose: "space-y-8 lg:space-y-12",
} as const;

export const FeatureList: React.FC<FeatureListProps> = ({
  features,
  variant = "default",
  iconSize = "md",
  showBullet = true,
  bulletColor = "gold",
  className,
  itemClassName,
  titleClassName,
  descriptionClassName,
  spacing = "normal",
}) => {
  // Sort features by order
  const sortedFeatures = [...features].sort((a, b) => a.order - b.order);

  return (
    <div
      className={cn(spacingClasses[spacing], className)}
      role="list"
      aria-label="Features"
    >
      {sortedFeatures.map((feature, index) => (
        <div key={`${feature.order}-${index}`} role="listitem">
          <FeatureItem
            feature={feature}
            variant={variant}
            iconSize={iconSize}
            showBullet={showBullet}
            bulletColor={bulletColor}
            className={itemClassName}
            titleClassName={titleClassName}
            descriptionClassName={descriptionClassName}
          />
        </div>
      ))}
    </div>
  );
};
