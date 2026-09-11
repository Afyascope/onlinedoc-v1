export function PriceTag({ price, currency = "KES", className }: { price: string | number; currency?: string; className?: string }) {
  const amount = Number(price);
  if (amount === 0) return <span className={className}>Free</span>;
  const formatted = new Intl.NumberFormat("en-KE", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
  return <span className={className}>{formatted}</span>;
}
