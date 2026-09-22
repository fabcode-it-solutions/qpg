import { Metadata } from "next";
import { notFound } from "next/navigation";
import { legalService } from "@/lib/services/legal.service";
import LegalPageContent from "@/components/legal/LegalPageContent";

export async function generateMetadata(): Promise<Metadata> {
  const privacyPage = await legalService.getPrivacyPolicy();
  
  if (!privacyPage) {
    return {
      title: "Privacy Policy | QPG",
      description: "Privacy Policy for QPG online courses platform",
    };
  }

  return {
    title: privacyPage.seo?.metaTitle || `${privacyPage.title} | QPG`,
    description: privacyPage.seo?.metaDescription || `${privacyPage.title} for QPG online courses platform`,
  };
}

export default async function PrivacyPage() {
  const privacyPage = await legalService.getPrivacyPolicy();

  if (!privacyPage) {
    notFound();
  }

  return <LegalPageContent legalPage={privacyPage} />;
}