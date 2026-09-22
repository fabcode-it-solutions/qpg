// Sanity configuration and feature flags

export const sanityConfig = {
  // Project details
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: "production",
  apiVersion: "2025-05-08",

  // Feature flags
  useCdn: process.env.NODE_ENV === "production",
  useSanityForContent: process.env.USE_SANITY_CMS !== "false", // Default to true

  // Fallback settings
  fallbackToDatabase: true,
  enablePreview: process.env.NODE_ENV === "development",
};

export const isUsingSanity = () => sanityConfig.useSanityForContent;
