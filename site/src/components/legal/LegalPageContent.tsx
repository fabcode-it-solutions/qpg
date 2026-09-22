import { PortableText } from "@portabletext/react";
import { LegalPage } from "@/lib/services/legal.service";

interface LegalPageContentProps {
  legalPage: LegalPage;
}

export default function LegalPageContent({ legalPage }: LegalPageContentProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {legalPage.title}
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-white/60">
            <p>
              <span className="font-medium">Effective Date:</span>{" "}
              {new Date(legalPage.effectiveDate).toLocaleDateString()}
            </p>
            <span className="hidden sm:block">•</span>
            <p>
              <span className="font-medium">Last Updated:</span>{" "}
              {new Date(legalPage.lastUpdated).toLocaleDateString()}
            </p>
            {legalPage.version && (
              <>
                <span className="hidden sm:block">•</span>
                <p>
                  <span className="font-medium">Version:</span>{" "}
                  {legalPage.version}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="legal-content">
            <PortableText
              value={legalPage.content}
              components={{
                block: {
                  normal: ({ children }) => (
                    <p className="mb-6 text-white/80 leading-relaxed">
                      {children}
                    </p>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-white mt-12 mb-6 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-semibold text-white mt-10 mb-5">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold text-white mt-8 mb-4">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-lg font-semibold text-white mt-6 mb-3">
                      {children}
                    </h4>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-yellow-500 pl-6 my-6 italic text-white/70">
                      {children}
                    </blockquote>
                  ),
                },
                list: {
                  bullet: ({ children }) => (
                    <ul className="list-disc list-inside mb-6 space-y-2 text-white/80">
                      {children}
                    </ul>
                  ),
                  number: ({ children }) => (
                    <ol className="list-decimal list-inside mb-6 space-y-2 text-white/80">
                      {children}
                    </ol>
                  ),
                },
                listItem: {
                  bullet: ({ children }) => (
                    <li className="ml-4">{children}</li>
                  ),
                  number: ({ children }) => (
                    <li className="ml-4">{children}</li>
                  ),
                },
                marks: {
                  strong: ({ children }) => (
                    <strong className="font-semibold text-white">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-white/90">{children}</em>
                  ),
                  underline: ({ children }) => (
                    <span className="underline">{children}</span>
                  ),
                  link: ({ children, value }) => (
                    <a
                      href={value?.href}
                      className="text-yellow-400 hover:text-yellow-300 underline transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                },
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center">
          <p className="text-white/60">
            If you have any questions about this {legalPage.title.toLowerCase()}
            , please contact us at{" "}
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSf7cZLJqY2tp1DHq3vAPP_RsVB0v_-tjRxb6R6TSWaWNwIYqg/viewform?usp=sharing&ouid=101687650878366627819"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-gold)] hover:text-[var(--color-gold)"
            >
              Fill this form
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
