"use client";
import { useState } from "react";
import AuthorizeNetPaymentForm from "./AuthorizeNetPaymentForm";
import GooglePayForm from "./GooglePayForm";
import { GooglePayIcon, CardIcon } from "@/components/icons";
import ApplePayIcon from "../icons/ApplePayIcon";
import ApplePayForm from "./ApplePayForm";

interface PaymentMethodSelectorProps {
  sessionId: string;
  amount: number;
  courseTitle: string;
  paymentId: string;
}

type PaymentMethod = "card" | "google-pay" | "apple-pay";

export default function PaymentMethodSelector({
  sessionId,
  amount,
  courseTitle,
  paymentId,
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Choose Payment Method
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Credit Card Option */}
          <button
            onClick={() => setSelectedMethod("card")}
            className={`group relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
              selectedMethod === "card"
                ? "border-[var(--color-gold)] bg-gradient-to-br from-[var(--color-gold)]/20 to-[var(--color-gold)]/5 shadow-lg shadow-[var(--color-gold)]/20"
                : "border-white/20 bg-gradient-to-br from-white/10 to-white/5 hover:border-[var(--color-gold)]/50 hover:shadow-md"
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <CardIcon size={32} className="text-white" />
              </div>
              <div className="text-center">
                <h4 className="text-white font-semibold text-base">
                  Credit/Debit Card
                </h4>
                <p className="text-white/60 text-sm mt-1">
                  Visa, Mastercard, Amex
                </p>
              </div>
              {selectedMethod === "card" && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-[var(--color-gold)] rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-black"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </button>

          {/* Google Pay Option */}
          <button
            onClick={() => setSelectedMethod("google-pay")}
            className={`group relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
              selectedMethod === "google-pay"
                ? "border-[var(--color-gold)] bg-gradient-to-br from-[var(--color-gold)]/20 to-[var(--color-gold)]/5 shadow-lg shadow-[var(--color-gold)]/20"
                : "border-white/20 bg-gradient-to-br from-white/10 to-white/5 hover:border-[var(--color-gold)]/50 hover:shadow-md"
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <GooglePayIcon size={40} />
              </div>
              <div className="text-center">
                <h4 className="text-white font-semibold text-base">
                  Google Pay
                </h4>
                <p className="text-white/60 text-sm mt-1">
                  Quick & secure payment
                </p>
              </div>
              {selectedMethod === "google-pay" && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-[var(--color-gold)] rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-black"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </button>
          {/* Apple Pay Option */}
          <button
            onClick={() => setSelectedMethod("apple-pay")}
            className={`group relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
              selectedMethod === "apple-pay"
                ? "border-[var(--color-gold)] bg-gradient-to-br from-[var(--color-gold)]/20 to-[var(--color-gold)]/5 shadow-lg shadow-[var(--color-gold)]/20"
                : "border-white/20 bg-gradient-to-br from-white/10 to-white/5 hover:border-[var(--color-gold)]/50 hover:shadow-md"
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <ApplePayIcon size={40} />
              </div>
              <div className="text-center">
                <h4 className="text-white font-semibold text-base">
                  Apple Pay
                </h4>
                <p className="text-white/60 text-sm mt-1">Pay with Touch ID</p>
              </div>
              {selectedMethod === "apple-pay" && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-[var(--color-gold)] rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-black"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Payment Form */}
      <div className="mt-8">
        {selectedMethod === "card" ? (
          <AuthorizeNetPaymentForm
            sessionId={sessionId}
            amount={amount}
            courseTitle={courseTitle}
            paymentId={paymentId}
          />
        ) : selectedMethod === "google-pay" ? (
          <GooglePayForm
            sessionId={sessionId}
            amount={amount}
            courseTitle={courseTitle}
            paymentId={paymentId}
          />
        ) : (
          <ApplePayForm
            sessionId={sessionId}
            amount={amount}
            courseTitle={courseTitle}
            paymentId={paymentId}
          />
        )}
      </div>
    </div>
  );
}
