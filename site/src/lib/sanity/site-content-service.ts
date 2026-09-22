import { cache } from "react";
import { client } from "./client";

// Cache duration in seconds
const CACHE_DURATION = 60 * 60; // 1 hour

// Get site content by page type or slug
export const getSiteContent = cache(async (pageIdentifier: string) => {
  try {
    // Try to find by pageType first, then by slug
    const query = `*[_type == "siteContent" && (pageType == $identifier || slug.current == $identifier) && isPublished == true][0]{
      _id,
      title,
      slug,
      pageType,
      seo{
        metaTitle,
        metaDescription,
        shareImage
      },
      sections[]{
        _type,
        _key,
        title,
        heading,
        subheading,
        description,
        content,
        backgroundColor,
        
        // Hero Section fields
        backgroundImages[]{
          image,
          alt,
          position,
          opacity,
          order
        },
        
        // CTA Button
        ctaButton{
          text,
          href,
          style,
          showButton,
          pricing{
            showPricing,
            title,
            standardPrice{
              label,
              amount
            },
            offerPrice{
              label,
              amount
            }
          }
        },
        
        // Images for other sections
        images[]{
          asset,
          alt,
          caption,
          position
        },
        
        // Features (both About and Features sections)
        features[]{
          title,
          description,
          icon,
          value,
          order
        },
        
        // Features Section specific fields
        media{
          mediaType,
          image,
          video{
            asset->{
              _id,
              url
            }
          },
          videoUrl,
          images[]{
            image,
            alt,
            caption
          },
          alt,
          caption,
          position
        },
        layout,
        
        // Live Chat Widget
        liveChat{
          title,
          subtitle,
          buttonText,
          showChat
        },
        
        // Videos Section
        videos[]{
          title,
          description,
          bunnyVideoId,
          bunnyLibraryId,
          thumbnailUrl,
          duration,
          order,
          isActive
        },
        enrollButton{
          text,
          href,
          showButton
        },
        accessControl{
          requireLogin,
          loginMessage,
          subscriptionRequired
        },
        
        // Contact Section
        contactInfo{
          email,
          phone,
          address
        },
        showContactForm,
        
        // Enhanced About Section Fields
        heroContent{
          title,
          subtitle,
          description,
          ctaButtons[]{
            text,
            href,
            style,
            showButton
          }
        },
        featuresContent{
          title,
          subtitle,
          features[]{
            title,
            description,
            icon,
            highlight,
            order
          }
        },
        missionContent{
          title,
          subtitle,
          whyWeExistTitle,
          whyWeExistContent,
          impactTitle,
          statistics[]{
            value,
            label,
            prefix,
            suffix
          }
        },
        teamContent{
          title,
          subtitle,
          teamMembers[]{
            name,
            role,
            bio,
            avatar,
            avatarUrl,
            socialLinks{
              linkedin,
              twitter,
              website
            }
          }
        },
        ctaContent{
          title,
          subtitle,
          description,
          ctaButtons[]{
            text,
            href,
            style,
            showButton
          }
        },
        
        // Enhanced Contact Section Fields
        contactMethodsContent{
          title,
          subtitle,
          contactMethods[]{
            title,
            description,
            icon,
            value,
            href,
            action
          }
        },
        contactFormContent{
          formTitle,
          formDescription,
          showContactForm,
          formConfig{
            showForm,
            formTitle,
            formDescription,
            submitButtonText,
            namePlaceholder,
            emailPlaceholder,
            subjectPlaceholder,
            messagePlaceholder,
            successMessage,
            errorMessage
          }
        },
        supportContent{
          title,
          description,
          supportOptions[]{
            title,
            description,
            hours,
            response
          }
        },
        businessHoursContent{
          title,
          supportTeamTitle,
          emergencySupportTitle,
          regularHours[]{
            day,
            hours,
            isOpen
          },
          emergencySupport[]{
            title,
            availability,
            icon
          }
        },
        faqContent{
          title,
          description,
          buttonText,
          href
        }
      },
      isPublished,
      publishedAt
    }`;

    return await client.fetch(
      query,
      { identifier: pageIdentifier },
      {
        next: { revalidate: CACHE_DURATION, tags: ["sanity"] },
      }
    );
  } catch (error) {
    console.error(`Error fetching site content for ${pageIdentifier}:`, error);
    return null;
  }
});

// Get all published site content
export const getAllSiteContent = cache(async () => {
  try {
    const query = `*[_type == "siteContent" && isPublished == true] | order(publishedAt desc){
      _id,
      title,
      slug,
      pageType,
      seo{
        metaTitle,
        metaDescription
      },
      publishedAt
    }`;

    return await client.fetch(
      query,
      {},
      {
        next: { revalidate: CACHE_DURATION, tags: ["sanity"] },
      }
    );
  } catch (error) {
    console.error("Error fetching all site content:", error);
    return [];
  }
});

// Get home page content specifically
export const getHomePageContent = cache(async () => {
  return await getSiteContent("home");
});

// Get about page content
export const getAboutPageContent = cache(async () => {
  return await getSiteContent("about");
});

// Get contact page content
export const getContactPageContent = cache(async () => {
  return await getSiteContent("contact");
});

// Get blog page content
export const getBlogPageContent = cache(async () => {
  return await getSiteContent("blog");
});

// Get videos page content
export const getVideosPageContent = cache(async () => {
  return await getSiteContent("videos");
});
