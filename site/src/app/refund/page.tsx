import { Metadata } from "next";
import { notFound } from "next/navigation";
import { legalService } from "@/lib/services/legal.service";
import LegalPageContent from "@/components/legal/LegalPageContent";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const refundPage = await legalService.getRefundPolicy();

  if (!refundPage) {
    return {
      title: "Refund Policy | QPG",
      description: "Refund Policy for QPG online courses platform",
    };
  }

  return {
    title: refundPage.seo?.metaTitle || `${refundPage.title} | QPG`,
    description:
      refundPage.seo?.metaDescription ||
      `${refundPage.title} for QPG online courses platform`,
  };
}

export default async function RefundPage() {
  const refundPage = await legalService.getRefundPolicy();

  if (!refundPage) {
    notFound();
  }

  return <LegalPageContent legalPage={refundPage} />;
}
