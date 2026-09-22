"use client";
import { OrderItem } from '@/lib/taxjar';

interface TaxSummaryProps {
  items: OrderItem[];
  subtotal: number; // in cents
  shipping: number; // in cents
  taxAmount: number; // in cents
  taxRate: number;
  className?: string;
}

export default function TaxSummary({
  items,
  subtotal,
  shipping,
  taxAmount,
  taxRate,
  className = "",
}: TaxSummaryProps) {
  const formatCurrency = (amountInCents: number) => {
    return (amountInCents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const formatPercentage = (rate: number) => {
    return (rate * 100).toFixed(2) + '%';
  };

  const total = subtotal + shipping + taxAmount;

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl p-6 space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
      
      {/* Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <p className="text-white text-sm font-medium">{item.description}</p>
              <p className="text-white/60 text-xs">
                Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
              </p>
            </div>
            <div className="text-white text-sm">
              {formatCurrency(item.unitPrice * item.quantity - (item.discount || 0))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-4 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-white/70">Subtotal:</span>
          <span className="text-white">{formatCurrency(subtotal)}</span>
        </div>

        {/* Shipping */}
        {shipping > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-white/70">Shipping:</span>
            <span className="text-white">{formatCurrency(shipping)}</span>
          </div>
        )}

        {/* Tax */}
        <div className="flex justify-between items-center">
          <span className="text-white/70">
            Sales Tax {taxRate > 0 && `(${formatPercentage(taxRate)})`}:
          </span>
          <span className="text-white">{formatCurrency(taxAmount)}</span>
        </div>

        {/* Total */}
        <div className="border-t border-white/10 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-white">Total:</span>
            <span className="text-xl font-bold text-[var(--color-gold)]">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Tax Notice */}
      {taxAmount > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-blue-400 text-xs font-medium">Tax Information</p>
              <p className="text-blue-300 text-xs mt-1">
                Sales tax is calculated based on your billing address and applicable local tax rates.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}