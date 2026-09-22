import { ReactNode, createElement } from 'react';
import {
  ZapIcon,
  BookOpenIcon,
  UsersIcon,
  ActivityIcon,
  TrendingUpIcon,
  ClockLucideIcon,
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
} from '@/components/icons';
import { SanitySiteContent } from './types';
import { Feature, TeamMember, ContactMethod } from '@/types';

// Icon component mapping
const iconComponentMap: Record<string, any> = {
  zap: ZapIcon,
  'book-open': BookOpenIcon,
  users: UsersIcon,
  activity: ActivityIcon,
  'trending-up': TrendingUpIcon,
  clock: ClockLucideIcon,
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
  return createElement(IconComponent, { className: 'w-8 h-8 text-(--color-gold)' });
}

// Convert rich text to plain text (simple implementation)
export function richTextToPlainText(richText?: any[]): string {
  if (!richText || !Array.isArray(richText)) return '';
  
  return richText
    .map(block => {
      if (block._type === 'block' && block.children) {
        return block.children.map((child: any) => child.text || '').join('');
      }
      return '';
    })
    .join(' ')
    .trim();
}

// Get content with fallback
export function getContentWithFallback(sanityContent?: any[], fallback: string = ''): string {
  return richTextToPlainText(sanityContent) || fallback;
}

// Get section by type from Sanity content
export function getSectionByType(content: SanitySiteContent | null, sectionType: string): any {
  if (!content?.sections) return null;
  return content.sections.find(section => section._type === sectionType) || null;
}

// ABOUT PAGE TRANSFORMERS

// Get About section data
export function getAboutSection(content: SanitySiteContent | null) {
  return getSectionByType(content, 'aboutSection');
}

// Transform About page hero content
export function transformAboutHero(aboutSection: any) {
  if (!aboutSection?.heroContent) return null;
  
  const heroContent = aboutSection.heroContent;
  return {
    title: heroContent.title || '',
    subtitle: heroContent.subtitle || '',
    description: getContentWithFallback(heroContent.description, ''),
    ctaButtons: heroContent.ctaButtons?.filter((btn: any) => btn.showButton).map((btn: any) => ({
      text: btn.text,
      href: btn.href,
      style: btn.style || 'primary',
    })) || [],
  };
}

// Transform About page features
export function transformAboutFeatures(aboutSection: any): Feature[] {
  if (!aboutSection?.featuresContent?.features) return [];
  
  return aboutSection.featuresContent.features.map((feature: any) => ({
    icon: getIcon(feature.icon),
    title: feature.title,
    description: feature.description,
    highlight: feature.highlight,
  }));
}

// Transform About page team members
export function transformAboutTeamMembers(aboutSection: any): TeamMember[] {
  if (!aboutSection?.teamContent?.teamMembers) return [];
  
  return aboutSection.teamContent.teamMembers.map((member: any) => ({
    name: member.name,
    role: member.role,
    bio: member.bio,
    image: member.avatarUrl || '/api/placeholder/150/150',
  }));
}

// Transform About page mission content
export function transformAboutMission(aboutSection: any) {
  if (!aboutSection?.missionContent) return null;
  
  const missionContent = aboutSection.missionContent;
  return {
    title: missionContent.title || '',
    subtitle: missionContent.subtitle || '',
    whyWeExistTitle: missionContent.whyWeExistTitle || '',
    whyWeExistContent: getContentWithFallback(missionContent.whyWeExistContent, ''),
    impactTitle: missionContent.impactTitle || '',
    statistics: missionContent.statistics?.map((stat: any) => ({
      value: stat.value,
      label: stat.label,
    })) || [],
  };
}

// Transform About page CTA content
export function transformAboutCta(aboutSection: any) {
  if (!aboutSection?.ctaContent) return null;
  
  const ctaContent = aboutSection.ctaContent;
  return {
    title: ctaContent.title || '',
    subtitle: ctaContent.subtitle || '',
    description: getContentWithFallback(ctaContent.description, ''),
    ctaButtons: ctaContent.ctaButtons?.filter((btn: any) => btn.showButton).map((btn: any) => ({
      text: btn.text,
      href: btn.href,
      style: btn.style || 'primary',
    })) || [],
  };
}

