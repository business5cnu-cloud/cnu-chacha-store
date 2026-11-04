import React from 'react';
import { INITIAL_CATEGORIES } from '@/lib/supabase/seed-data';

export function generateStaticParams() {
  return INITIAL_CATEGORIES.map((category) => ({
    slug: category.slug,
  }));
}

export default function CategorySlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
