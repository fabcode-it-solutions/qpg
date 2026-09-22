import { ReactNode, createElement } from "react";
import {
  ZapIcon,
  BookOpenIcon,
  UsersIcon,
  ActivityIcon,
  TrendingUpIcon,
  UserIcon,
  AlertIcon,
  CheckIcon,
  XIcon,
  VideoIcon,
  MailIcon,
  PhoneIcon,
  LocationIcon,
  HelpIcon,
  HomeIcon,
} from "@/components/icons";
import { SanitySiteContent, SanitySiteContentSection } from "./types";
import { Feature, TeamMember, ContactMethod } from "@/types";
import { ClockIcon } from "@/components/icons/CourseIcon";

// Icon component mapping
const iconComponentMap: Record<string, any> = {
  zap: ZapIcon,
  "book-open": BookOpenIcon,
  users: UsersIcon,
  activity: ActivityIcon,
  "trending-up": TrendingUpIcon,
  clock: ClockIcon,
  user: UserIcon,
  alert: AlertIcon,
  check: CheckIcon,
  x: XIcon,
  video: VideoIcon,
  mail: MailIcon,
  phone: PhoneIcon,
  location: LocationIcon,
  help: HelpIcon,
  home: HomeIcon,
};

// Get icon by name with fallback
export function getIcon(iconName: string): ReactNode {
  const IconComponent = iconComponentMap[iconName] || ZapIcon;
  return createElement(IconComponent, {
    className: "w-8 h-8 text-(--color-gold)",
  });
}

// Transform Sanity features to our Feature type
export function transformFeatures(
  sanityFeatures?: SanitySiteContentSection["features"]
): Feature[] {
  if (!sanityFeatures) return [];

  return sanityFeatures.map((feature) => ({
    icon: getIcon(feature.icon),
    title: feature.title,
    description: feature.description,
    highlight: feature.highlight,
  }));
}

// Transform Sanity team members to our TeamMember type
export function transformTeamMembers(
  sanityTeamMembers?: SanitySiteContentSection["teamMembers"]
): TeamMember[] {
  if (!sanityTeamMembers) return [];

  return sanityTeamMembers.map((member) => ({
    name: member.name,
    role: member.role,
    bio: member.bio,
    image: member.avatarUrl || "/api/placeholder/150/150",
  }));
}

// Transform Sanity contact methods to our ContactMethod type
export function transformContactMethods(
  sanityContactMethods?: SanitySiteContentSection["contactMethods"]
): ContactMethod[] {
  if (!sanityContactMethods) return [];

  return sanityContactMethods.map((method) => ({
    icon: getIcon(method.icon),
    title: method.title,
    description: method.description,
    value: method.value,
    href: method.href,
    action: method.action,
  }));
}

// Transform support info to ContactMethod type
export function transformSupportInfo(
  supportInfo?: Array<{
    title: string;
    description: string;
    icon: string;
    value: string;
    href?: string;
    action?: string;
  }>
): ContactMethod[] {
  if (!supportInfo) return [];

  return supportInfo.map((info: any) => ({
    icon: getIcon(info.icon),
    title: info.title,
    description: info.description,
    value: info.value,
    href: info.href,
    action: info.action,
  }));
}

// Transform CTA buttons
export function transformCtaButtons(
  ctaButtons?: Array<{
    text: string;
    href: string;
    style?: "primary" | "secondary" | "outline";
    showButton: boolean;
    icon?: string;
  }>
) {
  if (!ctaButtons) return [];

  return ctaButtons
    .filter((btn) => btn.showButton)
    .map((btn) => ({
      text: btn.text,
      href: btn.href,
      style: btn.style || "primary",
      icon: btn.icon ? getIcon(btn.icon) : undefined,
    }));
}

// Get content with fallback
export function getContentWithFallback(
  sanityContent?: any[],
  fallback: string = ""
): string {
  return richTextToPlainText(sanityContent) || fallback;
}

// Transform business hours
export function transformBusinessHours(businessHours?: {
  title?: string;
  subtitle?: string;
  regularHours?: Array<{
    day: string;
    hours: string;
    isOpen: boolean;
  }>;
  emergencySupport?: Array<{
    title: string;
    availability: string;
    icon?: string;
  }>;
}) {
  if (!businessHours) return null;

  return {
    title: businessHours.title || "Business Hours",
    subtitle: businessHours.subtitle,
    regularHours: businessHours.regularHours || [],
    emergencySupport:
      businessHours.emergencySupport?.map((support) => ({
        ...support,
        icon: support.icon ? getIcon(support.icon) : getIcon("check"),
      })) || [],
  };
}

