export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatPrice = (amount: string, currency: string) => {
  const price = parseFloat(amount) / 100; // Convert cents to dollars
  const currencyCode = currency?.toUpperCase() || "USD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(price);
};

export const getIntervalLabel = (intervalLength: number, intervalUnit: string) => {
  if (intervalLength === 1) {
    return intervalUnit === "months" ? "Monthly" : "Yearly";
  }
  return `Every ${intervalLength} ${intervalUnit}`;
};