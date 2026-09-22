"use client";

import { useState } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { GoldButton } from "@/components/ui/GoldButton";
import { ProspectChatModal } from "@/components/chat/ProspectChatModal";

export default function ContactPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="bg-black">
      {/* Hero Section */}
      <PageHero
        title="Get in Touch"
        subtitle="We're Here to Help"
        description="Have questions about cannabis cultivation? Our AI assistant Q is ready to help you with expert guidance and personalized recommendations."
      >
        <GoldButton
          size="lg"
          onClick={() => setIsChatOpen(true)}
          className="mt-6"
        >
          Live Chat with Q
        </GoldButton>
      </PageHero>

      {/* Chat Modal */}
      <ProspectChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
