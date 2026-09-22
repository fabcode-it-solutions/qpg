"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TaxCalculator } from "../taxjar";
import { TaxCalculationResponse } from "../taxjar/TaxCalculator";

interface ApplePayFormProps {
  sessionId: string;
  amount: number;
  courseTitle: string;
  paymentId: string;
}

// Extend Window interface for Apple Pay
declare global {
  interface Window {
    ApplePaySession?: {
      new (version: number, request: any): ApplePaySession;
      canMakePayments(): boolean;
      supportsVersion(version: number): boolean;
      STATUS_SUCCESS: number;
      STATUS_FAILURE: number;
    };
  }
}

interface ApplePaySession {
  begin(): void;
  abort(): void;
  completeMerchantValidation(merchantSession: any): void;
  completePayment(result: number): void;
  onvalidatemerchant: ((event: any) => void) | null;
  onpaymentauthorized: ((event: any) => void) | null;
  oncancel: (() => void) | null;
}

export default function ApplePayForm({
  sessionId,
  amount,
  courseTitle,
  paymentId,
}: ApplePayFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  const [taxData, setTaxData] = useState<TaxCalculationResponse>();
  const router = useRouter();

  // Items for tax calculation
  const items = useMemo(
    () => [
      {
        id: paymentId,
        description: courseTitle,
        quantity: 1,
        unitPrice: amount,
        type: "course" as const,
      },
    ],
    [amount, paymentId, courseTitle]
  );
  const billingAddress = useMemo(() => {
    return {
      ...billingInfo,
      country: "US",
    };
  }, [billingInfo]);
  const onTaxCalculated = useCallback((taxData: TaxCalculationResponse) => {
    setTaxData(taxData);
  }, []);

  // Check if Apple Pay is available
  useEffect(() => {
    if (window.ApplePaySession) {
      const canMakePayments = window.ApplePaySession.canMakePayments();
      setApplePayAvailable(canMakePayments);

      if (!canMakePayments) {
        setError(
          "Apple Pay is not available on this device or browser. Please use Safari on iOS/macOS."
        );
      }
    } else {
      setError(
        "Apple Pay is not supported in this browser. Please use Safari."
      );
    }
  }, []);

  const handleBillingInfoChange = (field: string, value: string) => {
    setBillingInfo((prev) => ({ ...prev, [field]: value }));
  };

  const isBillingInfoComplete = () => {
    return Object.values(billingInfo).every((value) => value.trim() !== "");
  };

  const handleApplePayClick = async () => {
    if (!isBillingInfoComplete()) {
      setError("Please fill in all billing information fields");
      return;
    }

    if (!window.ApplePaySession) {
      setError("Apple Pay is not available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Calculate final amount with tax
      const finalAmount = taxData ? amount + taxData.taxAmount : amount / 100;

      // Apple Pay payment request
      const paymentRequest = {
        countryCode: "US",
        currencyCode: "USD",
        merchantCapabilities: ["supports3DS"],
        supportedNetworks: ["visa", "masterCard", "amex", "discover"],
        total: {
          label: courseTitle,
          amount: finalAmount.toFixed(2),
          type: "final" as const,
        },
        lineItems: taxData
          ? [
              {
                label: "Course Access",
                amount: (amount / 100).toFixed(2),
                type: "final" as const,
              },
              {
                label: "Tax",
                amount: (taxData.taxAmount / 100).toFixed(2),
                type: "final" as const,
              },
            ]
          : [],
      };

      // Create Apple Pay session
      const session = new window.ApplePaySession(3, paymentRequest);

      // Handle merchant validation
      session.onvalidatemerchant = async (event) => {
        try {
          const response = await fetch("/api/apple-pay/validate-merchant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              validationURL: event.validationURL,
            }),
          });

          if (!response.ok) {
            throw new Error("Merchant validation failed");
          }

          const merchantSession = await response.json();
          session.completeMerchantValidation(merchantSession);
        } catch (error) {
          console.error("Merchant validation error:", error);
          session.abort();
          setError("Merchant validation failed. Please try again.");
          setIsLoading(false);
        }
      };

      // Handle payment authorization
      session.onpaymentauthorized = async (event) => {
        const payment = event.payment;

        try {
          // Process payment with Authorize.Net
          const response = await fetch("/api/authorize-net/process-apple-pay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              applePayData: {
                opaqueDataDescriptor: "COMMON.APPLE.INAPP.PAYMENT",
                opaqueDataValue: btoa(
                  JSON.stringify(payment.token.paymentData)
                ),
              },
              billingInfo: {
                firstName: billingInfo.firstName,
                lastName: billingInfo.lastName,
                email: billingInfo.email,
                phone: billingInfo.phone,
                address: billingInfo.address,
                city: billingInfo.city,
                state: billingInfo.state,
                zip: billingInfo.zip,
                country: "US",
              },
              taxAmount: taxData ? taxData.taxAmount : 0,
            }),
          });

          const result = await response.json();

          if (result.success) {
            session.completePayment(window.ApplePaySession!.STATUS_SUCCESS);

            // Redirect to success page
            setTimeout(() => {
              router.push(
                `/payment/success?session=${sessionId}&transaction=${result.transactionId}`
              );
            }, 1000);
          } else {
            session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
            setError(result.error || "Payment failed");
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Payment processing error:", error);
          session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
          setError("Payment processing failed. Please try again.");
          setIsLoading(false);
        }
      };

      // Handle cancellation
      session.oncancel = () => {
        setIsLoading(false);
        setError("Payment was cancelled");
      };

      // Start the session
      session.begin();
    } catch (error) {
      console.error("Apple Pay error:", error);
      setError("Failed to start Apple Pay. Please try again.");
      setIsLoading(false);
    }
  };

  if (!applePayAvailable) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6">
        <h3 className="text-red-400 font-semibold mb-2">
          Apple Pay Not Available
        </h3>
        <p className="text-white/70 text-sm">
          {error ||
            "Apple Pay is not available on this device. Please use Safari on an iPhone, iPad, or Mac, or choose another payment method."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Billing Information Form */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">
          Billing Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              First Name
            </label>
            <input
              type="text"
              value={billingInfo.firstName}
              onChange={(e) =>
                handleBillingInfoChange("firstName", e.target.value)
              }
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[var(--color-gold)]"
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={billingInfo.lastName}
              onChange={(e) =>
                handleBillingInfoChange("lastName", e.target.value)
              }
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[var(--color-gold)]"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Email
          </label>
          <input
            type="email"
            value={billingInfo.email}
            onChange={(e) => handleBillingInfoChange("email", e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[var(--color-gold)]"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={billingInfo.phone}
            onChange={(e) => handleBillingInfoChange("phone", e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[var(--color-gold)]"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Address
          </label>
          <input
            type="text"
            value={billingInfo.address}
            onChange={(e) => handleBillingInfoChange("address", e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[var(--color-gold)]"
            placeholder="123 Main St"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              City
            </label>
            <input
              type="text"
              value={billingInfo.city}
              onChange={(e) => handleBillingInfoChange("city", e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[var(--color-gold)]"
              placeholder="San Francisco"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              State
            </label>
            <input
              type="text"
              value={billingInfo.state}
              onChange={(e) => handleBillingInfoChange("state", e.target.value)}
              required
              maxLength={2}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[var(--color-gold)] uppercase"
              placeholder="CA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              value={billingInfo.zip}
              onChange={(e) => handleBillingInfoChange("zip", e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[var(--color-gold)]"
              placeholder="94102"
            />
          </div>
        </div>
      </div>

      {/* Tax Calculator */}
      <TaxCalculator
        items={items}
        amount={amount}
        billingAddress={billingAddress}
        onTaxCalculated={onTaxCalculated}
      />

      {/* Apple Pay Button */}
      <div className="pt-4">
        <button
          onClick={handleApplePayClick}
          disabled={isLoading || !isBillingInfoComplete()}
          className="w-full apple-pay-button apple-pay-button-black"
          style={{
            WebkitAppearance: "-apple-pay-button",
            height: "48px",
            borderRadius: "8px",
            cursor:
              isLoading || !isBillingInfoComplete() ? "not-allowed" : "pointer",
            opacity: isLoading || !isBillingInfoComplete() ? 0.5 : 1,
          }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 text-white mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : null}
        </button>

        {!isBillingInfoComplete() && (
          <p className="text-white/50 text-xs text-center mt-2">
            Please fill in all billing information to continue
          </p>
        )}
      </div>

      {/* Security Note */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <p className="text-white/70 text-xs text-center">
          🔒 Your payment is secured by Apple Pay and Authorize.Net. Your card
          information is never stored on our servers.
        </p>
      </div>
    </div>
  );
}
