import { Suspense } from "react";
import OrdersClient from "./OrdersClient";

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white/45">Loading orders...</div>}>
      <OrdersClient />
    </Suspense>
  );
}
