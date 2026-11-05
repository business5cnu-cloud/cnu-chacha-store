'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Sparkles,
  Upload,
  CheckCircle2,
  X,
  AlertTriangle,
  FileCheck2,
  Image as ImageIcon,
  Layers,
  Wand2,
  Split,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { formatKRW } from '@/lib/utils';
import { Product, ProductStatus, ProductOption, CategorySlug } from '@/types';
import { ProductArtwork } from '@/components/common/ProductArtwork';
import {
  analyzeAndOptimizeUploadedFile,
  inspectImageUrlDimensions,
  UploadedImageAnalysis,
  IMAGE_UPSCALING_POLICIES,
  formatBytes,
} from '@/lib/utils/image-optimizer';

export default function AdminProductsPage() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
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

  // Policy 5: Selective AI Upscaling toggle
  const [allowAiUpscale, setAllowAiUpscale] = useState(false);
  const [isAiEnhanced, setIsAiEnhanced] = useState(false);

  // Policy 8: Separated tier paths
  const [imageUrl, setImageUrl] = useState('/images/products/medium/prod-hoodie.png');
  const [thumbnailUrl, setThumbnailUrl] = useState('/images/products/thumbnail/prod-hoodie.png');
  const [mediumUrl, setMediumUrl] = useState('/images/products/medium/prod-hoodie.png');
  const [largeUrl, setLargeUrl] = useState('/images/products/large/prod-hoodie.png');
  const [originalUrl, setOriginalUrl] = useState('/images/products/original/prod-hoodie.png');
  const [aiEnhancedUrl, setAiEnhancedUrl] = useState('/images/products/ai_enhanced/prod-hoodie.png');
  const [lifestyleUrl, setLifestyleUrl] = useState('/images/products/lifestyle/prod-hoodie.png');
  const [detailImageUrls, setDetailImageUrls] = useState<string[]>([]);
  const [newGalleryUrlInput, setNewGalleryUrlInput] = useState('');

  // Policy 3 & 6: Real-time image analysis & verification
  const [mainUploadAnalysis, setMainUploadAnalysis] = useState<UploadedImageAnalysis | null>(null);
  const [currentUrlDims, setCurrentUrlDims] = useState<{
    width: number;
    height: number;
    aspectRatio: string;
  } | null>(null);
  const [isOptimizingUpload, setIsOptimizingUpload] = useState(false);

  // Policy 6 Inspection Checklist State
  const [inspectionChecklist, setInspectionChecklist] = useState({
    characterSilhouette: true,
    colorFidelity: true,
    logoTextIntegrity: true,
    productShapeIntegrity: true,
  });

  const [isLimited, setIsLimited] = useState(false);
  const [startAt, setStartAt] = useState('2026-10-01');
  const [endAt, setEndAt] = useState('2026-12-31');
  const [limitedQuantity, setLimitedQuantity] = useState<number>(100);
  const [options, setOptions] = useState<ProductOption[]>([]);

  // New option inputs
  const [newOptName, setNewOptName] = useState('기본옵션');
  const [newOptValue, setNewOptValue] = useState('FREE');
  const [newOptPrice, setNewOptPrice] = useState<number>(0);

  useEffect(() => {
    if (!modalOpen) return;
    const targetUrl = largeUrl || imageUrl;
    if (!targetUrl) {
      setCurrentUrlDims(null);
      return;
    }
    let cancelled = false;
    inspectImageUrlDimensions(targetUrl).then((dims) => {
      if (!cancelled) setCurrentUrlDims(dims);
    });
    return () => {
      cancelled = true;
    };
  }, [modalOpen, largeUrl, imageUrl]);

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
    setAllowAiUpscale(false);
    setIsAiEnhanced(false);
    setImageUrl('/images/products/medium/prod-hoodie.png');
    setThumbnailUrl('/images/products/thumbnail/prod-hoodie.png');
    setMediumUrl('/images/products/medium/prod-hoodie.png');
    setLargeUrl('/images/products/large/prod-hoodie.png');
    setOriginalUrl('/images/products/original/prod-hoodie.png');
    setAiEnhancedUrl('/images/products/ai_enhanced/prod-hoodie.png');
    setLifestyleUrl('/images/products/lifestyle/prod-hoodie.png');
    setDetailImageUrls([
      '/images/products/large/prod-hoodie.png',
      '/images/products/lifestyle/prod-hoodie.png',
    ]);
    setMainUploadAnalysis(null);
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
    setAllowAiUpscale(Boolean(product.is_ai_enhanced));
    setIsAiEnhanced(Boolean(product.is_ai_enhanced));
    setImageUrl(product.medium_url || product.image_url);
    setThumbnailUrl(product.thumbnail_url || `/images/products/thumbnail/${product.id}.png`);
    setMediumUrl(product.medium_url || product.image_url);
    setLargeUrl(product.large_url || `/images/products/large/${product.id}.png`);
    setOriginalUrl(product.original_url || `/images/products/original/${product.id}.png`);
    setAiEnhancedUrl(product.ai_enhanced_url || `/images/products/ai_enhanced/${product.id}.png`);
    setLifestyleUrl(product.lifestyle_url || `/images/products/lifestyle/${product.id}.png`);
    setDetailImageUrls(
      product.detail_images && product.detail_images.length > 0
        ? product.detail_images
        : [
            product.large_url || `/images/products/large/${product.id}.png`,
            product.lifestyle_url || `/images/products/lifestyle/${product.id}.png`,
          ]
    );
    setMainUploadAnalysis(null);
    setIsLimited(product.is_limited);
    setStartAt(product.start_at ? product.start_at.slice(0, 10) : '2026-10-01');
    setEndAt(product.end_at ? product.end_at.slice(0, 10) : '2026-12-31');
    setLimitedQuantity(product.limited_quantity || 100);
    setOptions(product.options);
    setModalOpen(true);
  };

  /**
   * Policy 1, 3, 4, 5, 8: Handle file upload adhering to policy.
   */
  const handleMainImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsOptimizingUpload(true);
    try {
      const analysis = await analyzeAndOptimizeUploadedFile(file, 'product_detail', allowAiUpscale);
      setMainUploadAnalysis(analysis);

      const origData = analysis.tiers.original.dataUrl;
      const aiData = analysis.tiers.aiEnhanced.dataUrl;
      const largeData = allowAiUpscale ? aiData : analysis.tiers.large.dataUrl;
      const mediumData = analysis.tiers.medium.dataUrl;
      const thumbData = analysis.tiers.thumbnail.dataUrl;

      setOriginalUrl(origData);
      setAiEnhancedUrl(aiData);
      setLargeUrl(largeData);
      setMediumUrl(mediumData);
      setImageUrl(mediumData);
      setThumbnailUrl(thumbData);
      setIsAiEnhanced(allowAiUpscale);

      setDetailImageUrls((prev) => [largeData, ...prev.filter((u) => u !== largeData)]);
    } catch (err) {
      console.error(err);
      alert('이미지 분석 중 오류가 발생했습니다.');
    } finally {
      setIsOptimizingUpload(false);
    }
  };

  const handleToggleAiUpscale = (enabled: boolean) => {
    setAllowAiUpscale(enabled);
    setIsAiEnhanced(enabled);
    if (enabled && aiEnhancedUrl) {
      setLargeUrl(aiEnhancedUrl);
    } else if (!enabled && originalUrl) {
      setLargeUrl(originalUrl);
    }
  };

  const handleAddGalleryUrlByText = () => {
    if (!newGalleryUrlInput.trim()) return;
    setDetailImageUrls((prev) => [...prev, newGalleryUrlInput.trim()]);
    setNewGalleryUrlInput('');
  };

  const handleRemoveDetailImage = (index: number) => {
    setDetailImageUrls((prev) => prev.filter((_, i) => i !== index));
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

    const cleanDetailImages =
      detailImageUrls.length > 0 ? detailImageUrls : [largeUrl || imageUrl];

    const payload = {
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
      image_url: mediumUrl.trim() || imageUrl.trim() || '/images/products/medium/prod-hoodie.png',
      thumbnail_url: thumbnailUrl.trim() || mediumUrl.trim(),
      medium_url: mediumUrl.trim() || imageUrl.trim(),
      large_url: largeUrl.trim() || imageUrl.trim(),
      original_url: originalUrl.trim() || largeUrl.trim(),
      ai_enhanced_url: aiEnhancedUrl.trim() || undefined,
      is_ai_enhanced: isAiEnhanced,
      lifestyle_url: lifestyleUrl.trim() || undefined,
      gallery_images: cleanDetailImages,
      detail_images: cleanDetailImages,
      is_limited: isLimited,
      start_at: isLimited ? `${startAt}T00:00:00+09:00` : null,
      end_at: isLimited ? `${endAt}T23:59:59+09:00` : null,
      limited_quantity: isLimited ? Number(limitedQuantity) : null,
      options,
    };

    if (editingProduct) {
      const res = updateProduct(editingProduct.id, payload);
      setNotice(res.message);
    } else {
      const res = addProduct(payload);
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

  const isCurrentUrlBelowDetailSpec =
    currentUrlDims && (currentUrlDims.width < 1600 || currentUrlDims.height < 1600);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            상품 관리 (이미지 업스케일링 정책 준수)
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            [정책 1~8] 픽셀 보간 업스케일링 배제, 원본 보존, 저해상도 경고, 선택적 AI 업스케일링 및 왜곡 검수를 통합 관리합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPolicyModalOpen(true)}
            className="btn-secondary gap-1.5 border-cnu-navy text-cnu-navy text-xs font-extrabold"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>이미지 업스케일링 8대 정책 가이드</span>
          </button>
          <button type="button" onClick={openCreateModal} className="btn-primary gap-2">
            <Plus className="h-4 w-4" />
            <span>신규 상품 등록</span>
          </button>
        </div>
      </div>

      {/* Policy 1~8 Summary Banner */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-sky-50 p-4 text-xs space-y-1">
        <p className="font-black text-cnu-navy flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-cnu-blue" />
          <span>[충남대학교 차차 스토어 공식 이미지 업스케일링 정책]</span>
        </p>
        <p className="text-slate-600 leading-relaxed">
          1. 픽셀 보간 단순 확대 금지 · 2. 원본 화질/비율 보존 · 3. 권장 해상도 미달 경고 · 4. 고해상도 원본 확보 우선 권장 · 5. 선택적 AI 업스케일링 허용 · 6. 캐릭터/로고 왜곡 검수 · 7. [AI 그래픽 보정] 배지 표기(실물 사진 오인 방지) · 8. 원본과 업스케일링 파일 동시 보존
        </p>
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
                <th className="px-4 py-3.5 font-bold">상품 정보 및 이미지 리소스</th>
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
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                        <ProductArtwork
                          sku={product.sku}
                          name={product.name}
                          imageUrl={product.medium_url || product.image_url}
                          thumbnailUrl={product.thumbnail_url}
                          variant="thumbnail"
                          className="h-full w-full"
                        />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-black text-slate-900 text-sm">
                            {product.name}
                          </span>
                          {product.is_limited && (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-600">
                              <Sparkles className="h-2.5 w-2.5" /> 한정판
                            </span>
                          )}
                          {product.is_ai_enhanced && (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-extrabold text-violet-800">
                              <Wand2 className="h-2.5 w-2.5" /> AI 보정
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          코드: {product.sku} · 1600px HD 상세 및 800px 목록 리소스 분리
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700">
                    {product.category_name}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                    {product.sale_price ? (
                      <>
                        <span className="text-slate-400 line-through mr-1 font-normal">
                          {formatKRW(product.price)}
                        </span>
                        <span className="text-rose-600 font-black">
                          {formatKRW(product.sale_price)}
                        </span>
                      </>
                    ) : (
                      formatKRW(product.price)
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <input
                      type="number"
                      min={0}
                      aria-label={`${product.name} 재고 수정`}
                      value={product.stock}
                      onChange={(e) =>
                        updateProduct(
                          product.id,
                          { stock: Math.max(0, Number(e.target.value)) },
                          '목록에서 빠른 재고 변경'
                        )
                      }
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right font-bold text-slate-900"
                    />
                    <span className="text-slate-500 ml-1">개</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <select
                      aria-label={`${product.name} 상태`}
                      value={product.status}
                      onChange={(e) =>
                        updateProduct(product.id, {
                          status: e.target.value as ProductStatus,
                        })
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800"
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

      {/* Edit / Create Modal with 8-Policy Enforcement */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs select-none">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {editingProduct ? `상품 수정 (${editingProduct.name})` : '신규 상품 등록'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  [정책 1~8 준수] 원본 보존, 픽셀 보간 업스케일링 금지 및 선택적 AI 업스케일링
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
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
                  <label className="block font-bold text-slate-700 mb-1">할인 가격(원, 선택)</label>
                  <input
                    type="number"
                    min={0}
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="미입력 시 정가"
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

              {/* Policy 1~8 Integrated Image Upload & Quality Control Panel */}
              <div className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <Upload className="h-4 w-4 text-cnu-navy" />
                      <span>이미지 업로드 및 업스케일링 정책 제어</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      상세 1600×1600px / 목록 800×800px / 썸네일 400×400px (픽셀 보간 확대 금지)
                    </p>
                  </div>
                  {isOptimizingUpload && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-cnu-navy px-2.5 py-1 text-white font-bold text-[11px]">
                      <RefreshCw className="h-3 w-3 animate-spin" /> 분석 중...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Left: Preview */}
                  <div className="md:col-span-4 space-y-2">
                    <span className="font-bold text-slate-700 block">대표 이미지 미리보기</span>
                    <div className="aspect-square w-full overflow-hidden rounded-2xl border border-slate-200 bg-white flex items-center justify-center p-2 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={largeUrl || imageUrl}
                        alt="미리보기"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      {isAiEnhanced && (
                        <span className="absolute top-2 right-2 rounded-md bg-violet-700 text-white px-2 py-0.5 text-[9px] font-black">
                          AI 보정본 적용됨
                        </span>
                      )}
                    </div>
                    {currentUrlDims && (
                      <div
                        className={`rounded-xl px-3 py-1.5 text-[11px] font-bold flex items-center justify-between ${
                          isCurrentUrlBelowDetailSpec
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        <span>
                          {currentUrlDims.width}×{currentUrlDims.height}px ({currentUrlDims.aspectRatio})
                        </span>
                        <span>{isCurrentUrlBelowDetailSpec ? '권장 미달' : '1600px 적합'}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Policy Controls */}
                  <div className="md:col-span-8 space-y-3">
                    {/* Policy 5: Selective AI Upscaling Toggle */}
                    <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 font-black text-violet-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowAiUpscale}
                            onChange={(e) => handleToggleAiUpscale(e.target.checked)}
                            className="rounded border-violet-300 text-violet-600"
                          />
                          <span className="flex items-center gap-1.5">
                            <Wand2 className="h-4 w-4 text-violet-600" />
                            [정책 5] AI 업스케일링 / 디테일 복원 선택 적용
                          </span>
                        </label>
                        {allowAiUpscale && (
                          <button
                            type="button"
                            onClick={() => setComparisonModalOpen(true)}
                            className="inline-flex items-center gap-1 rounded-xl bg-violet-700 px-2.5 py-1 text-white font-extrabold hover:bg-violet-800 text-[11px]"
                          >
                            <Split className="h-3.5 w-3.5" />
                            <span>[정책 6] 원본 vs AI 대조 검수</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-violet-800 leading-relaxed">
                        고해상도 원본 확보가 어려운 경우 선택적으로 적용합니다. (적용 시 [정책 7]에 따라 실제 제품 사진으로 오인되지 않도록 &lsquo;AI 그래픽 보정&rsquo; 안내 배지가 부착됩니다)
                      </p>
                    </div>

                    {/* Upload File Input */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3.5">
                      <span className="font-bold text-slate-800">새 이미지 파일 업로드</span>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-cnu-navy px-3.5 py-2 text-xs font-extrabold text-white hover:bg-cnu-blue">
                        <Upload className="h-3.5 w-3.5" />
                        <span>파일 선택</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMainImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Policy 3 & 4: Warning and Recommendation Banner */}
                    {mainUploadAnalysis && mainUploadAnalysis.warnings.length > 0 && (
                      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3.5 text-amber-950 space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5 font-black text-amber-900">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>[정책 3 & 4] 권장 해상도 미달 경고 및 원본 확보 권고</span>
                        </div>
                        {mainUploadAnalysis.warnings.map((w, idx) => (
                          <p key={idx} className="text-amber-800 leading-relaxed">• {w}</p>
                        ))}
                        {mainUploadAnalysis.recommendations.map((rec, idx) => (
                          <p key={idx} className="font-extrabold text-rose-700">→ {rec}</p>
                        ))}
                      </div>
                    )}

                    {/* Policy 8: Multi-tier preservation paths */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <label className="block font-bold text-slate-600 mb-0.5">original/ (원본 보존)</label>
                        <input
                          type="text"
                          value={originalUrl}
                          onChange={(e) => setOriginalUrl(e.target.value)}
                          className="input-base text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-0.5">ai_enhanced/ (AI 보정본)</label>
                        <input
                          type="text"
                          value={aiEnhancedUrl}
                          onChange={(e) => setAiEnhancedUrl(e.target.value)}
                          className="input-base text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-0.5">large/ (상세 1600px)</label>
                        <input
                          type="text"
                          value={largeUrl}
                          onChange={(e) => setLargeUrl(e.target.value)}
                          className="input-base text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-0.5">medium/ (목록 800px)</label>
                        <input
                          type="text"
                          value={mediumUrl}
                          onChange={(e) => {
                            setMediumUrl(e.target.value);
                            setImageUrl(e.target.value);
                          }}
                          className="input-base text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-image gallery list */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-800">추가 상세 이미지 목록</span>
                    <span className="text-[11px] text-slate-400">{detailImageUrls.length}장 등록됨</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {detailImageUrls.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`추가 ${idx}`} className="h-full w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => handleRemoveDetailImage(idx)}
                          className="absolute top-1 right-1 rounded bg-rose-600 text-white text-[9px] px-1 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="이미지 URL 추가..."
                      value={newGalleryUrlInput}
                      onChange={(e) => setNewGalleryUrlInput(e.target.value)}
                      className="input-base text-[11px] flex-1"
                    />
                    <button type="button" onClick={handleAddGalleryUrlByText} className="btn-secondary text-xs shrink-0">
                      추가
                    </button>
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
                    placeholder="옵션명"
                    value={newOptName}
                    onChange={(e) => setNewOptName(e.target.value)}
                    className="input-base"
                  />
                  <input
                    type="text"
                    placeholder="옵션값"
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
                  <button type="button" onClick={handleAddOption} className="btn-secondary text-xs">
                    + 추가
                  </button>
                </div>
              </div>

              {/* Limited Edition */}
              <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 space-y-3">
                <label className="flex items-center gap-2 font-bold text-rose-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLimited}
                    onChange={(e) => setIsLimited(e.target.checked)}
                    className="rounded border-rose-300 text-rose-600"
                  />
                  <span>한정판 상품으로 설정</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? '수정 저장' : '신규 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Policy 6: Side-by-Side Comparison Inspector Modal */}
      {comparisonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm select-none">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <Split className="h-4 w-4 text-violet-600" />
                  <span>[정책 6] AI 업스케일링 결과 원본 대조 및 4대 항목 검수</span>
                </h3>
                <p className="text-xs text-slate-500">
                  AI 업스케일링 결과가 원본과 비교하여 캐릭터 외형, 색상, 로고, 제품 형태를 변형시키지 않았는지 검수합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComparisonModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="font-extrabold text-xs text-slate-700 block">원본 이미지 (Original)</span>
                <div className="aspect-square rounded-xl bg-white border border-slate-200 flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={originalUrl || imageUrl} alt="원본" className="h-full w-full object-contain" />
                </div>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-violet-900">AI 보정본 (AI Enhanced)</span>
                  <span className="rounded-md bg-violet-200 px-2 py-0.5 text-[10px] font-black text-violet-800">
                    AI 그래픽 보정
                  </span>
                </div>
                <div className="aspect-square rounded-xl bg-white border border-violet-200 flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={aiEnhancedUrl || largeUrl} alt="AI 보정본" className="h-full w-full object-contain" />
                </div>
              </div>
            </div>

            {/* 4 Inspection Checkboxes */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs">
              <p className="font-black text-slate-900">검수 체크리스트 (4개 항목을 모두 확인해 주세요):</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={inspectionChecklist.characterSilhouette}
                    onChange={(e) =>
                      setInspectionChecklist((prev) => ({ ...prev, characterSilhouette: e.target.checked }))
                    }
                  />
                  <span>1. 캐릭터 외형(실루엣, 귀, 볼선)이 왜곡되거나 뭉개지지 않았습니까?</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={inspectionChecklist.colorFidelity}
                    onChange={(e) =>
                      setInspectionChecklist((prev) => ({ ...prev, colorFidelity: e.target.checked }))
                    }
                  />
                  <span>2. CNU 시그니처 색상 및 캐릭터 고유 색상이 변색되지 않았습니까?</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={inspectionChecklist.logoTextIntegrity}
                    onChange={(e) =>
                      setInspectionChecklist((prev) => ({ ...prev, logoTextIntegrity: e.target.checked }))
                    }
                  />
                  <span>3. 충남대학교 공식 로고 및 제품 텍스트가 찌그러지지 않았습니까?</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={inspectionChecklist.productShapeIntegrity}
                    onChange={(e) =>
                      setInspectionChecklist((prev) => ({ ...prev, productShapeIntegrity: e.target.checked }))
                    }
                  />
                  <span>4. 제품 본체의 형태 및 비율이 실물과 일치합니까?</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setComparisonModalOpen(false)} className="btn-primary text-xs">
                검수 승인 및 적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy 8 Modal: Official Policy Guide */}
      {policyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm select-none">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-5 w-5 text-cnu-navy" />
                  <span>충남대학교 차차 스토어 이미지 업스케일링 8대 정책 가이드</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPolicyModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              {IMAGE_UPSCALING_POLICIES.map((p) => (
                <div key={p.id} className="pt-3 first:pt-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cnu-navy text-[10px] font-black text-white">
                      {p.id}
                    </span>
                    <h4 className="font-black text-slate-900 text-sm">{p.title}</h4>
                  </div>
                  <p className="text-slate-600 pl-7">{p.description}</p>
                  <p className="text-[11px] text-cnu-blue pl-7 font-semibold">구현: {p.implementation}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={() => setPolicyModalOpen(false)} className="btn-primary text-xs">
                확인 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
