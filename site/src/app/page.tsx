import SanityPageWrapper from "@/components/sanity/SanityPageWrapper";

export default function Home() {
  return (
    <SanityPageWrapper
      pageIdentifier="home"
      fallbackContent={
        <div className="py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">
            Welcome to Quantum Pot Grown
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Please add content in Sanity Studio to see your page sections here.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-2">
              📝 How to Add Content:
            </h2>
            <ol className="text-left space-y-2">
              <li>1. Go to Sanity Studio (http://localhost:3333)</li>
              <li>2. Click "Site Content" in the sidebar</li>
              <li>3. Create a new document with Page Type "Home Page"</li>
              <li>4. Add sections (Hero, About, Features, Contact)</li>
              <li>5. Publish your content</li>
            </ol>
          </div>
        </div>
      }
    />
  );
}
