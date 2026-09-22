import { Metadata } from "next";
import SanityPageWrapper, {
  generateSanityMetadata,
} from "@/components/sanity/SanityPageWrapper";

export async function generateMetadata(): Promise<Metadata> {
  return await generateSanityMetadata("videos");
}

export default function VideosPage() {
  return (
    <SanityPageWrapper
      pageIdentifier="videos"
      fallbackContent={
        <div className="py-16 text-center bg-black text-white min-h-screen">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl font-bold mb-4 text-[var(--color-gold)]">
              Premium Video Content
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Please add video content in Sanity Studio to see your videos here.
            </p>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold mb-2 text-[var(--color-gold)]">
                📹 How to Add Videos:
              </h2>
              <ol className="text-left space-y-2 text-gray-300">
                <li>1. Go to Sanity Studio</li>
                <li>2. Click "Site Content" in the sidebar</li>
                <li>3. Create a new document with Page Type "Videos Page"</li>
                <li>
                  4. Add a Videos Section with your Bunny.net video details
                </li>
                <li>5. Configure access control and layout</li>
                <li>6. Publish your content</li>
              </ol>
            </div>
          </div>
        </div>
      }
    />
  );
}
