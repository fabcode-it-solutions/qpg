"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  useUserProgressOverview,
  formatDuration,
} from "@/hooks/useCourseProgress";
import { DashboardData } from "@/lib/services/dashboard.service";
import { BookOpen, Play, Clock, Award, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GoldButton } from "@/components/ui/GoldButton";
import { TabNavigation } from "@/components/ui/TabNavigation";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";

export default function EnhancedUserDashboard() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"courses" | "security">("courses");

  // Use enhanced progress tracking
  const { overview: progressOverview, isLoading: progressLoading } =
    useUserProgressOverview();

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <GlassCard className="max-w-md mx-4 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Please sign in to view your dashboard
          </h1>
          <Link href="/auth/login">
            <GoldButton size="lg">Sign In</GoldButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-white/5 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-white/5 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <GlassCard className="max-w-md mx-4 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <GoldButton onClick={fetchDashboardData}>Try Again</GoldButton>
        </GlassCard>
      </div>
    );
  }

  const tabs = [
    { id: "courses", label: "My Courses", icon: <BookOpen size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black py-12 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-(--color-gold) mb-4">
              Welcome back,{" "}
              {session.user?.name || session.user?.email?.split("@")[0]}!
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Continue your learning journey and track your progress
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as "courses" | "security")}
        />

        {/* Tab Content */}
        {activeTab === "courses" ? (
          <>
            {dashboardData?.subscriptions.length === 0 ? (
              <GlassCard className="text-center py-16">
                <div className="mb-6 flex justify-center">
                  <BookOpen size={80} className="text-(--color-gold)" />
                </div>
                <h3 className="text-2xl font-medium text-white mb-4">
                  No courses yet
                </h3>
                <p className="text-white/70 mb-8 text-lg max-w-md mx-auto">
                  Start your learning journey by exploring our course catalog
                </p>
                <Link href="/courses">
                  <GoldButton size="lg">Browse Courses</GoldButton>
                </Link>
              </GlassCard>
            ) : (
              <div className="space-y-8">
                {/* Progress Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    title="Total Courses"
                    value={dashboardData?.subscriptions.length || 0}
                    icon={<BookOpen size={24} />}
                    valueColor="gold"
                  />
                  <StatCard
                    title="Completed"
                    value={progressOverview?.completedCourses || 0}
                    icon={<Award size={24} />}
                    valueColor="green"
                  />
                  <StatCard
                    title="In Progress"
                    value={progressOverview?.inProgressCourses || 0}
                    icon={<Play size={24} />}
                    valueColor="blue"
                  />
                  <StatCard
                    title="Total Watch Time"
                    value={formatDuration(progressOverview?.totalWatchTime || 0)}
                    icon={<Clock size={24} />}
                    valueColor="purple"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-white">
                      My Courses ({dashboardData?.subscriptions.length})
                    </h2>
                    <Link href="/courses">
                      <GoldButton variant="outline" size="sm">
                        <TrendingUp size={16} className="mr-2" />
                        Explore More
                      </GoldButton>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardData?.subscriptions.map((subscription) => {
                      const course = dashboardData.courses.find(
                        (c) => c.id === subscription.courseId
                      );
                      const progress =
                        dashboardData.progress[subscription.courseId];

                      // Get enhanced progress if available
                      const enhancedProgress =
                        progressOverview?.coursesProgress.find(
                          (cp) => cp.courseId === subscription.courseId
                        );

                      if (!course) return null;

                      return (
                        <GlassCard
                          key={subscription.subscriptionId}
                          className="overflow-hidden hover:bg-white/10 transition-all duration-300 group cursor-pointer"
                          padding="sm"
                        >
                          <Link href={`/courses/${course.id}`}>
                            <div className="relative">
                              {course.thumbnailUrl ? (
                                <img
                                  src={course.thumbnailUrl}
                                  alt={course.title}
                                  className="w-full h-48 object-cover rounded-lg mb-4 group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-48 bg-white/5 flex items-center justify-center rounded-lg mb-4">
                                  <BookOpen
                                    size={40}
                                    className="text-white/50"
                                  />
                                </div>
                              )}
                              <div className="absolute top-3 right-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                                    subscription.subscriptionStatus === "active"
                                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  }`}
                                >
                                  {subscription.subscriptionStatus.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            <div className="p-2">
                              <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-(--color-gold) transition-colors duration-200">
                                {course.title}
                              </h3>

                              {(enhancedProgress || progress) && (
                                <div className="mb-4">
                                  <ProgressBar
                                    progress={
                                      enhancedProgress?.progressPercentage ??
                                      progress?.progressPercentage ??
                                      0
                                    }
                                    size="sm"
                                    animated={true}
                                  />
                                  <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-white/60">
                                      {enhancedProgress?.completedVideos ??
                                        progress?.completedVideos ??
                                        0}{" "}
                                      of{" "}
                                      {enhancedProgress?.totalVideos ??
                                        progress?.totalVideos ??
                                        0}{" "}
                                      videos
                                    </p>
                                    {enhancedProgress?.lastActivityAt && (
                                      <p className="text-xs text-white/40">
                                        {new Date(
                                          enhancedProgress.lastActivityAt
                                        ).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white/60 bg-white/5 px-2 py-1 rounded-full">
                                  {course.category}
                                </span>
                                <GoldButton
                                  size="sm"
                                  className="flex justify-center items-center"
                                >
                                  <Play size={14} className="mr-1" />
                                  Continue
                                </GoldButton>
                              </div>
                            </div>
                          </Link>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>

                <GlassCard className="text-center py-8">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Continue Your Learning Journey
                  </h3>
                  <p className="text-white/70 mb-6 max-w-2xl mx-auto">
                    Discover new skills, advance your career, and unlock your
                    potential with our comprehensive course catalog.
                  </p>
                  <Link href="/courses">
                    <GoldButton size="lg">
                      <span className="flex items-center">
                        <BookOpen size={20} className="mr-2" />
                        <span>Browse All Courses</span>
                      </span>
                    </GoldButton>
                  </Link>
                </GlassCard>
              </div>
            )}
          </>
        ) : (
          <GlassCard>
            <div className="text-center py-12">
              <p className="text-white/70">
                Additional features coming soon...
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
