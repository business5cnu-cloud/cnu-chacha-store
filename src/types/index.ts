export type UserRole = 'customer' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  address_detail?: string;
  postal_code?: string;
  role: UserRole;
  created_at: string;
}

export type CategorySlug = 'apparel' | 'stationery' | 'accessories' | 'limited';

export interface Category {
  id: string;
  name: string;
  slug: CategorySlug;
  description?: string;
  created_at: string;
}

export type ProductStatus = 'on_sale' | 'sold_out' | 'hidden' | 'ended';

export interface ProductOption {
  id: string;
  product_id: string;
  option_name: string;
  option_value: string;
  additional_price: number;
}

export interface LimitedProductConfig {
  id: string;
  product_id: string;
  start_at: string;
  end_at: string;
  limited_quantity: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  category_name: string;
  category_slug: CategorySlug;
  description: string;
  detail_description?: string;
  price: number;
  sale_price: number | null;
  stock: number;
  image_url: string;
  thumbnail_url?: string;
  medium_url?: string;
  large_url?: string;
  original_url?: string;
  lifestyle_url?: string;
  ai_enhanced_url?: string;
  is_ai_enhanced?: boolean;
  legacy_lowres_url?: string;
  gallery_images?: string[];
  detail_images: string[];
  is_limited: boolean;
  status: ProductStatus;
  options: ProductOption[];
  total_sold: number;
  start_at: string | null;
  end_at: string | null;
  limited_quantity: number | null;
  created_at: string;
}

export type OrderStatus =
  | '결제 대기'
  | '결제 완료'
  | '상품 준비 중'
  | '배송 중'
  | '배송 완료'
  | '주문 취소'
  | '환불 완료';

export type PaymentStatus = '대기' | '완료' | '취소' | '환불';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  category_name?: string;
  option_text?: string;
  price: number;
  quantity: number;
  subtotal: number;
  image_url?: string;
}

export interface OrderStatusHistoryItem {
  id: string;
  order_id: string;
  previous_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string;
  note?: string;
  created_at: string;
}

export interface ShippingInfo {
  recipient_name: string;
  recipient_phone: string;
  postal_code: string;
  address: string;
  address_detail: string;
  memo?: string;
  courier?: string;
  tracking_number?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  total_amount: number;
  shipping_fee: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  shipping_address: string;
  shipping_info: ShippingInfo;
  payment_method: string;
  payment_key?: string;
  is_test_order?: boolean;
  items: OrderItem[];
  status_history: OrderStatusHistoryItem[];
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  payment_key: string;
  amount: number;
  method: string;
  is_test: boolean;
  status: PaymentStatus;
  paid_at: string;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'ORDER' | 'CANCEL' | 'REFUND';

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  movement_type: MovementType;
  quantity: number;
  previous_stock: number;
  current_stock: number;
  reason: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  option_id?: string;
  option_label?: string;
  additional_price: number;
  quantity: number;
}

export interface Review {
  id: string;
  product_id: string;
  product_name: string;
  author: string;
  rating: number;
  comment: string;
  photo_url?: string;
  created_at: string;
}

export type CommissionStatus =
  | '접수 대기'
  | '상담 진행 중'
  | '제작 진행 중'
  | '제작 완료'
  | '취소';

export interface CommissionRequest {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  item_type: string;
  details: string;
  status: CommissionStatus;
  admin_note?: string;
  created_at: string;
}

