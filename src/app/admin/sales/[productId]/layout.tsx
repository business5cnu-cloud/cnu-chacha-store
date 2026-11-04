import React from 'react';
import { INITIAL_PRODUCTS } from '@/lib/supabase/seed-data';

export function generateStaticParams() {
  return INITIAL_PRODUCTS.map((product) => ({
    productId: product.id,
  }));
}

export default function AdminProductSalesIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
