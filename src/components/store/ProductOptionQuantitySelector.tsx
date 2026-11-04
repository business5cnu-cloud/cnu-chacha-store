'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { ProductOption } from '@/types';
import { formatKRW } from '@/lib/utils';

interface ProductOptionQuantitySelectorProps {
  options: ProductOption[];
  selectedOptionId: string;
  onSelectOption: (optionId: string) => void;
  quantity: number;
  maxStock: number;
  disabled?: boolean;
  onChangeQuantity: (nextQuantity: number) => void;
}

export function ProductOptionQuantitySelector({
  options,
  selectedOptionId,
  onSelectOption,
  quantity,
  maxStock,
  disabled = false,
  onChangeQuantity,
}: ProductOptionQuantitySelectorProps) {
  return (
    <div className="space-y-4">
      {options.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="product-option-select"
            className="block text-xs font-extrabold uppercase tracking-wider text-slate-700"
          >
            상품 옵션 선택
          </label>
          <select
            id="product-option-select"
            value={selectedOptionId}
            onChange={(e) => onSelectOption(e.target.value)}
            disabled={disabled}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 focus:border-cnu-navy focus:outline-none disabled:opacity-50"
          >
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.option_name}: {opt.option_value}
                {opt.additional_price > 0
                  ? ` (+${formatKRW(opt.additional_price)})`
                  : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <span className="text-sm font-bold text-slate-700">주문 수량</span>
          <p className="text-[11px] text-slate-400">
            최대 선택 가능 수량: {maxStock}개
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="수량 감소"
            onClick={() => onChangeQuantity(quantity - 1)}
            disabled={disabled || quantity <= 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-base font-black text-slate-900">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="수량 증가"
            onClick={() => onChangeQuantity(quantity + 1)}
            disabled={disabled || quantity >= maxStock}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
