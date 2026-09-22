import type { Metadata } from "next";
import Navbar from "@/layout/Navbar";

export const metadata: Metadata = {
  title: "Chat - QPG AI Assistant",
  description: "Chat with Q, your AI cannabis growing assistant",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
