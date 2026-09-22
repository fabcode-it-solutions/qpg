import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import ProfileContent from "@/components/profile/ProfileContent";
import { SpinnerIcon } from "@/components/icons";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black py-12 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-(--color-gold) mb-4">
              User Profile
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Manage your account settings, subscriptions, and learning progress
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-12">
              <SpinnerIcon size={48} className="text-(--color-gold)" />
            </div>
          }
        >
          <ProfileContent userId={session.user.id!} />
        </Suspense>
      </div>
    </div>
  );
}
