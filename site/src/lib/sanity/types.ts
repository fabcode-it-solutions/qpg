// Sanity-specific types that extend the existing types

export interface SanityDocument {
  _id: string
  _createdAt: string
  _updatedAt: string
  _type: string
}

export interface SanitySlug {
  _type: 'slug'
  current: string
}

export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
  alt?: string
}

export interface SanityReference {
  _type: 'reference'
  _ref: string
}

// Sanity Category
export interface SanityCategory extends SanityDocument {
  name: string
  slug: SanitySlug
  description?: string
  icon?: SanityImage
  iconUrl?: string
  color?: string
  order: number
  isActive: boolean
}

// Sanity Course
export interface SanityCourse extends SanityDocument {
  title: string
  slug: SanitySlug
  description?: any[] // Rich text blocks
  shortDescription?: string
  thumbnail: SanityImage
  thumbnailUrl?: string
  heroImage?: SanityImage
  heroImageUrl?: string
  gallery?: SanityImage[]
  galleryImages?: string[]
  price: number
  originalPrice?: number
  currency: string
  stripePriceId: string
  category: SanityReference | SanityCategory
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimatedDuration?: number
  instructor?: SanityReference | SanityInstructor
  isPublished: boolean
  isFeatured: boolean
  publishedAt?: string
  order: number
  learningOutcomes?: string[]
  prerequisites?: string[]
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  progressiveUnlock?: {
    enabled: boolean
    showLockedVideos: boolean
    allowPreview: boolean
  }
}

// Sanity Video
export interface SanityVideo extends SanityDocument {
  title: string
  slug: SanitySlug
  description?: any[] // Rich text blocks
  course: SanityReference | SanityCourse
  unlockSettings?: {
    unlockType: 'immediate' | 'after_days' | 'after_completion'
    unlockAfterDays?: number
    requirePreviousVideo?: boolean
  }
  transcript?: string
  keyPoints?: string[]
  resources?: Array<{
    title: string
    url: string
    type: 'pdf' | 'link' | 'download' | 'tool'
  }>
  bunnyVideoId: string
  bunnyLibraryId: string
  bunnyCollectionId?: string
  bunnyStreamUrl?: string
  bunnyThumbnailUrl?: string
  bunnyVideoStatus: 'processing' | 'ready' | 'error' | 'uploaded'
  bunnyEncodingProgress: number
  order: number
  isPublished: boolean
  isFree: boolean
  isDownloadable: boolean
  publishedAt?: string
  duration?: number
  width?: number
  height?: number
  fileSize?: number
  bitrate?: number
  framerate?: number
  codec?: string
  quality?: '480p' | '720p' | '1080p' | '1440p' | '2160p'
  customThumbnail?: SanityImage
  customThumbnailUrl?: string
  tags?: string[]
}


// Sanity Instructor
export interface SanityInstructor extends SanityDocument {
  name: string
  slug: SanitySlug
  avatar?: SanityImage
  avatarUrl?: string
  professionalTitle?: string
  bio?: any[] // Rich text blocks
  experience?: number
  specialties?: string[]
  certifications?: string[]
  socialLinks?: {
    website?: string
    linkedin?: string
    twitter?: string
    instagram?: string
    youtube?: string
  }
  isActive: boolean
}

// Sanity Blog Post
export interface SanityBlogPost extends SanityDocument {
  title: string
  slug: SanitySlug
  excerpt?: string
  content: any[] // Rich text blocks
  featuredImage?: SanityImage
  featuredImageUrl?: string
  author?: SanityReference | SanityInstructor
  categories?: (SanityReference | SanityCategory)[]
  tags?: string[]
  isPublished: boolean
  publishedAt?: string
  isFeatured: boolean
  readingTime?: number
  seoTitle?: string
  seoDescription?: string
}

// Sanity Site Settings
export interface SanitySiteSettings extends SanityDocument {
  title: string
  description: string
  logo?: SanityImage
  logoUrl?: string
  favicon?: SanityImage
  faviconUrl?: string
  primaryColor?: string
  secondaryColor?: string
  socialLinks?: {
    facebook?: string
    twitter?: string
    instagram?: string
    youtube?: string
    linkedin?: string
    tiktok?: string
  }
  seoTitle?: string
  seoDescription?: string
  seoImage?: SanityImage
  seoImageUrl?: string
  keywords?: string[]
  contactEmail?: string
  supportEmail?: string
  companyName?: string
  companyAddress?: string
  privacyPolicy?: any[] // Rich text blocks
  termsOfService?: any[] // Rich text blocks
}

// Sanity Site Content
export interface SanitySiteContent extends SanityDocument {
  title: string
  slug: SanitySlug
  pageType: 'home' | 'about' | 'contact' | 'blog' | 'videos'
  seo?: {
    metaTitle?: string
    metaDescription?: string
    shareImage?: SanityImage
  }
  sections?: SanitySiteContentSection[]
  isPublished: boolean
  publishedAt?: string
}

export interface SanitySiteContentSection {
  _type: 'heroSection' | 'featuresSection' | 'contactSection' | 'teamSection' | 'missionSection' | 'ctaSection' | 'contentSection' | 'businessHoursSection' | 'faqSection' | 'aboutHeroSection' | 'aboutFeaturesSection' | 'aboutTeamSection' | 'aboutMissionSection' | 'aboutCtaSection' | 'contactHeroSection' | 'contactMethodsSection' | 'contactFormSection' | 'contactSupportSection' | 'contactBusinessHoursSection' | 'contactFaqSection'
  _key: string
  title?: string
  heading?: string
  subheading?: string
  description?: any[] // Rich text blocks
  content?: any[] // Rich text blocks
  backgroundColor?: string
  
