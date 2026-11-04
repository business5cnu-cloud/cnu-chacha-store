import React from 'react';
import { INITIAL_PRODUCTS } from '@/lib/supabase/seed-data';

export function generateStaticParams() {
  return INITIAL_PRODUCTS.map((product) => ({
    id: product.id,
  }));
}

export default function ProductIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
