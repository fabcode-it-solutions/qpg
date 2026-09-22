"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TaxCalculator } from "../taxjar";
import { TaxCalculationResponse } from "../taxjar/TaxCalculator";

interface GooglePayFormProps {
  sessionId: string;
  amount: number;
  courseTitle: string;
  paymentId: string;
}

declare global {
  interface Window {
    google?: {
      payments: {
        api: {
          PaymentsClient: new (config: any) => any;
        };
      };
    };
  }
}

export default function GooglePayForm({
  sessionId,
  amount,
  courseTitle,
  paymentId,
}: GooglePayFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googlePayReady, setGooglePayReady] = useState(false);
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
  const paymentsClient = useRef<any>(null);
  const router = useRouter();

  // Google Pay configuration
  const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
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
  const allowedCardNetworks = ["AMEX", "DISCOVER", "MASTERCARD", "VISA"];
  const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];
  const [taxData, setTaxData] = useState<TaxCalculationResponse>();
  const onTaxCalculated = useCallback((taxData: TaxCalculationResponse) => {
    setTaxData(taxData);
  }, []);
  const tokenizationSpecification = {
    type: "PAYMENT_GATEWAY",
    parameters: {
      gateway: "authorizenet",
      gatewayMerchantId:
        process.env.NEXT_PUBLIC_AUTHORIZENET_GATEWAY_ID_GPAY?.toString(),
    },
  };

  const baseCardPaymentMethod = {
    type: "CARD",
    parameters: {
      allowedAuthMethods: allowedCardAuthMethods,
      allowedCardNetworks: allowedCardNetworks,
    },
  };

  const cardPaymentMethod = {
    ...baseCardPaymentMethod,
    tokenizationSpecification: tokenizationSpecification,
  };

  useEffect(() => {
    const loadGooglePayScript = () => {
      if (window.google?.payments?.api) {
        initializeGooglePay();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://pay.google.com/gp/p/js/pay.js";
      script.onload = () => {
        initializeGooglePay();
      };
      script.onerror = () => {
        setError("Failed to load Google Pay. Please try again.");
      };
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    };

    loadGooglePayScript();
  }, []);

  const initializeGooglePay = async () => {
    try {
      if (!window.google?.payments?.api) {
        throw new Error("Google Pay API not available");
      }

      paymentsClient.current = new window.google.payments.api.PaymentsClient({
        environment:
          process.env.NODE_ENV === "development" ? "TEST" : "PRODUCTION",
        paymentDataCallbacks: {
          onPaymentAuthorized: (paymentData: any) => {
            return new Promise((resolve) => {
              resolve({ transactionState: "SUCCESS" });
            });
          },
        },
      });

      // Check if Google Pay is available
      const isReadyToPayRequest = {
        ...baseRequest,
        allowedPaymentMethods: [baseCardPaymentMethod],
      };

      const response = await paymentsClient.current.isReadyToPay(
        isReadyToPayRequest
      );
      if (response.result) {
        setGooglePayReady(true);
      } else {
        setError("Google Pay is not available on this device/browser.");
      }
    } catch (err) {
      console.error("Google Pay initialization error:", err);
      setError(
        "Failed to initialize Google Pay. Please try credit card payment."
      );
    }
  };

  const handleBillingInfoChange = (field: string, value: string) => {
    setBillingInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateBillingInfo = () => {
    const required = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zip",
    ];
    for (const field of required) {
      if (!billingInfo[field as keyof typeof billingInfo].trim()) {
        setError(
          `Please fill in your ${field
            .replace(/([A-Z])/g, " $1")
            .toLowerCase()}.`
        );
        return false;
      }
    }
    return true;
  };

  const handleGooglePayClick = async () => {
    if (!validateBillingInfo()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const paymentDataRequest = {
        ...baseRequest,
        allowedPaymentMethods: [cardPaymentMethod],
        transactionInfo: {
          totalPriceStatus: "FINAL",
          totalPriceLabel: "Total",
          totalPrice: taxData?.taxAmount
            ? ((taxData?.taxAmount + amount) / 100).toFixed(2)
            : (amount / 100).toFixed(2),
          currencyCode: "USD",
          countryCode: "US",
        },
        merchantInfo: {
          merchantName: "QP Growers",
          merchantId:
            process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID ||
            "12345678901234567890",
        },
        callbackIntents: ["PAYMENT_AUTHORIZATION"],
      };

      const paymentData = await paymentsClient.current.loadPaymentData(
        paymentDataRequest
      );

      // Process the payment
      await processGooglePayPayment(paymentData);
    } catch (err: any) {
      console.error("Google Pay error:", err);
      if (err.statusCode === "CANCELED") {
        setError("Payment was cancelled. Please try again.");
      } else {
        setError(
          "Google Pay payment failed. Please try again or use credit card."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const processGooglePayPayment = async (paymentData: any) => {
    try {
      console.log({ paymentData });

      const paymentToken = paymentData.paymentMethodData.tokenizationData.token;

      // Base64 encode the token as required by Authorize.Net
      // const encodedToken = btoa(paymentToken);

      const response = await fetch("/api/authorize-net/process-google-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          googlePayData: {
            opaqueDataDescriptor: "COMMON.GOOGLE.INAPP.PAYMENT",
            opaqueDataValue: paymentToken,
          },
          taxAmount: taxData?.taxAmount,
          billingInfo,
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
      console.error("Payment processing error:", err);
      setError("Payment processing failed. Please try again.");
    }
  };

  if (!googlePayReady && !error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-gold)]"></div>
        <span className="ml-3 text-white">Loading Google Pay...</span>
      </div>
    );
  }

  if (error && !googlePayReady) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-red-400 text-sm">{error}</p>
        <p className="text-white/60 text-xs mt-2">
          Please use the credit card payment option instead.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            Phone Number
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

        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-white mb-2">
              City
            </label>
            <input
              type="text"
              value={billingInfo.city}
              onChange={(e) => handleBillingInfoChange("city", e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[var(--color-gold)]"
              placeholder="New York"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-white mb-2">
              State
            </label>
            <input
              type="text"
              value={billingInfo.state}
              onChange={(e) => handleBillingInfoChange("state", e.target.value)}
              required
              maxLength={2}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[var(--color-gold)]"
              placeholder="NY"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-white mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              value={billingInfo.zip}
              onChange={(e) => handleBillingInfoChange("zip", e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[var(--color-gold)]"
              placeholder="10001"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      <TaxCalculator
        billingAddress={billingInfo}
        onTaxCalculated={onTaxCalculated}
        items={items}
        amount={amount}
      />
      {/* Google Pay Button */}
      <button
        onClick={handleGooglePayClick}
        disabled={isLoading || !googlePayReady}
        className="w-full bg-black text-white py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/20 flex items-center justify-center gap-3"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing Payment...</span>
          </div>
        ) : (
          <>
            <svg
              width="41"
              height="17"
              viewBox="0 0 41 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.526 2.635v4.083h2.518c.6 0 1.096-.202 1.488-.605.403-.402.605-.882.605-1.438 0-.556-.202-1.036-.605-1.438-.392-.403-.888-.605-1.488-.605h-2.518zm0 5.52v4.736h-1.504V1.198h4.022c1.078 0 1.991.375 2.738 1.123.747.747 1.123 1.66 1.123 2.738 0 1.078-.376 1.991-1.123 2.738-.747.747-1.66 1.123-2.738 1.123h-2.518v.01zm11.502 4.736h-1.504V7.168c0-.537-.192-1.006-.576-1.391-.384-.384-.854-.576-1.391-.576-.537 0-1.006.192-1.391.576-.384.384-.576.854-.576 1.391v5.723h-1.504V7.168c0-1.078.375-1.991 1.123-2.738.747-.747 1.66-1.123 2.738-1.123s1.991.376 2.738 1.123c.747.747 1.123 1.66 1.123 2.738v5.723h.22zm6.25 0c-1.078 0-1.991-.375-2.738-1.123-.747-.747-1.123-1.66-1.123-2.738s.376-1.991 1.123-2.738c.747-.747 1.66-1.123 2.738-1.123s1.991.376 2.738 1.123c.747.747 1.123 1.66 1.123 2.738s-.376 1.991-1.123 2.738c-.747.747-1.66 1.123-2.738 1.123zm0-1.504c.537 0 1.006-.192 1.391-.576.384-.384.576-.854.576-1.391s-.192-1.006-.576-1.391c-.384-.384-.854-.576-1.391-.576s-1.006.192-1.391.576c-.384.384-.576.854-.576 1.391s.192 1.006.576 1.391c.384.384.854.576 1.391.576z"
                fill="white"
              />
              <path
                d="M3.194 7.168c0-1.078.375-1.991 1.123-2.738.747-.747 1.66-1.123 2.738-1.123.537 0 1.036.106 1.496.317.47.211.882.518 1.237.922l-1.062 1.062c-.537-.537-1.198-.806-1.981-.806-.537 0-1.006.192-1.391.576-.384.384-.576.854-.576 1.391s.192 1.006.576 1.391c.384.384.854.576 1.391.576.403 0 .767-.086 1.094-.259.326-.173.595-.413.806-.72h-1.9V6.362h3.404c.067.336.1.672.1 1.008 0 1.078-.375 1.991-1.123 2.738-.747.747-1.66 1.123-2.738 1.123-1.078 0-1.991-.375-2.738-1.123-.747-.747-1.123-1.66-1.123-2.738z"
                fill="white"
              />
            </svg>
            <span>
              {taxData?.taxAmount
                ? `Pay ${((taxData?.taxAmount + amount) / 100).toFixed(2)}`
                : `Pay ${(amount / 100).toFixed(2)}`}
            </span>
          </>
        )}
      </button>

      <div className="space-y-4">
        <div className="text-center text-sm text-white/60">
          <p>🔒 Your payment information is secure and encrypted</p>
        </div>

        <div className="text-center text-xs text-white/50">
          <p className="mb-2">By completing your purchase, you agree to our:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 underline transition-colors"
            >
              Terms & Conditions
            </a>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 underline transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/refund"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 underline transition-colors"
            >
              Refund Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
