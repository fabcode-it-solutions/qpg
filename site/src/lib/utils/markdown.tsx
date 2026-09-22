import React from "react";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    currentIndex++;

    // Skip empty lines
    if (line.trim() === "") {
      elements.push(<br key={currentIndex} />);
      continue;
    }

    // Handle headers
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      const headerText = line.slice(2, -2);
      elements.push(
        <h3
          key={currentIndex}
          className="font-bold text-lg mt-4 mb-2"
        >
          {headerText}
        </h3>
      );
      continue;
    }

    // Handle numbered lists
    const numberedMatch = line.match(/^(\d+)\.\s*\*\*(.*?)\*\*(.*)$/);
    if (numberedMatch) {
      const [, number, boldText, restText] = numberedMatch;
      elements.push(
        <div
          key={currentIndex}
          className="mb-2 2xl:text-[20px] lg:text-[18px] md:text-[16px] text-[14px]"
        >
          <span className="font-semibold text-(--color-gold)">{number}. </span>
          <span className="font-bold">{boldText}</span>
          <span>{restText}</span>
        </div>
      );
      continue;
    }

    // Handle simple numbered lists
    const simpleNumberMatch = line.match(/^(\d+)\.\s*(.*)$/);
    if (simpleNumberMatch) {
      const [, number, text] = simpleNumberMatch;
      elements.push(
        <div
          key={currentIndex}
          className="mb-1 ml-2 2xl:text-[20px] lg:text-[18px] md:text-[16px] text-[14px]"
        >
          <span className="font-semibold text-(--color-gold)">{number}. </span>
          <span>{processBoldText(text)}</span>
        </div>
      );
      continue;
    }

    // Handle bullet points
    if (line.startsWith("- ")) {
      const text = line.slice(2);
      elements.push(
        <div key={currentIndex} className="mb-1 ml-4">
          <span className="text-(--color-gold) mr-2">•</span>
          <span>{processBoldText(text)}</span>
        </div>
      );
      continue;
    }

    // Handle regular paragraphs with bold text, links, and emails
    elements.push(
      <p
        key={currentIndex}
        className="mb-2 2xl:text-[20px] lg:text-[18px] md:text-[16px] text-[14px]"
      >
        {processBoldText(line)}
      </p>
    );
  }

  return elements;
}

function processBoldText(text: string): React.ReactNode {
  // First handle bold text
  const boldParts = text.split(/(\*\*.*?\*\*)/);

  return boldParts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <span key={index} className="font-bold">
          {processLinksAndEmails(part.slice(2, -2))}
        </span>
      );
    }
    return processLinksAndEmails(part);
  });
}

function processLinksAndEmails(text: string): React.ReactNode {
  // Combined regex for URLs and emails
  const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const parts = text.split(linkRegex);

  return parts.map((part, index) => {
    // Check if it's an email
    if (part.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      return (
        <a
          key={index}
          href={`mailto:${part}`}
          className="text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 underline transition-colors cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    
    // Check if it's a URL
    if (part.match(/^(https?:\/\/|www\.)/)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 underline transition-colors cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    
    return part;
  });
}

export const MarkdownRenderer: React.FC<MarkdownProps> = ({
  content,
  className = "",
}) => {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {parseMarkdown(content)}
    </div>
  );
};
