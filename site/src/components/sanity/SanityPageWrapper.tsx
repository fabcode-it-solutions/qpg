import React from "react";
import { Metadata } from "next";
import { ErrorBoundary } from "../ui/ErrorBoundary";
import SectionRenderer from "./SectionRenderer";
import { getSiteContent } from "@/lib/sanity/site-content-service";
import type { SanityPageWrapperProps } from "@/types/sanity";

/**
 * Development logging helper
 */
const log = (message: string, data?: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[SanityPage] ${message}`, data || "");
  }
};

/**
 * Default fallback content when no content is found
 */
const DefaultFallbackContent: React.FC = () => (
  <div className="min-h-[400px] flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md mx-auto p-8">
      <div className="text-gray-400 mb-4">
        <svg
          className="w-16 h-16 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">
        No content found
      </h2>
      <p className="text-gray-500 text-sm">
        Please add content in Sanity CMS for this page.
      </p>
    </div>
  </div>
);


const SanityPageWrapper: React.FC<SanityPageWrapperProps> = async ({
  pageIdentifier,
  fallbackContent,
}) => {
  if (!pageIdentifier?.trim()) {
    return null;
  }

  try {
    const pageContent = await getSiteContent(pageIdentifier);
    
    log("Content fetched", {
      sections: pageContent?.sections?.length || 0,
    });

    if (!pageContent?.sections?.length) {
      return (
        <main className="min-h-screen">
          {fallbackContent || <DefaultFallbackContent />}
        </main>
      );
    }

    return (
      <main>
        {pageContent.sections.map((section: any, index: number) => (
          <ErrorBoundary key={section._key || `section-${index}`}>
            <SectionRenderer section={section} />
          </ErrorBoundary>
        ))}
      </main>
    );
  } catch (error) {
    console.error("Failed to fetch Sanity content:", error);
    return (
      <main className="min-h-screen">
        {fallbackContent || <DefaultFallbackContent />}
      </main>
    );
  }
};

export async function generateSanityMetadata(
  pageIdentifier: string
): Promise<Metadata> {
  if (!pageIdentifier?.trim()) {
    return getDefaultMetadata();
  }

  try {
    const pageContent = await getSiteContent(pageIdentifier);

    if (!pageContent) {
      return getDefaultMetadata();
    }

    const title = pageContent.seo?.metaTitle || pageContent.title || "QPG";
    const description = pageContent.seo?.metaDescription || "Cannabis cultivation expertise";
    const image = pageContent.seo?.shareImage;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        ...(image && { images: [{ url: image, alt: title }] }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(image && { images: [image] }),
      },
      robots: { index: true, follow: true },
      ...(pageContent.slug?.current && {
        alternates: { canonical: `/${pageContent.slug.current}` },
      }),
    };
  } catch (error) {
    log("Metadata generation failed", error);
    return getDefaultMetadata();
  }
}

/**
 * Get default metadata when content is not available
 */
function getDefaultMetadata(): Metadata {
  return {
    title: "QPG - Quantum Pot Grown",
    description: "Cannabis cultivation expertise",
    openGraph: {
      title: "QPG - Quantum Pot Grown",
      description: "Cannabis cultivation expertise",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "QPG - Quantum Pot Grown",
      description: "Cannabis cultivation expertise",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// Set display name for debugging
SanityPageWrapper.displayName = "SanityPageWrapper";

export default SanityPageWrapper;