// CONTACT PAGE TRANSFORMERS

// Get Contact section data
export function getContactSection(content: SanitySiteContent | null) {
  return getSectionByType(content, 'contactSection');
}

// Transform Contact page hero content
export function transformContactHero(contactSection: any) {
  if (!contactSection?.heroContent) return null;
  
  const heroContent = contactSection.heroContent;
  return {
    title: heroContent.title || '',
    subtitle: heroContent.subtitle || '',
    description: getContentWithFallback(heroContent.description, ''),
  };
}

// Transform Contact page methods
export function transformContactMethods(contactSection: any): ContactMethod[] {
  if (!contactSection?.contactMethodsContent?.contactMethods) return [];
  
  return contactSection.contactMethodsContent.contactMethods.map((method: any) => ({
    icon: getIcon(method.icon),
    title: method.title,
    description: method.description,
    value: method.value,
    href: method.href,
    action: method.action,
  }));
}

// Transform Contact page form content
export function transformContactForm(contactSection: any) {
  if (!contactSection?.contactFormContent) return null;
  
  const formContent = contactSection.contactFormContent;
  return {
    title: formContent.formTitle || '',
    description: getContentWithFallback(formContent.formDescription, ''),
    showForm: formContent.showContactForm !== false,
    config: formContent.formConfig || {},
  };
}

// Transform Contact page support content
export function transformContactSupport(contactSection: any) {
  if (!contactSection?.supportContent) return null;
  
  const supportContent = contactSection.supportContent;
  return {
    title: supportContent.title || '',
    description: getContentWithFallback(supportContent.description, ''),
    supportOptions: supportContent.supportOptions?.map((option: any) => ({
      title: option.title,
      description: option.description,
      hours: option.hours || 'Mon-Fri 9AM-6PM PST',
      response: option.response || '< 4 hours',
    })) || [],
  };
}

// Transform Contact page business hours
export function transformContactBusinessHours(contactSection: any) {
  if (!contactSection?.businessHoursContent) return null;
  
  const hoursContent = contactSection.businessHoursContent;
  return {
    title: hoursContent.title || 'Business Hours',
    supportTeamTitle: hoursContent.supportTeamTitle || 'Support Team',
    emergencySupportTitle: hoursContent.emergencySupportTitle || 'Emergency Support',
    regularHours: hoursContent.regularHours || [],
    emergencySupport: hoursContent.emergencySupport?.map((support: any) => ({
      title: support.title,
      availability: support.availability,
      icon: support.icon ? getIcon(support.icon) : getIcon('check'),
    })) || [],
  };
}

// Transform Contact page FAQ content
export function transformContactFaq(contactSection: any) {
  if (!contactSection?.faqContent) return null;
  
  const faqContent = contactSection.faqContent;
  return {
    title: faqContent.title || '',
    description: faqContent.description || '',
    buttonText: faqContent.buttonText || '',
    href: faqContent.href || '',
  };
}

// HELPER FUNCTIONS FOR SECTION TITLES

// Get section titles for About page
export function getAboutSectionTitles(aboutSection: any) {
  return {
    featuresTitle: aboutSection?.featuresContent?.title || 'What Makes Us Different',
    featuresSubtitle: aboutSection?.featuresContent?.subtitle || 'Advanced features designed to accelerate your plant growing success',
    missionTitle: aboutSection?.missionContent?.title || 'Our Mission',
    missionSubtitle: aboutSection?.missionContent?.subtitle || 'Empowering growers with knowledge, technology, and community support',
    teamTitle: aboutSection?.teamContent?.title || 'Meet Our Experts',
    teamSubtitle: aboutSection?.teamContent?.subtitle || 'Learn from passionate professionals dedicated to your growing success',
  };
}

// Get section titles for Contact page
export function getContactSectionTitles(contactSection: any) {
  return {
    methodsTitle: contactSection?.contactMethodsContent?.title || 'Contact Methods',
    methodsSubtitle: contactSection?.contactMethodsContent?.subtitle || 'Choose the way that works best for you',
  };
}