// Transform mission content
export function transformMissionContent(missionContent?: {
  whyWeExistTitle?: string;
  whyWeExistContent?: any[];
  impactTitle?: string;
  impactStats?: Array<{
    value: string;
    label: string;
  }>;
}) {
  if (!missionContent) return null;

  return {
    whyWeExistTitle: missionContent.whyWeExistTitle || "Why We Exist",
    whyWeExistContent:
      richTextToPlainText(missionContent.whyWeExistContent) || "",
    impactTitle: missionContent.impactTitle || "Our Impact",
    impactStats: missionContent.impactStats || [],
  };
}

// Get section labels with fallbacks
export function getSectionLabels(section?: SanitySiteContentSection) {
  const labels = section?.labels || {};

  return {
    sendMessageTitle: labels.sendMessageTitle || "Send Us a Message",
    supportInfoTitle: labels.supportInfoTitle || "Support Information",
    businessHoursTitle: labels.businessHoursTitle || "Support Team",
    emergencySupportTitle: labels.emergencySupportTitle || "Emergency Support",
    faqTitle: labels.faqTitle || "Frequently Asked Questions",
    ctaTitle: labels.ctaTitle || "Ready to Start Growing?",
    ctaDescription:
      labels.ctaDescription ||
      "Join thousands of successful growers who've transformed their cultivation skills with our expert guidance.",
  };
}

// Get section by type from Sanity content
export function getSectionByType(
  content: SanitySiteContent | null,
  sectionType: string
): SanitySiteContentSection | undefined {
  if (!content?.sections) return undefined;
  return content.sections.find((section) => section._type === sectionType);
}

// Get About page specific sections
export function getAboutHeroSection(
  content: SanitySiteContent | null
): SanitySiteContentSection | undefined {
  return getSectionByType(content, "aboutHeroSection");
}

export function getAboutFeaturesSection(
  content: SanitySiteContent | null
): SanitySiteContentSection | undefined {
  return getSectionByType(content, "aboutFeaturesSection");
}

export function getAboutTeamSection(
  content: SanitySiteContent | null
): SanitySiteContentSection | undefined {
  return getSectionByType(content, "aboutTeamSection");
}

export function getAboutMissionSection(
  content: SanitySiteContent | null
): SanitySiteContentSection | undefined {
  return getSectionByType(content, "aboutMissionSection");
}

export function getAboutCtaSection(
  content: SanitySiteContent | null
): SanitySiteContentSection | undefined {
  return getSectionByType(content, "aboutCtaSection");
}

// Get Contact page specific sections
export function getContactHeroSection(
  content: SanitySiteContent | null
): SanitySiteContentSection | undefined {
  return getSectionByType(content, "contactHeroSection");
}

export function getContactMethodsSection(
  content: SanitySiteContent | null
): SanitySiteContentSection | undefined {
  return getSectionByType(content, "contactMethodsSection");
}

export function getContactFormSection(
  content: SanitySiteContent | null
): SanitySiteContentSection | undefined {
  return getSectionByType(content, "contactFormSection");
}

export function getContactSupportSection(
  content: SanitySiteContent | null
): SanitySiteContentSection | undefined {
  return getSectionByType(content, "contactSupportSection");
}

export function getContactBusinessHoursSection(
  content: SanitySiteContent | null
): SanitySiteContentSection | undefined {
  return getSectionByType(content, "contactBusinessHoursSection");
}

export function getContactFaqSection(
  content: SanitySiteContent | null
): SanitySiteContentSection | undefined {
  return getSectionByType(content, "contactFaqSection");
}

// Get all sections by type from Sanity content
export function getSectionsByType(
  content: SanitySiteContent | null,
  sectionType: string
): SanitySiteContentSection[] {
  if (!content?.sections) return [];
  return content.sections.filter((section) => section._type === sectionType);
}

// Convert rich text to plain text (simple implementation)
export function richTextToPlainText(richText?: any[]): string {
  if (!richText || !Array.isArray(richText)) return "";

  return richText
    .map((block) => {
      if (block._type === "block" && block.children) {
        return block.children.map((child: any) => child.text || "").join("");
      }
      return "";
    })
    .join(" ")
    .trim();
}

// Transform statistics
export function transformStatistics(
  statistics?: SanitySiteContentSection["statistics"]
) {
  if (!statistics) return [];

  return statistics.map((stat) => ({
    value: `${stat.prefix || ""}${stat.value}${stat.suffix || ""}`,
    label: stat.label,
  }));
}
