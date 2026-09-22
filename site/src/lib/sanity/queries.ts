// GROQ queries for Sanity content

// Base fields that are commonly used
const baseFields = `
  _id,
  _createdAt,
  _updatedAt,
  title,
  slug
`;

// Category queries
export const categoriesQuery = `
  *[_type == "category" && isActive == true] | order(order asc, name asc) {
    ${baseFields},
    name,
    description,
    "iconUrl": icon.asset->url,
    color,
    order,
    isActive
  }
`;

export const categoryBySlugQuery = `
  *[_type == "category" && slug.current == $slug][0] {
    ${baseFields},
    name,
    description,
    "iconUrl": icon.asset->url,
    color,
    order,
    isActive
  }
`;

// Lightweight course listing query (for course cards/lists)
export const coursesListQuery = `
  *[_type == "course" && isPublished == true] | order(order asc, _createdAt desc) {
    ${baseFields},
    shortDescription,
    price,
    stripePriceId,
    difficulty,
    estimatedDuration,
    isFeatured,
    "thumbnailUrl": thumbnail.asset->url,
    category->{
      _id,
      name,
      color
    },
    instructor->{
      _id,
      name
    }
  }
`;

// Full course query (only use when detailed data is needed)
export const coursesQuery = `
  *[_type == "course" && isPublished == true] | order(order asc, _createdAt desc) {
    ${baseFields},
    shortDescription,
    price,
    currency,
    stripePriceId,
    difficulty,
    estimatedDuration,
    isPublished,
    isFeatured,
    publishedAt,
    order,
    "thumbnailUrl": thumbnail.asset->url,
    "heroImageUrl": heroImage.asset->url,
    category->{
      ${baseFields},
      name,
      color
    },
    instructor->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url,
      "professionalTitle": title
    },
    learningOutcomes[0..2], // Limit to first 3 items to save bandwidth
    tags[0..4], // Limit to first 5 tags
    seoTitle,
    seoDescription
  }
`;

// Paginated courses query
export const coursesPaginatedQuery = `
  *[_type == "course" && isPublished == true] | order(order asc, _createdAt desc) [$start...$end] {
    ${baseFields},
    shortDescription,
    price,
    currency,
    stripePriceId,
    difficulty,
    estimatedDuration,
    isPublished,
    isFeatured,
    publishedAt,
    order,
    "thumbnailUrl": thumbnail.asset->url,
    "heroImageUrl": heroImage.asset->url,
    category->{
      ${baseFields},
      name,
      color
    },
    instructor->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url,
      "professionalTitle": title
    },
    learningOutcomes,
    tags,
    seoTitle,
    seoDescription
  }
`;

// Count query for pagination
export const coursesCountQuery = `
  count(*[_type == "course" && isPublished == true])
`;

export const coursesByCategoryQuery = `
  *[_type == "course" && isPublished == true && category._ref == $categoryId] | order(order asc, _createdAt desc) {
    ${baseFields},
    shortDescription,
    price,
    currency,
    stripePriceId,
    difficulty,
    estimatedDuration,
    isPublished,
    isFeatured,
    publishedAt,
    order,
    "thumbnailUrl": thumbnail.asset->url,
    "heroImageUrl": heroImage.asset->url,
    category->{
      ${baseFields},
      name,
      color
    },
    instructor->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url,
      "professionalTitle": title
    },
    learningOutcomes,
    tags,
    seoTitle,
    seoDescription
  }
`;

// Paginated courses by category query
export const coursesByCategoryPaginatedQuery = `
  *[_type == "course" && isPublished == true && category._ref == $categoryId] | order(order asc, _createdAt desc) [$start...$end] {
    ${baseFields},
    shortDescription,
    price,
    currency,
    stripePriceId,
    difficulty,
    estimatedDuration,
    isPublished,
    isFeatured,
    publishedAt,
    order,
    "thumbnailUrl": thumbnail.asset->url,
    "heroImageUrl": heroImage.asset->url,
    category->{
      ${baseFields},
      name,
      color
    },
    instructor->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url,
      "professionalTitle": title
    },
    learningOutcomes,
    tags,
    seoTitle,
    seoDescription
  }
`;

