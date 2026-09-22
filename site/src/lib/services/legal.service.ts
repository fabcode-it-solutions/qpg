import { client } from "@/lib/sanity/client";
import {
  legalPagesQuery,
  legalPageBySlugQuery,
  legalPageByTypeQuery,
} from "@/lib/sanity/queries";

export interface LegalPage {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  title: string;
  slug: {
    current: string;
  };
  pageType: string;
  content?: any[];
  lastUpdated: string;
  effectiveDate: string;
  version?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

class LegalService {
  async getAllLegalPages(): Promise<LegalPage[]> {
    try {
      return await client.fetch(legalPagesQuery);
    } catch (error) {
      console.error("Error fetching legal pages:", error);
      return [];
    }
  }

  async getLegalPageBySlug(slug: string): Promise<LegalPage | null> {
    try {
      return await client.fetch(
        legalPageBySlugQuery,
        { slug },
        {
          next: { revalidate: 3600, tags: ["sanity", "legal-pages"] },
        }
      );
    } catch (error) {
      console.error(`Error fetching legal page by slug ${slug}:`, error);
      return null;
    }
  }

  async getLegalPageByType(pageType: string): Promise<LegalPage | null> {
    try {
      return await client.fetch(
        legalPageByTypeQuery,
        { pageType },
        {
          next: { revalidate: 3600, tags: ["sanity", "legal-pages"] },
        }
      );
    } catch (error) {
      console.error(`Error fetching legal page by type ${pageType}:`, error);
      return null;
    }
  }

  // Helper methods for specific legal pages
  async getTermsOfService(): Promise<LegalPage | null> {
    return this.getLegalPageByType("terms");
  }

  async getPrivacyPolicy(): Promise<LegalPage | null> {
    return this.getLegalPageByType("privacy");
  }

  async getRefundPolicy(): Promise<LegalPage | null> {
    return this.getLegalPageByType("refund");
  }

  async getCookiePolicy(): Promise<LegalPage | null> {
    return this.getLegalPageByType("cookies");
  }

  async getFulfillmentPolicy(): Promise<LegalPage | null> {
    return this.getLegalPageByType("fulfillment");
  }
}

export const legalService = new LegalService();
