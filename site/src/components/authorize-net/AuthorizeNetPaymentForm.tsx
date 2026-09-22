"use client";
import { useState, useEffect, ChangeEvent, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CreditCardIcons } from "@/components/icons";
import { TaxCalculator } from "../taxjar";
import { TaxCalculationResponse } from "../taxjar/TaxCalculator";

interface AuthorizeNetPaymentFormProps {
  sessionId: string;
  amount: number;
  courseTitle: string;
  paymentId: string;
}

declare global {
  interface Window {
    Accept: any;
  }
}

export default function AuthorizeNetPaymentForm({
  sessionId,
  amount,
  courseTitle,
  paymentId,
}: AuthorizeNetPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [taxData, setTaxData] = useState<TaxCalculationResponse>();
  const onTaxCalculated = useCallback((taxData: TaxCalculationResponse) => {
    setTaxData(taxData);
  }, []);
  const router = useRouter();
  // ✅ Add state for address fields
  const [addressData, setAddressData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  // ✅ Handle input change to update state
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setAddressData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    // Load Accept.js script
    const script = document.createElement("script");
    script.src =
      process.env.NEXT_PUBLIC_ACCEPT_JS_SCRIPT ||
      "https://js.authorize.net/v1/Accept.js";

    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!scriptLoaded || !window.Accept) {
      setError("Payment system not loaded. Please refresh and try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const cardData = {
      cardNumber: formData.get("cardNumber") as string,
      month: formData.get("expMonth") as string,
      year: formData.get("expYear") as string,
      cardCode: formData.get("cvv") as string,
    };

    const authData = {
      clientKey: process.env.NEXT_PUBLIC_AUTHORIZENET_CLIENT_KEY,
      apiLoginID: process.env.NEXT_PUBLIC_AUTHORIZENET_API_LOGIN_ID,
    };

    const secureData = {
      authData: authData,
      cardData: cardData,
    };

    window.Accept.dispatchData(secureData, (response: any) => {
      if (response.messages.resultCode === "Error") {
        setError(response.messages.message[0].text);
        setIsLoading(false);
        return;
      }
      // Process payment with token
      processPayment(response.opaqueData, formData);
    });
  };

  const processPayment = async (opaqueData: any, formData: FormData) => {
    try {
      const response = await fetch("/api/authorize-net/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          opaqueData,
          taxAmount: taxData?.taxAmount,
          billingInfo: {
            firstName: formData.get("firstName"),
            lastName: formData.get("lastName"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            address: formData.get("address"),
            city: formData.get("city"),
            state: formData.get("state"),
            zip: formData.get("zip"),
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTimeout(() => {
          router.push(`/courses/${result.courseId}?success=true`);
        }, 1000);
      } else {
        setError(result.error || "Payment failed. Please try again.");
      }
    } catch (err) {
      setError("Payment processing failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const items = useMemo(
    () => [
      {
        id: paymentId,
        description: "Cannabis Cultivation Course",
        quantity: 1,
        unitPrice: amount,
        type: "course" as const,
      },
    ],
    [amount, paymentId]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            required
            value={addressData.firstName}
            onChange={handleChange}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-(--color-gold) text-sm sm:text-base"
            placeholder="John"
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            required
            value={addressData.lastName}
            onChange={handleChange}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-(--color-gold) text-sm sm:text-base"
            placeholder="Doe"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          value={addressData.email}
          onChange={handleChange}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-(--color-gold) text-sm sm:text-base"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          name="phone"
          required
          value={addressData.phone}
          onChange={handleChange}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-(--color-gold) text-sm sm:text-base"
          placeholder="(555) 123-4567"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
          Card Number
        </label>
        <div className="relative">
          <input
            type="text"
            name="cardNumber"
            required
            maxLength={19}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-16 sm:pr-20 lg:pr-28 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-(--color-gold) text-sm sm:text-base"
            placeholder="1234 5678 9012 3456"
          />
          <div className="absolute right-0 sm:right-3 top-1/2 transform -translate-y-1/2">
            <CreditCardIcons className="scale-50 sm:scale-65 lg:scale-75" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
            Month
          </label>
          <select
            name="expMonth"
            required
            className="w-full px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-(--color-gold) appearance-none cursor-pointer text-sm sm:text-base"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 0.5rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1em 1em",
            }}
          >
            <option value="">MM</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option
                key={i + 1}
                value={String(i + 1).padStart(2, "0")}
                className="bg-gray-800"
              >
                {String(i + 1).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
            Year
          </label>
          <select
            name="expYear"
            required
            className="w-full px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-(--color-gold) appearance-none cursor-pointer text-sm sm:text-base"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 0.5rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1em 1em",
            }}
          >
            <option value="">YYYY</option>
            {Array.from({ length: 10 }, (_, i) => {
              const year = new Date().getFullYear() + i;
              return (
                <option key={year} value={year} className="bg-gray-800">
                  {year}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
            CVV
          </label>
          <input
            type="password"
            name="cvv"
            required
            maxLength={4}
            className="w-full px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-(--color-gold) text-sm sm:text-base"
            placeholder="***"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
          Address
        </label>
        <input
          type="text"
          name="address"
          value={addressData.address}
          onChange={handleChange}
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-(--color-gold) text-sm sm:text-base"
          placeholder="123 Main St"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 sm:gap-4">
        <div className="sm:col-span-3">
          <label className="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
            City
          </label>
          <input
            type="text"
            name="city"
            value={addressData.city}
            onChange={handleChange}
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-(--color-gold) text-sm sm:text-base"
            placeholder="New York"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
            State
          </label>
          <input
            type="text"
            name="state"
            value={addressData.state}
            onChange={handleChange}
            required
            maxLength={2}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-(--color-gold) text-sm sm:text-base"
            placeholder="NY"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
            ZIP Code
          </label>
          <input
            type="text"
            name="zip"
            value={addressData.zip}
            onChange={handleChange}
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-(--color-gold) text-sm sm:text-base"
            placeholder="10001"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-xs sm:text-sm">{error}</p>
        </div>
      )}
      <TaxCalculator
        billingAddress={addressData}
        items={items}
        amount={amount}
        onTaxCalculated={onTaxCalculated}
      />
      <button
        type="submit"
        disabled={isLoading || !scriptLoaded}
        className="w-full bg-(--color-gold) text-black py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-(--color-gold)/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-black"></div>
            <span className="text-sm sm:text-base">Processing Payment...</span>
          </div>
        ) : taxData?.taxAmount ? (
          `Pay $${((taxData?.taxAmount + amount) / 100).toFixed(2)}`
        ) : (
          `Pay $${(+amount / 100).toFixed(2)}`
        )}
      </button>

      <div className="space-y-3 sm:space-y-4">
        <div className="text-center text-xs sm:text-sm text-white/60">
          <p>🔒 Your payment information is secure and encrypted</p>
        </div>

        <div className="text-center text-xs text-white/50">
          <p className="mb-2">By completing your purchase, you agree to our:</p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[--color-gold] hover:text-[--color-gold]/80 underline transition-colors"
            >
              Terms & Conditions
            </a>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[--color-gold] hover:text-[--color-gold]/80 underline transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/refund"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[--color-gold] hover:text-[--color-gold]/80 underline transition-colors"
            >
              Refund Policy
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}
