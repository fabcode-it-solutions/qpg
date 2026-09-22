"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/utils";
import { BookOpen, Hospital, LayoutDashboard, User } from "lucide-react";
import { ChevronDownIcon, LogOutIcon } from "@/components/icons";
import LogoutConfirmModal from "@/components/ui/LogoutConfirmModal";

interface UserDropdownProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onLogout: () => void;
  className?: string;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  user,
  onLogout,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get user display name
  const displayName = user?.name || user?.email || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const menuItems = [
    {
      label: "Profile",
      href: "/profile",
      icon: <User />,
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard />,
    },
    {
      label: "Courses",
      href: "/courses",
      icon: <BookOpen />,
    },
    {
      label: "Plant Clinic",
      href: "/plant-clinic",
      icon: <Hospital />,
    },
  ];

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className={cn("relative", className)}>
        <div className="flex items-center gap-2 !py-[18px] !px-[39px] rounded-[50px] border border-(--color-gold) text-(--color-gold)">
          <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
          <span className="hidden sm:inline-block text-sm xl:text-base font-medium">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 !py-[14px] !px-[18px] rounded-[50px] border border-(--color-gold) text-(--color-gold) hover:bg-(--color-gold) hover:text-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-(--color-gold) focus:ring-offset-2 focus:ring-offset-black"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-(--color-gold) text-black flex items-center justify-center text-sm font-semibold">
          {user?.image ? (
            <img
              src={user.image}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* User Name (hidden on small screens) */}
        <span className="hidden sm:inline-block text-sm xl:text-base font-medium max-w-[120px] truncate">
          {displayName}
        </span>

        {/* Dropdown Arrow */}
        <ChevronDownIcon
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-black border border-(--color-gold) rounded-lg shadow-lg z-50 py-1">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-700">
            <p className="text-sm font-medium text-white truncate">
              {displayName}
            </p>
            {user?.email && (
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            )}
          </div>

          {/* Menu Items */}
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-(--color-gold) transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          {/* Divider */}
          <hr className="border-gray-700 my-1" />

          {/* Logout */}
          <button
            onClick={() => {
              setIsOpen(false);
              setShowLogoutModal(true);
            }}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors duration-200"
          >
            <LogOutIcon className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={() => {
          setShowLogoutModal(false);
          onLogout();
        }}
        onCancel={() => setShowLogoutModal(false)}
        userName={user?.name || undefined}
      />
    </div>
  );
};

export default UserDropdown;
