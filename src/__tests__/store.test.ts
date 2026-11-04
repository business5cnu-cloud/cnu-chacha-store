import { describe, it, expect } from 'vitest';
import {
  formatKRW,
  calculateDiscountRate,
  getEffectivePrice,
} from '@/lib/utils';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
} from '@/lib/supabase/seed-data';
import {
  calculateProductSalesSummaries,
  isValidOrderForAnalytics,
  exportSalesSummariesToCSV,
} from '@/lib/utils/sales-analytics';
import { synchronizeProductState } from '@/hooks/useStore';

describe('CNU CHA CHA STORE Core Business Logic Tests', () => {
  it('formats Korean Won (KRW) and calculates discount rates accurately', () => {
    expect(formatKRW(49000)).toBe('49,000원');
    expect(calculateDiscountRate(59000, 49000)).toBe(17);
    expect(calculateDiscountRate(15000, null)).toBe(0);
    expect(getEffectivePrice(59000, 49000)).toBe(49000);
    expect(getEffectivePrice(15000, null)).toBe(15000);
  });

  it('includes all 4 required categories and 16 official ChaCha products', () => {
    expect(INITIAL_CATEGORIES.map((c) => c.name)).toEqual([
      '의류',
      '문구',
      '잡화',
      '한정판',
    ]);
    expect(INITIAL_PRODUCTS.length).toBe(16);

    const productNames = INITIAL_PRODUCTS.map((p) => p.name);
    expect(productNames).toContain('차차 후드티');
    expect(productNames).toContain('차차 양말');
    expect(productNames).toContain('차차 메모지');
    expect(productNames).toContain('시즌 한정 스티커');
    expect(productNames).toContain('맥세이프 그립톡');
    expect(productNames).toContain('말랑 PVC 키링');
    expect(productNames).toContain('차차 텀블러');
    expect(productNames).toContain('랜덤 피규어');
    expect(productNames).toContain('노트북 파우치');
    expect(productNames).toContain('보조배터리');
    expect(productNames).toContain('양치도구 세트');
    expect(productNames).toContain('여행용 파우치 세트');
    expect(productNames).toContain('차량 방향제');
    expect(productNames).toContain('에코백');
    expect(productNames).toContain('커스텀 의상 차차 인형');
    expect(productNames).toContain('시즌 한정 차차 인형');
  });

  it('automatically transitions limited edition products to sold_out when stock is 0 or ended when end_at passes', () => {
    const sampleLimited = INITIAL_PRODUCTS.find((p) => p.is_limited)!;

    const zeroStockProduct = synchronizeProductState({
      ...sampleLimited,
      stock: 0,
      status: 'on_sale',
    });
    expect(zeroStockProduct.status).toBe('sold_out');

    const expiredProduct = synchronizeProductState({
      ...sampleLimited,
      stock: 10,
      status: 'on_sale',
      end_at: '2020-01-01T00:00:00+09:00',
    });
    expect(expiredProduct.status).toBe('ended');
  });

  it('excludes canceled and refunded orders from valid sales revenue and tracks refund counts', () => {
    const refundedOrder = INITIAL_ORDERS.find((o) => o.order_status === '환불 완료')!;
    expect(isValidOrderForAnalytics(refundedOrder)).toBe(false);

    const summaries = calculateProductSalesSummaries(
      INITIAL_PRODUCTS,
      INITIAL_ORDERS,
      '2026-10-01',
      '2026-11-30'
    );

    const travelPouchSummary = summaries.find(
      (s) => s.product.id === 'prod-travel-pouch'
    )!;
    expect(travelPouchSummary.refundedCount).toBe(1);
    expect(travelPouchSummary.excludedAmount).toBe(19900);
    expect(travelPouchSummary.cumulativeQuantity).toBe(0);

    const csv = exportSalesSummariesToCSV(summaries);
    expect(csv).toContain('차차 후드티');
    expect(csv).toContain('CNU-APP-001');
  });
});
