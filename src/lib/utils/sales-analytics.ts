import { Order, Product } from '@/types';
import { getKSTDateString, getEffectivePrice } from '@/lib/utils';

export interface ProductSalesSummary {
  product: Product;
  effectivePrice: number;
  currentStock: number;
  cumulativeQuantity: number;
  todayQuantity: number;
  monthQuantity: number;
  cumulativeRevenue: number;
  orderCount: number;
  canceledCount: number;
  refundedCount: number;
  excludedAmount: number;
}

export function isValidOrderForAnalytics(order: Order): boolean {
  return (
    order.order_status !== '주문 취소' &&
    order.order_status !== '환불 완료' &&
    order.order_status !== '결제 대기' &&
    order.payment_status === '완료'
  );
}

export function calculateProductSalesSummaries(
  products: Product[],
  orders: Order[],
  startDate?: string,
  endDate?: string,
  referenceDate: Date = new Date()
): ProductSalesSummary[] {
  const todayStr = getKSTDateString(referenceDate); // YYYY-MM-DD
  const monthPrefix = todayStr.slice(0, 7); // YYYY-MM

  return products.map((product) => {
    const effectivePrice = getEffectivePrice(product.price, product.sale_price);

    let periodValidQty = 0;
    let periodValidRevenue = 0;
    let todayQuantity = 0;
    let monthQuantity = 0;
    let orderCount = 0;
    let canceledCount = 0;
    let refundedCount = 0;
    let excludedAmount = 0;

    for (const order of orders) {
      const orderDateStr = getKSTDateString(new Date(order.created_at));
      if (startDate && orderDateStr < startDate) continue;
      if (endDate && orderDateStr > endDate) continue;

      const matchingItems = order.items.filter((i) => i.product_id === product.id);
      if (matchingItems.length === 0) continue;

      const itemQty = matchingItems.reduce((sum, i) => sum + i.quantity, 0);
      const itemRev = matchingItems.reduce((sum, i) => sum + i.subtotal, 0);

      if (order.order_status === '주문 취소' || order.payment_status === '취소') {
        canceledCount += 1;
        excludedAmount += itemRev;
        continue;
      }
      if (order.order_status === '환불 완료' || order.payment_status === '환불') {
        refundedCount += 1;
        excludedAmount += itemRev;
        continue;
      }
      if (!isValidOrderForAnalytics(order)) {
        continue;
      }

      orderCount += 1;
      periodValidQty += itemQty;
      periodValidRevenue += itemRev;

      if (orderDateStr === todayStr) {
        todayQuantity += itemQty;
      }
      if (orderDateStr.startsWith(monthPrefix)) {
        monthQuantity += itemQty;
      }
    }

    // 기간 필터가 없는 경우 기본 누적 판매량(seed)과 주문 상세 실적을 결합하여 일관성 유지
    const hasDateFilter = Boolean(startDate || endDate);
    const cumulativeQuantity = hasDateFilter
      ? periodValidQty
      : Math.max(product.total_sold, periodValidQty);
    const cumulativeRevenue = hasDateFilter
      ? periodValidRevenue
      : Math.max(product.total_sold * effectivePrice, periodValidRevenue);

    return {
      product,
      effectivePrice,
      currentStock: product.stock,
      cumulativeQuantity,
      todayQuantity,
      monthQuantity: hasDateFilter ? monthQuantity : Math.max(monthQuantity, periodValidQty),
      cumulativeRevenue,
      orderCount,
      canceledCount,
      refundedCount,
      excludedAmount,
    };
  });
}

export function exportSalesSummariesToCSV(summaries: ProductSalesSummary[]): string {
  const headers = [
    '상품코드(SKU)',
    '상품명',
    '카테고리',
    '판매단가(원)',
    '현재재고',
    '누적판매수량',
    '오늘판매수량',
    '이번달판매수량',
    '누적매출(원)',
    '정상주문건수',
    '취소건수',
    '환불건수',
    '판매상태',
  ];

  const rows = summaries.map((s) => [
    s.product.sku,
    `"${s.product.name.replace(/"/g, '""')}"`,
    s.product.category_name,
    s.effectivePrice,
    s.currentStock,
    s.cumulativeQuantity,
    s.todayQuantity,
    s.monthQuantity,
    s.cumulativeRevenue,
    s.orderCount,
    s.canceledCount,
    s.refundedCount,
    s.product.status,
  ]);

  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function triggerExcelCSVDownload(filename: string, csvContent: string): void {
  if (typeof window === 'undefined') return;
  const normalizedContent = csvContent.startsWith('\uFEFF')
    ? csvContent
    : '\uFEFF' + csvContent;
  const blob = new Blob([normalizedContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

