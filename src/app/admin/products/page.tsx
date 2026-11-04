'use client';

import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Sparkles,
  Upload,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { formatKRW } from '@/lib/utils';
import { Product, ProductStatus, ProductOption, CategorySlug } from '@/types';
import { ProductArtwork } from '@/components/common/ProductArtwork';

export default function AdminProductsPage() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('cat-apparel');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(20000);
  const [salePrice, setSalePrice] = useState<string>('');
  const [stock, setStock] = useState<number>(50);
  const [status, setStatus] = useState<ProductStatus>('on_sale');
  const [imageUrl, setImageUrl] = useState('/images/products/default-product.svg');
  const [detailImageUrl, setDetailImageUrl] = useState('/images/products/default-product.svg');
  const [isLimited, setIsLimited] = useState(false);
  const [startAt, setStartAt] = useState('2026-10-01');
  const [endAt, setEndAt] = useState('2026-12-31');
  const [limitedQuantity, setLimitedQuantity] = useState<number>(100);
  const [options, setOptions] = useState<ProductOption[]>([]);

  // New option inputs
  const [newOptName, setNewOptName] = useState('기본옵션');
  const [newOptValue, setNewOptValue] = useState('FREE');
  const [newOptPrice, setNewOptPrice] = useState<number>(0);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`CNU-NEW-${Math.floor(100 + Math.random() * 900)}`);
    setCategoryId('cat-accessories');
    setDescription('');
    setPrice(18000);
    setSalePrice('15000');
    setStock(50);
    setStatus('on_sale');
    setImageUrl('/images/products/default-product.svg');
    setDetailImageUrl('/images/products/default-product.svg');
    setIsLimited(false);
    setStartAt('2026-11-01');
    setEndAt('2026-12-31');
    setLimitedQuantity(100);
    setOptions([
      {
        id: `opt-${Date.now()}`,
        product_id: 'temp',
        option_name: '색상/규격',
        option_value: '기본형',
        additional_price: 0,
      },
    ]);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setCategoryId(product.category_id);
    setDescription(product.description);
    setPrice(product.price);
    setSalePrice(product.sale_price !== null ? String(product.sale_price) : '');
    setStock(product.stock);
    setStatus(product.status);
    setImageUrl(product.image_url);
    setDetailImageUrl(product.detail_images?.[0] || product.image_url);
    setIsLimited(product.is_limited);
    setStartAt(product.start_at ? product.start_at.slice(0, 10) : '2026-10-01');
    setEndAt(product.end_at ? product.end_at.slice(0, 10) : '2026-12-31');
    setLimitedQuantity(product.limited_quantity || 100);
    setOptions(product.options);
    setModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isDetail = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (isDetail) setDetailImageUrl(reader.result);
        else setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddOption = () => {
    if (!newOptName.trim() || !newOptValue.trim()) return;
    setOptions((prev) => [
      ...prev,
      {
        id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        product_id: editingProduct?.id || 'new',
        option_name: newOptName.trim(),
        option_value: newOptValue.trim(),
        additional_price: Number(newOptPrice) || 0,
      },
    ]);
    setNewOptValue('');
    setNewOptPrice(0);
  };

  const handleRemoveOption = (optId: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== optId));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find((c) => c.id === categoryId) || categories[0];
    const parsedSalePrice =
      salePrice.trim() !== '' && Number(salePrice) > 0 ? Number(salePrice) : null;

    if (editingProduct) {
      const res = updateProduct(editingProduct.id, {
        name: name.trim(),
        sku: sku.trim(),
        category_id: cat.id,
        category_name: cat.name,
        category_slug: cat.slug as CategorySlug,
        description: description.trim(),
        price: Number(price),
        sale_price: parsedSalePrice,
        stock: Number(stock),
        status,
        image_url: imageUrl.trim() || '/images/products/default-product.svg',
        detail_images: [detailImageUrl.trim() || imageUrl.trim()],
        is_limited: isLimited,
        start_at: isLimited ? `${startAt}T00:00:00+09:00` : null,
        end_at: isLimited ? `${endAt}T23:59:59+09:00` : null,
        limited_quantity: isLimited ? Number(limitedQuantity) : null,
        options,
      });
      setNotice(res.message);
    } else {
      const res = addProduct({
        name: name.trim(),
        sku: sku.trim(),
        category_id: cat.id,
        category_name: cat.name,
        category_slug: cat.slug as CategorySlug,
        description: description.trim(),
        price: Number(price),
        sale_price: parsedSalePrice,
        stock: Number(stock),
        status,
        image_url: imageUrl.trim() || '/images/products/default-product.svg',
        detail_images: [detailImageUrl.trim() || imageUrl.trim()],
        is_limited: isLimited,
        start_at: isLimited ? `${startAt}T00:00:00+09:00` : null,
        end_at: isLimited ? `${endAt}T23:59:59+09:00` : null,
        limited_quantity: isLimited ? Number(limitedQuantity) : null,
        options,
      });
      setNotice(res.message);
    }

    setModalOpen(false);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDelete = (product: Product) => {
    const res = deleteProduct(product.id);
    setNotice(res.message);
    setTimeout(() => setNotice(null), 4000);
  };

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">상품 관리</h1>
          <p className="mt-1 text-xs text-slate-500">
            상품 등록, 가격·할인가·재고 수정, 이미지 교체, 옵션 및 한정판 설정을 통합 관리합니다.
          </p>
        </div>
        <button type="button" onClick={openCreateModal} className="btn-primary gap-2">
          <Plus className="h-4 w-4" />
          <span>신규 상품 등록</span>
        </button>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="상품명 또는 상품코드(SKU) 검색..."
            className="input-base pl-10"
          />
        </div>
        <select
          aria-label="카테고리 필터"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-base sm:w-52 font-semibold"
        >
          <option value="all">전체 카테고리 ({products.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="px-4 py-3.5 font-bold">상품 정보</th>
                <th className="px-4 py-3.5 font-bold">카테고리</th>
                <th className="px-4 py-3.5 font-bold text-right">판매가 / 할인가</th>
                <th className="px-4 py-3.5 font-bold text-right">현재 재고</th>
                <th className="px-4 py-3.5 font-bold text-center">판매 상태</th>
                <th className="px-4 py-3.5 font-bold text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                        <ProductArtwork
                          sku={product.sku}
                          name={product.name}
                          imageUrl={product.image_url}
                          className="h-full w-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 text-sm">
                            {product.name}
                          </span>
                          {product.is_limited && (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-600">
                              <Sparkles className="h-2.5 w-2.5" /> 한정판
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          코드: {product.sku} · 옵션 {product.options.length}개
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700">
                    {product.category_name}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="font-bold text-slate-900">
                      {product.sale_price ? (
                        <>
                          <span className="text-slate-400 line-through mr-1.5 font-normal">
                            {formatKRW(product.price)}
                          </span>
                          <span className="text-rose-600 font-black">
                            {formatKRW(product.sale_price)}
                          </span>
                        </>
                      ) : (
                        formatKRW(product.price)
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        aria-label={`${product.name} 빠른 재고 수정`}
                        value={product.stock}
                        onChange={(e) =>
                          updateProduct(
                            product.id,
                            { stock: Math.max(0, Number(e.target.value)) },
                            '상품 관리 목록에서 빠른 재고 변경'
                          )
                        }
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right font-bold text-slate-900"
                      />
                      <span className="text-slate-500">개</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <select
                      aria-label={`${product.name} 상태 변경`}
                      value={product.status}
                      onChange={(e) =>
                        updateProduct(product.id, {
                          status: e.target.value as ProductStatus,
                        })
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800"
                    >
                      <option value="on_sale">판매중</option>
                      <option value="sold_out">품절</option>
                      <option value="ended">판매종료</option>
                      <option value="hidden">숨김</option>
                    </select>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-xl font-black text-slate-900">
                {editingProduct ? `상품 수정 (${editingProduct.name})` : '신규 상품 등록'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">상품명 *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">상품 코드 (SKU) *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="input-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">카테고리 *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="input-base"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">판매 상태</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    className="input-base"
                  >
                    <option value="on_sale">판매중</option>
                    <option value="sold_out">품절</option>
                    <option value="ended">판매종료</option>
                    <option value="hidden">숨김</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">상품 설명 *</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">판매 가격(원) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    할인 가격(원, 선택)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="미입력 시 정가 판매"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">재고 수량 *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="input-base"
                  />
                </div>
              </div>

              {/* Image Upload / URL Input (Supabase Storage Ready) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-cnu-navy" />
                  상품 대표 이미지 및 상세 이미지 등록 (Supabase Storage 연동)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      대표 이미지 URL 또는 파일 업로드
                    </label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="input-base mb-1.5"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileUpload(e, false)}
                      className="text-[11px] text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      상세 이미지 URL 또는 파일 업로드
                    </label>
                    <input
                      type="text"
                      value={detailImageUrl}
                      onChange={(e) => setDetailImageUrl(e.target.value)}
                      className="input-base mb-1.5"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileUpload(e, true)}
                      className="text-[11px] text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Options Manager */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <p className="font-bold text-slate-800">상품 옵션 관리</p>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => (
                    <span
                      key={opt.id}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 font-semibold text-slate-700"
                    >
                      {opt.option_name}: {opt.option_value} (+{formatKRW(opt.additional_price)})
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        className="text-rose-500 hover:text-rose-700 font-black"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="옵션명 (예: 사이즈)"
                    value={newOptName}
                    onChange={(e) => setNewOptName(e.target.value)}
                    className="input-base"
                  />
                  <input
                    type="text"
                    placeholder="옵션값 (예: XL)"
                    value={newOptValue}
                    onChange={(e) => setNewOptValue(e.target.value)}
                    className="input-base"
                  />
                  <input
                    type="number"
                    placeholder="추가금액"
                    value={newOptPrice}
                    onChange={(e) => setNewOptPrice(Number(e.target.value))}
                    className="input-base"
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="btn-secondary text-xs"
                  >
                    + 옵션 추가
                  </button>
                </div>
              </div>

              {/* Limited Edition Configuration */}
              <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 space-y-3">
                <label className="flex items-center gap-2 font-bold text-rose-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLimited}
                    onChange={(e) => setIsLimited(e.target.checked)}
                    className="rounded border-rose-300 text-rose-600"
                  />
                  <span>한정판(LIMITED EDITION) 상품으로 설정</span>
                </label>

                {isLimited && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-rose-800 mb-1">판매 시작일</label>
                      <input
                        type="date"
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-rose-800 mb-1">판매 종료일</label>
                      <input
                        type="date"
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-rose-800 mb-1">총 한정 수량</label>
                      <input
                        type="number"
                        min={1}
                        value={limitedQuantity}
                        onChange={(e) => setLimitedQuantity(Number(e.target.value))}
                        className="input-base"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? '상품 수정 저장' : '신규 상품 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