// Count query for category pagination
export const coursesByCategoryCountQuery = `
  count(*[_type == "course" && isPublished == true && category._ref == $categoryId])
`;

export const courseBySlugQuery = `
  *[_type == "course" && slug.current == $slug][0] {
    ${baseFields},
    description,
    shortDescription,
    price,
    originalPrice,
    currency,
    stripePriceId,
    difficulty,
    estimatedDuration,
    isPublished,
    isFeatured,
    publishedAt,
    order,
    "thumbnailUrl": thumbnail.asset->url,
    "heroImageUrl": heroImage.asset->url,
    "galleryImages": gallery[].asset->url,
    category->{
      ${baseFields},
      name,
      description,
      color
    },
    instructor->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url,
      "professionalTitle": title,
      bio,
      experience,
      specialties,
      certifications
    },
    learningOutcomes,
    prerequisites,
    tags,
    seoTitle,
    seoDescription,
    seoKeywords,
    progressiveUnlock
  }
`;

export const courseByIdQuery = `
  *[_type == "course" && _id == $courseId][0] {
    ${baseFields},
    description,
    shortDescription,
    price,
    originalPrice,
    currency,
    stripePriceId,
    difficulty,
    estimatedDuration,
    isPublished,
    isFeatured,
    publishedAt,
    order,
    "thumbnailUrl": thumbnail.asset->url,
    "heroImageUrl": heroImage.asset->url,
    "galleryImages": gallery[].asset->url,
    category->{
      ${baseFields},
      name,
      description,
      color
    },
    instructor->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url,
      "professionalTitle": title,
      bio,
      experience,
      specialties,
      certifications
    },
    learningOutcomes,
    prerequisites,
    tags,
    seoTitle,
    seoDescription,
    seoKeywords,
    progressiveUnlock
  }
`;

// Video queries
export const videosByCourseQuery = `
  *[_type == "video" && course._ref == $courseId && isPublished == true] | order(order asc) {
    ${baseFields},
    description,
    course->{
      ${baseFields}
    },
    unlockSettings,
    transcript,
    keyPoints,
    resources,
    bunnyVideoId,
    bunnyLibraryId,
    bunnyCollectionId,
    bunnyStreamUrl,
    bunnyThumbnailUrl,
    bunnyVideoStatus,
    bunnyEncodingProgress,
    order,
    isPublished,
    isFree,
    isDownloadable,
    publishedAt,
    duration,
    width,
    height,
    fileSize,
    bitrate,
    framerate,
    codec,
    quality,
    "customThumbnailUrl": customThumbnail.asset->url,
    tags
  }
`;

export const videoBySlugQuery = `
  *[_type == "video" && slug.current == $slug][0] {
    ${baseFields},
    description,
    course->{
      ${baseFields},
      shortDescription,
      category->{
        ${baseFields},
        name
      }
    },
    unlockSettings,
    transcript,
    keyPoints,
    resources,
    bunnyVideoId,
    bunnyLibraryId,
    bunnyCollectionId,
    bunnyStreamUrl,
    bunnyThumbnailUrl,
    bunnyVideoStatus,
    bunnyEncodingProgress,
    order,
    isPublished,
    isFree,
    isDownloadable,
    publishedAt,
    duration,
    width,
    height,
    fileSize,
    bitrate,
    framerate,
    codec,
    quality,
    "customThumbnailUrl": customThumbnail.asset->url,
    tags
  }
`;

