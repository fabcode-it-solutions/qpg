"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import CustomButton from "@/components/common/CustomButton";
import Image from "next/image";
import HamburgerIcon from "../../public/icons/HamburgerIcon";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import UserDropdown from "@/components/ui/UserDropdown";
import { LogOutIcon } from "@/components/icons";
import { BookOpen, Hospital, LayoutDashboard, User } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { performCompleteLogout } from "@/lib/utils/logout";
import { useToastContext } from "@/components/providers/ToastProvider";

// Separate component for navigation links to isolate pathname re-renders
const NavLinks = React.memo(() => {
  const pathname = usePathname();
  const navItems = [
    { title: "Home", href: "/" },
    { title: "About Us", href: "/about" },
    { title: "Videos", href: "/videos" },
    { title: "Blog", href: "/blog" },
    { title: "Contact Us", href: "/contact" },
    { title: "Plant Clinic", href: "/plant-clinic" },
  ];
  const [show, setShow] = React.useState(false);
  const checkoutAccess = useCallback(async () => {
    const response = await fetch("/api/dashboard");

    const data = await response.json();
    if (response.ok) {
      if (data.courses.length > 0) {
        setShow(true);
      }
    }
  }, []);
  useEffect(() => {
    checkoutAccess();
  }, [checkoutAccess]);
  return (
    <nav className="hidden lg:flex flex-1 justify-center gap-[40px]">
      {navItems.map((item) =>
        !show && item.title === "Plant Clinic" ? null : (
          <Link
            key={item.title}
            href={item.href}
            className={`text-sm xl:text-[20px] font-medium transition-all duration-300 hover:text-(--color-gold) ${
              pathname === item.href ? "border-b-2 border-(--color-gold)" : ""
            }`}
          >
            {item.title}
          </Link>
        )
      )}
    </nav>
  );
});
NavLinks.displayName = "NavLinks";

interface NavbarProps {
  sessionData: {
    isLoading: boolean;
    user: any;
    isAuthenticated: boolean;
  };
}

