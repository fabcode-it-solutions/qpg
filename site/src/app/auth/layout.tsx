"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determine branding content based on route
  const getBrandingContent = () => {
    switch (pathname) {
      case "/auth/login":
        return {
          title: "Welcome to QPG",
          description:
            "Your gateway to premium quantum plant genetics knowledge and courses.",
        };
      case "/auth/register":
        return {
          title: "Join QPG Community",
          description:
            "Start your journey into premium quantum plant genetics with exclusive access to expert knowledge and advanced courses.",
        };
      case "/auth/forgot-password":
        return {
          title: "Reset Your Password",
          description:
            "Don't worry, we'll help you get back to your quantum plant genetics journey in no time.",
        };
      case "/auth/reset-password":
        return {
          title: "Create New Password",
          description:
            "You're just one step away from regaining access to your QPG account.",
        };
      default:
        return {
          title: "QPG Authentication",
          description:
            "Secure access to premium quantum plant genetics content.",
        };
    }
  };

  const branding = getBrandingContent();

  return (
    <div className="min-h-screen bg-black flex overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-(--color-gold)/10 via-transparent to-(--color-gold)/5"></div>
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-(--color-gold)/20 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-(--color-gold)/20 to-transparent"></div>
      </div>

      {/* Left Side - Logo & Branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:items-center lg:px-12 lg:py-12 relative">
        <div className="max-w-lg text-center relative z-10">
          {/* Decorative Elements */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-(--color-gold)/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-(--color-gold)/3 rounded-full blur-3xl"></div>

          <div className="mb-12">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-(--color-gold)/10 rounded-full blur-2xl transform scale-110"></div>
              <div className="h-32 w-32 mx-auto mb-6 relative">
                <Image
                  height={128}
                  width={128}
                  alt="QPG logo"
                  src="/images/qpg-logo-gold.png"
                  className="w-full h-full object-contain relative z-10"
                  priority
                />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-(--color-gold) mb-6 leading-tight">
              {branding.title}
            </h1>
            <p className="text-xl text-white/70 leading-relaxed mb-8">
              {branding.description}
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-(--color-gold) rounded-full"></div>
                <span className="text-white/60">Premium course content</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-(--color-gold) rounded-full"></div>
                <span className="text-white/60">Expert-led instruction</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Golden Vertical Divider */}
      <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-(--color-gold)/50 to-transparent transform -translate-x-1/2 z-20">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 bg-(--color-gold) rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-12 lg:py-8 relative">
        {/* Mobile Logo */}
        <div className="lg:hidden text-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-(--color-gold)/20 rounded-full blur-xl"></div>
            <div className="h-20 w-20 mx-auto relative">
              <Image
                height={80}
                width={80}
                alt="QPG logo"
                src="/images/qpg-logo-gold.png"
                className="w-full h-full object-contain relative z-10"
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-(--color-gold) mb-2">
            {branding.title}
          </h2>
          <p className="text-white/70 text-sm">{branding.description}</p>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-lg mx-auto mb-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl relative">
            {/* Form decorative elements */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-20 h-px bg-gradient-to-r from-transparent via-(--color-gold)/50 to-transparent"></div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-20 h-px bg-gradient-to-r from-transparent via-(--color-gold)/50 to-transparent"></div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
