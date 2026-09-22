import { Metadata } from "next";
import { notFound } from "next/navigation";
import { legalService } from "@/lib/services/legal.service";
import LegalPageContent from "@/components/legal/LegalPageContent";

export async function generateMetadata(): Promise<Metadata> {
  const termsPage = await legalService.getTermsOfService();
  
  if (!termsPage) {
    return {
      title: "Terms of Service | QPG",
      description: "Terms of Service for QPG online courses platform",
    };
  }

  return {
    title: termsPage.seo?.metaTitle || `${termsPage.title} | QPG`,
    description: termsPage.seo?.metaDescription || `${termsPage.title} for QPG online courses platform`,
  };
}

export default async function TermsPage() {
  const termsPage = await legalService.getTermsOfService();

  if (!termsPage) {
    notFound();
  }

  return <LegalPageContent legalPage={termsPage} />;
}