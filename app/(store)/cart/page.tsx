import type { Metadata } from "next";
import { Suspense } from "react";
import { CartSkeleton, CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Your cart</h1>
      <Suspense fallback={<CartSkeleton />}>
        <CartView />
      </Suspense>
    </>
  );
}
