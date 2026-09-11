import { PriceTag } from "./PriceTag";

interface Props {
  order: any;
}

const statusColors: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50",
  paid: "text-green-600 bg-green-50",
  completed: "text-green-600 bg-green-50",
  failed: "text-red-600 bg-red-50",
  cancelled: "text-neutral-500 bg-neutral-100",
  refunded: "text-orange-600 bg-orange-50",
};

export function OrderCard({ order }: Props) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-primary">Order #{order.id.slice(0, 8)}</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          {order.orderType.replace("_", " ")} &middot; {new Date(order.createdAt).toLocaleDateString()}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">
          Ref: {order.paymentReference || "N/A"}
        </p>
      </div>
      <div className="text-right">
        <PriceTag price={order.totalAmount} currency={order.currency} className="text-sm font-bold text-primary" />
        <span className={`block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded ${statusColors[order.paymentStatus] || "text-neutral-500 bg-neutral-100"}`}>
          {order.paymentStatus}
        </span>
      </div>
    </div>
  );
}