  // Hero Section
  backgroundImages?: Array<{
    image: SanityImage
    alt?: string
    position?: string
    opacity?: number
    order?: number
  }>
  
  // CTA Buttons (can have multiple)
  ctaButtons?: Array<{
    text: string
    href: string
    style?: 'primary' | 'secondary' | 'outline'
    showButton: boolean
    icon?: string
  }>
  
  // Single CTA Button (for backwards compatibility)
  ctaButton?: {
    text: string
    href: string
    style?: 'primary' | 'secondary' | 'outline'
    showButton: boolean
    pricing?: {
      showPricing: boolean
      title?: string
      standardPrice?: {
        label: string
        amount: string
      }
      offerPrice?: {
        label: string
        amount: string
      }
    }
  }
  
  // Images
  images?: Array<{
    asset: SanityImage
    alt?: string
    caption?: string
    position?: string
  }>
  
  // Features
  features?: Array<{
    title: string
    description: string
    icon: string // Icon name to match our icon components
    value?: string
    order?: number
    highlight?: boolean
  }>
  
  // Team Members
  teamMembers?: Array<{
    name: string
    role: string
    bio: string
    avatar?: SanityImage
    avatarUrl?: string
    socialLinks?: {
      linkedin?: string
      twitter?: string
      website?: string
    }
  }>
  
  // Contact Info
  contactInfo?: {
    email?: string
    phone?: string
    address?: string
    businessHours?: Array<{
      day: string
      hours: string
      isOpen: boolean
    }>
    supportInfo?: Array<{
      title: string
      description: string
      icon: string
      value: string
      href?: string
      action?: string
      hours?: string
      response?: string
    }>
  }
  
  // Contact Methods
  contactMethods?: Array<{
    title: string
    description: string
    icon: string
    value: string
    href?: string
    action?: string
  }>
  
  // Statistics/Impact Numbers
  statistics?: Array<{
    value: string
    label: string
    suffix?: string
    prefix?: string
  }>
  
  // Form Configuration
  formConfig?: {
    showForm: boolean
    formTitle?: string
    formDescription?: string
    submitButtonText?: string
    namePlaceholder?: string
    emailPlaceholder?: string
    subjectPlaceholder?: string
    messagePlaceholder?: string
    successMessage?: string
    errorMessage?: string
  }
  
  // Business Hours
  businessHours?: {
    title?: string
    subtitle?: string
    regularHours?: Array<{
      day: string
      hours: string
      isOpen: boolean
    }>
    emergencySupport?: Array<{
      title: string
      availability: string
      icon?: string
    }>
  }
  
  // Mission/About Content
  missionContent?: {
    whyWeExistTitle?: string
    whyWeExistContent?: any[]
    impactTitle?: string
    impactStats?: Array<{
      value: string
      label: string
    }>
  }
  
  // FAQ Link
  faqLink?: {
    title?: string
    description?: string
    buttonText?: string
    href?: string
  }
  
  // Section Labels and UI Text
  labels?: {
    sendMessageTitle?: string
    supportInfoTitle?: string
    businessHoursTitle?: string
    emergencySupportTitle?: string
    faqTitle?: string
    ctaTitle?: string
    ctaDescription?: string
  }
  
  // Layout options
  layout?: 'default' | 'centered' | 'wide' | 'narrow'
  showContactForm?: boolean
  
  // Media for sections
  media?: {
    mediaType: 'image' | 'video' | 'gallery'
    image?: SanityImage
    video?: {
      asset: {
        _id: string
        url: string
      }
    }
    videoUrl?: string
    images?: Array<{
      image: SanityImage
      alt?: string
      caption?: string
    }>
    alt?: string
    caption?: string
    position?: string
  }
}

// Transformed types for the frontend (matching existing types)
export interface TransformedCourse {
  id: string
  title: string
  slug: string
  description?: string
  shortDescription?: string
  thumbnailUrl?: string
  heroImageUrl?: string
  galleryImages?: string[]
  price: string // Convert to string to match existing type
  originalPrice?: string
  stripePriceId: string
  category?: string
  categorySlug?: string
  categoryColor?: string
  difficulty?: string
  duration?: number // in minutes
  estimatedDuration?: number
  instructor?: {
    name: string
    avatarUrl?: string
    title?: string
  }
  isPublished: boolean
  isFeatured: boolean
  publishedAt?: string
  order: number
  learningOutcomes?: string[]
  prerequisites?: string[]
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
  videos?: TransformedVideo[]
  progressiveUnlock?: {
    enabled: boolean
    showLockedVideos: boolean
    allowPreview: boolean
  }
}

export interface TransformedVideo {
  id: string
  title: string
  slug: string
  description?: string
  courseId: string
  unlockSettings?: {
    unlockType: 'immediate' | 'after_days' | 'after_completion'
    unlockAfterDays?: number
    requirePreviousVideo?: boolean
  }
  transcript?: string
  keyPoints?: string[]
  resources?: Array<{
    title: string
    url: string
    type: string
  }>
  bunnyVideoId: string
  bunnyLibraryId: string
  bunnyCollectionId?: string
  bunnyStreamUrl?: string
  bunnyThumbnailUrl?: string
  bunnyVideoStatus: string
  bunnyEncodingProgress: number
  order: number
  isPublished: boolean
  isFree: boolean
  isDownloadable: boolean
  publishedAt?: string
  duration?: number // in seconds
  width?: number
  height?: number
  fileSize?: number
  bitrate?: number
  framerate?: number
  codec?: string
  quality?: string
  customThumbnailUrl?: string
  tags?: string[]
}


export interface TransformedCategory {
  id: string
  name: string
  slug: string
  description?: string
  iconUrl?: string
  color?: string
  order: number
  isActive: boolean
}