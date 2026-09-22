import { Metadata } from "next";
import { notFound } from "next/navigation";
import { legalService } from "@/lib/services/legal.service";
import LegalPageContent from "@/components/legal/LegalPageContent";

export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata(): Promise<Metadata> {
  const fulfillmentPage = await legalService.getFulfillmentPolicy();
  
  if (!fulfillmentPage) {
    return {
      title: "Fulfillment & Delivery Policy | QPG",
      description: "Fulfillment & Delivery Policy for QPG online courses platform",
    };
  }

  return {
    title: fulfillmentPage.seo?.metaTitle || `${fulfillmentPage.title} | QPG`,
    description: fulfillmentPage.seo?.metaDescription || `${fulfillmentPage.title} for QPG online courses platform`,
  };
}

export default async function FulfillmentPage() {
  const fulfillmentPage = await legalService.getFulfillmentPolicy();

  if (!fulfillmentPage) {
    notFound();
  }

  return <LegalPageContent legalPage={fulfillmentPage} />;
}