import { ReactNode } from "react";
import { cn } from "@/lib/utils/utils";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className,
}: TabNavigationProps) {
  return (
    <div className={cn("border-b border-white/20 mb-8", className)}>
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "py-3 px-1 border-b-2 font-medium text-base transition-all duration-200",
              "flex items-center gap-2",
              activeTab === tab.id
                ? "border-(--color-gold) text-(--color-gold)"
                : "border-transparent text-white/70 hover:text-white hover:border-white/30"
            )}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}