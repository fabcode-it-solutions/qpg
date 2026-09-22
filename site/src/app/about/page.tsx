import { PageHero } from "@/components/ui/PageHero";
import { ContentSection } from "@/components/ui/ContentSection";
import { FeatureGrid } from "@/components/ui/FeatureGrid";
import { GlassCard } from "@/components/ui/GlassCard";
import { GoldButton } from "@/components/ui/GoldButton";
import { UserIcon } from "@/components/icons";
import { getAboutPageContent } from "@/lib/sanity/site-content-service";
import {
  getAboutSection,
  transformAboutHero,
  transformAboutFeatures,
  transformAboutTeamMembers,
  transformAboutMission,
  transformAboutCta,
  getAboutSectionTitles,
} from "@/lib/sanity/enhanced-content-transformer";
import Link from "next/link";

export default async function AboutPage() {
  // Fetch content from Sanity
  const siteContent = await getAboutPageContent();

  // Get About section from Sanity
  const aboutSection = getAboutSection(siteContent);

  // Transform content using enhanced transformers
  const heroContent = transformAboutHero(aboutSection);
  const features = transformAboutFeatures(aboutSection);
  const teamMembers = transformAboutTeamMembers(aboutSection);
  const missionContent = transformAboutMission(aboutSection);
  const ctaContent = transformAboutCta(aboutSection);
  const sectionTitles = getAboutSectionTitles(aboutSection);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <PageHero
        title={heroContent?.title || siteContent?.title || "About Us"}
        subtitle={heroContent?.subtitle || "Learn More About Our Mission"}
        description={
          heroContent?.description || "Discover our story and values."
        }
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          {heroContent?.ctaButtons && heroContent.ctaButtons.length > 0 ? (
            heroContent.ctaButtons.map((button: any, index: number) => (
              <Link key={index} href={button.href}>
                <GoldButton variant={button.style} size="lg">
                  {button.text}
                </GoldButton>
              </Link>
            ))
          ) : (
            <Link href="/courses">
              <GoldButton size="lg">Explore Courses</GoldButton>
            </Link>
          )}
        </div>
      </PageHero>

      {/* Mission Section */}
      <ContentSection
        title={missionContent?.title || "Our Mission"}
        subtitle={missionContent?.subtitle || "What drives us forward"}
        background="subtle"
        centerText
      >
        <div
          className={`grid grid-cols-1 gap-12 items-stretch ${
            missionContent?.impactTitle ? "lg:grid-cols-2" : "max-w-4xl mx-auto"
          }`}
        >
          <div className="flex flex-col">
            <GlassCard padding="lg" className="h-full flex flex-col">
              <h3 className="text-2xl font-semibold text-white mb-4 text-center">
                {missionContent?.whyWeExistTitle || "Why We Exist"}
              </h3>
              <div className="flex-1 flex items-center">
                <p className="text-gray-300 leading-relaxed">
                  {missionContent?.whyWeExistContent ||
                    "Add your mission content in Sanity Studio."}
                </p>
              </div>
            </GlassCard>
          </div>

          {missionContent?.impactTitle && (
            <div className="flex flex-col">
              <GlassCard padding="lg" className="h-full flex flex-col">
                <h3 className="text-2xl font-semibold text-white mb-4 text-center">
                  {missionContent?.impactTitle || "Our Impact"}
                </h3>
                <div className="flex-1 flex items-center">
                  <div className="grid grid-cols-2 gap-6 w-full">
                    {missionContent?.statistics &&
                    missionContent.statistics.length > 0 ? (
                      missionContent.statistics.map(
                        (stat: any, index: number) => (
                          <div key={index} className="text-center">
                            <div className="text-3xl font-bold text-(--color-gold) mb-2">
                              {stat.value}
                            </div>
                            <div className="text-sm text-gray-400">
                              {stat.label}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="text-center col-span-2 text-gray-400">
                        Add statistics in Sanity Studio
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </ContentSection>

      {/* Features Section */}
      {features.length > 0 && (
        <ContentSection
          title={sectionTitles.featuresTitle}
          subtitle={sectionTitles.featuresSubtitle}
          centerText
        >
          <FeatureGrid features={features} />
        </ContentSection>
      )}

      {/* Team Section */}
      {teamMembers.length > 0 && (
        <ContentSection
          title={sectionTitles.teamTitle}
          subtitle={sectionTitles.teamSubtitle}
          background="subtle"
          centerText
        >
          <div className="grid grid-cols-1 md:grid-cols-3 xs:gap-8 gap-4">
            {teamMembers.map((member, index) => (
              <GlassCard
                key={index}
                className="text-center group hover:scale-105 transition-all duration-300"
              >
                <div className="mb-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-(--color-gold)/20 to-(--color-gold)/10 border-2 border-(--color-gold)/30 flex items-center justify-center">
                    <UserIcon className="w-12 h-12 text-(--color-gold)" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-(--color-gold) transition-colors duration-300">
                  {member.name}
                </h3>
                <p className="text-(--color-gold) font-medium mb-4">
                  {member.role}
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {member.bio}
                </p>
              </GlassCard>
            ))}
          </div>
        </ContentSection>
      )}

      {/* CTA Section */}
      {ctaContent && (
        <ContentSection
          title={ctaContent?.title || "Get Started Today"}
          subtitle={ctaContent?.subtitle || "Ready to begin your journey?"}
          centerText
        >
          <GlassCard className="max-w-2xl mx-auto text-center" padding="lg">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-(--color-gold)/20 to-(--color-gold)/10 border border-(--color-gold)/30 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-(--color-gold)" />
                </div>
              </div>

              <h3 className="text-2xl font-semibold text-white">
                {ctaContent?.title || "Start Your Journey Today"}
              </h3>

              <p className="text-gray-300">
                {ctaContent?.description ||
                  "Join us and discover what's possible."}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {ctaContent?.ctaButtons && ctaContent.ctaButtons.length > 0 ? (
                  ctaContent.ctaButtons.map((button: any, index: number) => (
                    <Link key={index} href={button.href}>
                      <GoldButton variant={button.style} size="lg">
                        {button.text}
                      </GoldButton>
                    </Link>
                  ))
                ) : (
                  <Link href="/courses">
                    <GoldButton size="lg">Browse Courses</GoldButton>
                  </Link>
                )}
              </div>
            </div>
          </GlassCard>
        </ContentSection>
      )}
    </div>
  );
}
