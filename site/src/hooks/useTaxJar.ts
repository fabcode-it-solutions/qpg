"use client";
import { useState, useCallback } from 'react';
import { BillingAddress, OrderItem } from '@/lib/taxjar';

interface TaxCalculationResult {
  success: boolean;
  taxAmount: number;
  taxRate: number;
  taxableAmount: number;
  hasNexus: boolean;
  message?: string;
}

interface OrderCreationResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

interface UseTaxJarReturn {
  // State
  isCalculating: boolean;
  isCreatingOrder: boolean;
  taxData: TaxCalculationResult | null;
  error: string | null;
  
  // Actions
  calculateTax: (
    billingAddress: BillingAddress,
    items: OrderItem[],
    shipping?: number
  ) => Promise<TaxCalculationResult | null>;
  
  createOrder: (
    transactionId: string,
    billingAddress: BillingAddress,
    items: OrderItem[],
    taxAmount: number,
    shipping?: number,
    transactionDate?: Date
  ) => Promise<OrderCreationResult | null>;
  
  updateOrder: (
    transactionId: string,
    updateData: Partial<{
      billingAddress: BillingAddress;
      items: OrderItem[];
      taxAmount: number;
      shipping: number;
    }>
  ) => Promise<OrderCreationResult | null>;
  
  deleteOrder: (transactionId: string) => Promise<OrderCreationResult | null>;
  
  // Utilities
  clearError: () => void;
  reset: () => void;
}

export function useTaxJar(): UseTaxJarReturn {
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [taxData, setTaxData] = useState<TaxCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateTax = useCallback(async (
    billingAddress: BillingAddress,
    items: OrderItem[],
    shipping: number = 0
  ): Promise<TaxCalculationResult | null> => {
    setIsCalculating(true);
    setError(null);

    try {
      const response = await fetch('/api/taxjar/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billingAddress,
          items,
          shipping,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Tax calculation failed');
      }

      setTaxData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tax calculation failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const createOrder = useCallback(async (
    transactionId: string,
    billingAddress: BillingAddress,
    items: OrderItem[],
    taxAmount: number,
    shipping: number = 0,
    transactionDate?: Date
  ): Promise<OrderCreationResult | null> => {
    setIsCreatingOrder(true);
    setError(null);

    try {
      const response = await fetch('/api/taxjar/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          billingAddress,
          items,
          taxAmount,
          shipping,
          transactionDate: transactionDate?.toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Order creation failed');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Order creation failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsCreatingOrder(false);
    }
  }, []);

  const updateOrder = useCallback(async (
    transactionId: string,
    updateData: Partial<{
      billingAddress: BillingAddress;
      items: OrderItem[];
      taxAmount: number;
      shipping: number;
    }>
  ): Promise<OrderCreationResult | null> => {
    setIsCreatingOrder(true);
    setError(null);

    try {
      const response = await fetch('/api/taxjar/order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          ...updateData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Order update failed');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Order update failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsCreatingOrder(false);
    }
  }, []);

  const deleteOrder = useCallback(async (
    transactionId: string
  ): Promise<OrderCreationResult | null> => {
    setIsCreatingOrder(true);
    setError(null);

    try {
      const response = await fetch(`/api/taxjar/order?transactionId=${transactionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Order deletion failed');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Order deletion failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsCreatingOrder(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsCalculating(false);
    setIsCreatingOrder(false);
    setTaxData(null);
    setError(null);
  }, []);

  return {
    // State
    isCalculating,
    isCreatingOrder,
    taxData,
    error,
    
    // Actions
    calculateTax,
    createOrder,
    updateOrder,
    deleteOrder,
    
    // Utilities
    clearError,
    reset,
  };
}