export const videoByIdQuery = `
  *[_type == "video" && _id == $videoId][0] {
    ${baseFields},
    description,
    course->{
      ${baseFields},
      shortDescription,
      category->{
        ${baseFields},
        name
      }
    },
    unlockSettings,
    transcript,
    keyPoints,
    resources,
    bunnyVideoId,
    bunnyLibraryId,
    bunnyCollectionId,
    bunnyStreamUrl,
    bunnyThumbnailUrl,
    bunnyVideoStatus,
    bunnyEncodingProgress,
    order,
    isPublished,
    isFree,
    isDownloadable,
    publishedAt,
    duration,
    width,
    height,
    fileSize,
    bitrate,
    framerate,
    codec,
    quality,
    "customThumbnailUrl": customThumbnail.asset->url,
    tags
  }
`;

// Blog search query
export const searchBlogPostsQuery = `
  *[_type == "blogPost" && isPublished == true && (
    title match $searchTerm ||
    excerpt match $searchTerm ||
    tags[] match $searchTerm ||
    categories[]->name match $searchTerm ||
    author->name match $searchTerm
  )] | order(publishedAt desc) {
    ${baseFields},
    excerpt,
    publishedAt,
    readingTime,
    "featuredImageUrl": featuredImage.asset->url,
    author->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url
    },
    categories[]->{
      ${baseFields},
      name,
      color
    },
    tags
  }
`;

// Search query
export const searchCoursesQuery = `
  *[_type == "course" && isPublished == true && (
    title match $searchTerm ||
    shortDescription match $searchTerm ||
    tags[] match $searchTerm ||
    category->name match $searchTerm ||
    instructor->name match $searchTerm
  )] | order(order asc, _createdAt desc) {
    ${baseFields},
    shortDescription,
    price,
    currency,
    stripePriceId,
    difficulty,
    estimatedDuration,
    isPublished,
    isFeatured,
    publishedAt,
    order,
    "thumbnailUrl": thumbnail.asset->url,
    "heroImageUrl": heroImage.asset->url,
    category->{
      ${baseFields},
      name,
      color
    },
    instructor->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url,
      "professionalTitle": title
    },
    learningOutcomes,
    tags,
    seoTitle,
    seoDescription
  }
`;

// Featured courses query
export const featuredCoursesQuery = `
  *[_type == "course" && isPublished == true && isFeatured == true] | order(order asc, _createdAt desc) [0...6] {
    ${baseFields},
    shortDescription,
    price,
    currency,
    stripePriceId,
    difficulty,
    estimatedDuration,
    isPublished,
    isFeatured,
    publishedAt,
    order,
    "thumbnailUrl": thumbnail.asset->url,
    "heroImageUrl": heroImage.asset->url,
    category->{
      ${baseFields},
      name,
      color
    },
    instructor->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url,
      "professionalTitle": title
    },
    learningOutcomes,
    tags,
    seoTitle,
    seoDescription
  }
`;

// Blog queries
export const blogPostsQuery = `
  *[_type == "blogPost" && isPublished == true] | order(publishedAt desc) {
    ${baseFields},
    excerpt,
    publishedAt,
    isFeatured,
    readingTime,
    "featuredImageUrl": featuredImage.asset->url,
    author->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url,
      "professionalTitle": title
    },
    categories[]->{
      ${baseFields},
      name,
      color
    },
    tags,
    seoTitle,
    seoDescription
  }
`;

// Paginated blog posts query
export const blogPostsPaginatedQuery = `
  *[_type == "blogPost" && isPublished == true] | order(publishedAt desc) [$start...$end] {
    ${baseFields},
    excerpt,
    publishedAt,
    isFeatured,
    readingTime,
    "featuredImageUrl": featuredImage.asset->url,
    author->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url,
      "professionalTitle": title
    },
    categories[]->{
      ${baseFields},
      name,
      color
    },
    tags,
    seoTitle,
    seoDescription
  }
`;

// Blog posts count query
export const blogPostsCountQuery = `
  count(*[_type == "blogPost" && isPublished == true])
`;

