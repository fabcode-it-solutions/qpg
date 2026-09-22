"use client";
import React, { useState, useEffect } from "react";
import { BillingAddress, OrderItem } from "@/lib/taxjar";

interface TaxCalculatorProps {
  billingAddress: BillingAddress;
  items: OrderItem[];
  shipping?: number;
  onTaxCalculated?: (taxData: TaxCalculationResponse) => void;
  onError?: (error: string) => void;
  amount: number;
}

export interface TaxCalculationResponse {
  success: boolean;
  taxAmount: number;
  taxRate: number;
  taxableAmount: number;
  hasNexus: boolean;
  message?: string;
}

function TaxCalculator({
  billingAddress,
  items,
  shipping = 0,
  onTaxCalculated,
  onError,
  amount,
}: TaxCalculatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [taxData, setTaxData] = useState<TaxCalculationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateTax = async () => {
    if (!billingAddress || !items.length) {
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const response = await fetch("/api/taxjar/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billingAddress,
          items,
          shipping,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Tax calculation failed");
      }

      setTaxData(result);
      onTaxCalculated?.(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Tax calculation failed";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  };

  // Auto-calculate when dependencies change
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateTax();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [billingAddress, items, shipping]);

  const formatCurrency = (amountInCents: number) => {
    return (amountInCents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const formatPercentage = (rate: number) => {
    return (rate * 100).toFixed(2) + "%";
  };

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (isCalculating) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--color-gold)]"></div>
          <span className="text-white/70 text-sm">Calculating tax...</span>
        </div>
      </div>
    );
  }

  if (!taxData) {
    return null;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
      <h3 className="text-white font-semibold text-sm">Tax Calculation</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-white/70">Taxable Amount:</span>
          <span className="text-white">{formatCurrency(amount)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-white/70">Tax Rate:</span>
          <span className="text-white">
            {formatPercentage(taxData.taxRate)}
          </span>
        </div>

        <div className="flex justify-between items-center font-semibold">
          <span className="text-white">Sales Tax:</span>
          <span className="text-[var(--color-gold)]">
            {formatCurrency(taxData.taxAmount)}
          </span>
        </div>
        <div className="flex justify-between items-center font-semibold text-base">
          <span className="text-white">Subtotal:</span>
          <span className="text-[var(--color-gold)]">
            {formatCurrency(amount + taxData.taxAmount)}
          </span>
        </div>

        {taxData.hasNexus && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <svg
              className="w-4 h-4 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green-400 text-xs">
              Tax nexus established
            </span>
          </div>
        )}

        {taxData.message && (
          <div className="text-white/60 text-xs pt-2 border-t border-white/10">
            {taxData.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(TaxCalculator);
