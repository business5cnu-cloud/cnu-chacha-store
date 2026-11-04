'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, Sparkles, PackageOpen, RotateCcw } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { ProductCard } from '@/components/store/ProductCard';
import { CategorySlug } from '@/types';

function ProductCatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get('category') as CategorySlug | 'all') || 'all';

  const { products, categories } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug | 'all'>(initialCategory);
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_sale' | 'sold_out'>('all');
  const [onlyLimited, setOnlyLimited] = useState(false);

  const activeProducts = products.filter((p) => p.status !== 'hidden');

  const filteredProducts = activeProducts.filter((product) => {
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'limited') {
        if (!product.is_limited) return false;
      } else if (product.category_slug !== selectedCategory) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = product.name.toLowerCase().includes(q);
      const matchDesc = product.description.toLowerCase().includes(q);
      const matchSku = product.sku.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchSku) return false;
    }

    if (statusFilter === 'on_sale') {
      if (product.stock <= 0 || product.status !== 'on_sale') return false;
    } else if (statusFilter === 'sold_out') {
      if (product.stock > 0 && product.status !== 'sold_out') return false;
    }

    if (onlyLimited && !product.is_limited) {
      return false;
    }

    return true;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setStatusFilter('all');
    setOnlyLimited(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-cnu-navy to-blue-900 p-8 text-white shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-black">차차 스토어 전체 상품</h1>
        <p className="mt-1.5 text-sm text-sky-200">
          충남대학교 마스코트 차차 공식 굿즈를 카테고리, 판매 상태, 한정판 여부로 편리하게 찾아보세요.
        </p>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          {/* Search Input */}
          <div className="relative md:col-span-6">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="상품명, 설명 또는 상품코드(SKU)로 검색해보세요..."
              className="input-base pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              aria-label="판매 상태 필터"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'on_sale' | 'sold_out')}
              className="input-base font-semibold"
            >
              <option value="all">판매 상태: 전체 보기</option>
              <option value="on_sale">판매중 상품만</option>
              <option value="sold_out">품절 상품만</option>
            </select>
          </div>

          {/* Limited Filter Toggle */}
          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyLimited(!onlyLimited)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold border transition-colors ${
                onlyLimited
                  ? 'border-rose-600 bg-rose-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>한정판만 보기</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              title="필터 초기화"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 mr-2">
            <Filter className="h-3.5 w-3.5" /> 카테고리:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
              selectedCategory === 'all'
                ? 'bg-cnu-navy text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체 ({activeProducts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-cnu-navy text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-700">
          총 <span className="text-cnu-navy font-black">{filteredProducts.length}</span>개의 차차 굿즈
        </p>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-20 text-center">
          <PackageOpen className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-base font-bold text-slate-800">
            조건에 일치하는 상품이 없습니다.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            검색어나 필터 조건을 변경해 다시 시도해보세요.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn-primary mt-5"
          >
            필터 초기화하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-slate-500">
          상품 목록을 불러오는 중입니다...
        </div>
      }
    >
      <ProductCatalogContent />
    </Suspense>
  );
}