// Featured blog posts query
export const featuredBlogPostsQuery = `
  *[_type == "blogPost" && isPublished == true && isFeatured == true] | order(publishedAt desc) [0...3] {
    ${baseFields},
    excerpt,
    publishedAt,
    isFeatured,
    readingTime,
    "featuredImageUrl": featuredImage.asset->url,
    author->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url,
      "professionalTitle": title
    },
    categories[]->{
      ${baseFields},
      name,
      color
    },
    tags,
    seoTitle,
    seoDescription
  }
`;

// Blog posts by category query
export const blogPostsByCategoryQuery = `
  *[_type == "blogPost" && isPublished == true && $categoryId in categories[]._ref] | order(publishedAt desc) {
    ${baseFields},
    excerpt,
    publishedAt,
    isFeatured,
    readingTime,
    "featuredImageUrl": featuredImage.asset->url,
    author->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url,
      "professionalTitle": title
    },
    categories[]->{
      ${baseFields},
      name,
      color
    },
    tags,
    seoTitle,
    seoDescription
  }
`;

export const blogPostBySlugQuery = `
  *[_type == "blogPost" && slug.current == $slug][0] {
    ${baseFields},
    content,
    excerpt,
    publishedAt,
    isFeatured,
    readingTime,
    "featuredImageUrl": featuredImage.asset->url,
    author->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url,
      "professionalTitle": title,
      bio,
      socialLinks
    },
    categories[]->{
      ${baseFields},
      name,
      color
    },
    tags,
    seoTitle,
    seoDescription
  }
`;

// Related blog posts query
export const relatedBlogPostsQuery = `
  *[_type == "blogPost" && isPublished == true && _id != $currentPostId && (
    count(categories[]._ref[@ in $categoryIds]) > 0 ||
    count(tags[@ in $tags]) > 0
  )] | order(publishedAt desc) [0...3] {
    ${baseFields},
    excerpt,
    publishedAt,
    readingTime,
    "featuredImageUrl": featuredImage.asset->url,
    author->{
      ${baseFields},
      name,
      "avatarUrl": avatar.asset->url
    },
    categories[]->{
      ${baseFields},
      name,
      color
    },
    tags
  }
`;

// Site settings query
export const siteSettingsQuery = `
  *[_type == "siteSettings"][0] {
    title,
    description,
    "logoUrl": logo.asset->url,
    "faviconUrl": favicon.asset->url,
    primaryColor,
    secondaryColor,
    socialLinks,
    seoTitle,
    seoDescription,
    "seoImageUrl": seoImage.asset->url,
    keywords,
    contactEmail,
    supportEmail,
    companyName,
    companyAddress,
    privacyPolicy,
    termsOfService
  }
`;

// Instructor queries
export const instructorsQuery = `
  *[_type == "instructor" && isActive == true] | order(name asc) {
    ${baseFields},
    name,
    "avatarUrl": avatar.asset->url,
    professionalTitle: title,
    bio,
    experience,
    specialties,
    certifications,
    socialLinks,
    isActive
  }
`;

export const instructorBySlugQuery = `
  *[_type == "instructor" && slug.current == $slug][0] {
    ${baseFields},
    name,
    "avatarUrl": avatar.asset->url,
    professionalTitle: title,
    bio,
    experience,
    specialties,
    certifications,
    socialLinks,
    isActive
  }
`;

// Legal page queries
export const legalPagesQuery = `
  *[_type == "legalPage" && isPublished == true] | order(pageType asc) {
    ${baseFields},
    pageType,
    lastUpdated,
    effectiveDate,
    version,
    seo
  }
`;

export const legalPageBySlugQuery = `
  *[_type == "legalPage" && slug.current == $slug && isPublished == true][0] {
    ${baseFields},
    pageType,
    content,
    lastUpdated,
    effectiveDate,
    version,
    seo
  }
`;

export const legalPageByTypeQuery = `
  *[_type == "legalPage" && pageType == $pageType && isPublished == true][0] {
    ${baseFields},
    pageType,
    content,
    lastUpdated,
    effectiveDate,
    version,
    seo
  }
`;
