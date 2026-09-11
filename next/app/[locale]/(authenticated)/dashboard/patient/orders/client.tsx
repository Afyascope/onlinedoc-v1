"use client";

import { useState, useEffect } from "react";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { OrderCard } from "@/components/marketplace/OrderCard";
import { listOrders } from "@/lib/actions/orders";
import { IconShoppingCart } from "@tabler/icons-react";

export function OrdersClient() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-neutral-400">Loading...</div>;

  return (
    <ActivityCard title="Order History">
      {orders.length === 0 ? (
        <EmptyState
          icon={<IconShoppingCart size={24} />}
          title="No orders yet"
          description="Your order history will appear here after your first purchase."
        />
      ) : (
        <div className="divide-y divide-border">
          {orders.map((order) => (
            <div key={order.id} className="px-4 py-3">
              <OrderCard order={order} />
            </div>
          ))}
        </div>
      )}
    </ActivityCard>
  );
}
