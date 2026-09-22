"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/utils";
import {
  UserIcon,
  LockIcon,
  CreditCardIcon,
  SettingsIcon,
} from "@/components/icons";
import PersonalInfoSection from "./PersonalInfoSection";
import PasswordSection from "./PasswordSection";
import SubscriptionSection from "./SubscriptionSection";
import SettingsSection from "./SettingsSection";

interface ProfileContentProps {
  userId: string;
}

type TabType = "personal" | "password" | "subscriptions" | "settings";

const tabs = [
  {
    id: "personal" as TabType,
    label: "Personal Info",
    icon: UserIcon,
    description: "Manage your personal information and profile details",
  },
  {
    id: "password" as TabType,
    label: "Security",
    icon: LockIcon,
    description: "Change password and security settings",
  },
  {
    id: "subscriptions" as TabType,
    label: "Subscriptions",
    icon: CreditCardIcon,
    description: "Manage your course subscriptions and billing",
  },
  {
    id: "settings" as TabType,
    label: "Settings",
    icon: SettingsIcon,
    description: "Preferences and account settings",
  },
];

export default function ProfileContent({ userId }: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const { data: session } = useSession();

  const renderContent = () => {
    switch (activeTab) {
      case "personal":
        return <PersonalInfoSection userId={userId} />;
      case "password":
        return <PasswordSection userId={userId} />;
      case "subscriptions":
        return <SubscriptionSection userId={userId} />;
      case "settings":
        return <SettingsSection userId={userId} />;
      default:
        return <PersonalInfoSection userId={userId} />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    "text-left group",
                    isActive
                      ? "bg-(--color-gold) text-black"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <IconComponent
                    size={20}
                    className={cn(
                      "flex-shrink-0",
                      isActive
                        ? "text-black"
                        : "text-white/50 group-hover:text-white/70"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-black" : "text-white/80"
                      )}
                    >
                      {tab.label}
                    </p>
                    <p
                      className={cn(
                        "text-xs truncate mt-1",
                        isActive ? "text-black/70" : "text-white/50"
                      )}
                    >
                      {tab.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Summary Card */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-(--color-gold) text-black flex items-center justify-center text-xl font-bold">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <h3 className="text-lg font-medium text-white">
              {session?.user?.name || "User"}
            </h3>
            <p className="text-sm text-white/60 mt-1">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