const Navbar = React.memo(({ sessionData }: NavbarProps) => {
  const [smallNavOpen, setSmallNavOpen] = useState(false);
  const { success } = useToastContext();

  // Static nav items for mobile menu
  const navItems = [
    { title: "Home", href: "/" },
    { title: "About Us", href: "/about" },
    { title: "Videos", href: "/videos" },
    { title: "Blog", href: "/blog" },
    { title: "Contact Us", href: "/contact" },
    { title: "Plant Clinic", href: "/plant-clinic" },
  ];

  // Memoize logout handler
  const handleLogout = useCallback(async () => {
    await performCompleteLogout(async () => {
      // Small delay to show toast before redirect
      setTimeout(async () => {
        success("Logged Out", "You have been successfully logged out.");
        await signOut({
          callbackUrl: "/",
          redirect: true,
        });
      }, 1000);
    });
  }, [success]);

  useEffect(() => {
    document.body.style.overflow = smallNavOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [smallNavOpen]);
  const [show, setShow] = React.useState(false);
  const checkoutAccess = useCallback(async () => {
    const response = await fetch("/api/dashboard");

    const data = await response.json();
    if (response.ok) {
      if (data.courses.length > 0) {
        setShow(true);
      }
    }
  }, []);
  useEffect(() => {
    checkoutAccess();
  }, [checkoutAccess]);
  return (
    <>
      {/* Top Navbar */}
      <div className="w-full py-4 z-[999] flex justify-center bg-black transition-all duration-500">
        <div className="relative w-full max-w-[1760px] h-[60px] xl:h-[80px] 2xl:h-[130px] px-6 mx-auto flex items-center justify-between text-white">
          {/* Left: Logo */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link href="/">
              <div className="h-[60px] w-[60px] md:h-[80px] md:w-[80px] xl:h-[100px] xl:w-[124px] 2xl:h-[130px] 2xl:w-[135px]">
                <Image
                  height={130}
                  width={135}
                  alt="QPG logo"
                  src="/images/qpg-logo-gold.png"
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Center: Nav Links */}
          <NavLinks />

          {/* Right: Login / Hamburger */}
          <div className="flex items-center gap-4">
            {/* Desktop: Login/Logout */}
            <div className="hidden lg:flex items-center gap-4">
              {sessionData.isLoading ? (
                <div className="text-sm xl:text-xl">Loading...</div>
              ) : sessionData.isAuthenticated ? (
                <UserDropdown
                  user={sessionData.user}
                  onLogout={handleLogout}
                  className="hidden lg:block"
                />
              ) : (
                <CustomButton
                  as="a"
                  href="/auth/login"
                  className={cn(
                    "text-sm xl:text-[20px] uppercase !py-[18px] !px-[39px] font-medium leading-[normal]",
                    "border border-(--color-gold) text-(--color-gold)",
                    "!rounded-[50px] hover:bg-(--color-gold) hover:text-black transition"
                  )}
                >
                  Login
                </CustomButton>
              )}
            </div>

            {/* Mobile: Hamburger */}
            <button
              className="lg:hidden flex z-50"
              onClick={() => setSmallNavOpen(!smallNavOpen)}
            >
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] transition-opacity duration-300 ${
              smallNavOpen ? "opacity-100 visible" : "opacity-0 invisible"
            }`}
            onClick={() => setSmallNavOpen(false)}
          />

          {/* Sidebar */}
          <div
            className={`fixed top-0 left-0 h-full w-[90%] overflow-scroll max-w-[370px] bg-black z-[99999] p-6 pt-10 transition-transform duration-300 ${
              smallNavOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <button
              className="absolute top-5 right-5 text-white text-3xl"
              onClick={() => setSmallNavOpen(false)}
            >
              ×
            </button>
            <nav className="flex flex-col mt-6 gap-6 text-white text-[20px]">
              {navItems.map((item) =>
                !show && item.title === "Plant Clinic" ? null : (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="uppercase transition-colors py-2"
                    onClick={() => setSmallNavOpen(false)}
                  >
                    {item.title}
                  </Link>
                )
              )}
              {sessionData.isLoading ? (
                <div className="text-white mt-4 px-2">Loading...</div>
              ) : sessionData.isAuthenticated ? (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  {/* User Info */}
                  <div className="px-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-(--color-gold) text-black flex items-center justify-center text-sm font-semibold">
                        {sessionData.user?.image ? (
                          <img
                            src={sessionData.user.image}
                            alt={
                              sessionData.user?.name ||
                              sessionData.user?.email ||
                              "User"
                            }
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          (
                            sessionData.user?.name ||
                            sessionData.user?.email ||
                            "U"
                          )
                            .split(" ")
                            .map((n: any) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {sessionData.user?.name || sessionData.user?.email}
                        </p>
                        {sessionData.user?.email && sessionData.user?.name && (
                          <p className="text-gray-400 text-xs">
                            {sessionData.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-1">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-2 py-2 text-gray-300 hover:text-(--color-gold) hover:bg-gray-800 rounded transition-colors"
                      onClick={() => setSmallNavOpen(false)}
                    >
                      <LayoutDashboard />
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-2 py-2 text-gray-300 hover:text-(--color-gold) hover:bg-gray-800 rounded transition-colors"
                      onClick={() => setSmallNavOpen(false)}
                    >
                      <User />
                      Profile
                    </Link>
                    <Link
                      href="/courses"
                      className="flex items-center gap-3 px-2 py-2 text-gray-300 hover:text-(--color-gold) hover:bg-gray-800 rounded transition-colors"
                      onClick={() => setSmallNavOpen(false)}
                    >
                      <BookOpen />
                      Courses
                    </Link>
                    <Link
                      href="/plant-clinic"
                      className="flex items-center gap-3 px-2 py-2 text-gray-300 hover:text-(--color-gold) hover:bg-gray-800 rounded transition-colors"
                      onClick={() => setSmallNavOpen(false)}
                    >
                      <Hospital />
                      Plant Clinic
                    </Link>

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        setSmallNavOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 w-full px-2 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors mt-4"
                    >
                      <LogOutIcon className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <CustomButton
                  as="a"
                  href="/auth/login"
                  className="uppercase w-min !rounded-[50px] px-6 border border-(--color-gold) text-(--color-gold) hover:bg-(--color-gold) hover:text-black mt-4"
                  onClick={() => setSmallNavOpen(false)}
                >
                  Login
                </CustomButton>
              )}
            </nav>
          </div>
        </>
      }
    </>
  );
});

// Wrapper component that handles session logic
const NavbarWithSession = () => {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sessionData = {
    isLoading: status === "loading" || !mounted,
    user: session?.user || undefined,
    isAuthenticated: !!session,
  };

  return <Navbar sessionData={sessionData} />;
};

export default NavbarWithSession;

// Add display name for debugging
Navbar.displayName = "Navbar";
NavbarWithSession.displayName = "NavbarWithSession";
