-- =========================================================
-- CNU CHA CHA STORE - Initial Database Schema & RLS Policies
-- Timezone: Asia/Seoul
-- =========================================================

SET TIME ZONE 'Asia/Seoul';

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles 테이블
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  postal_code TEXT,
  address TEXT,
  address_detail TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. categories 테이블
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. products 테이블
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  detail_description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  sale_price INTEGER CHECK (sale_price IS NULL OR sale_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT NOT NULL,
  is_limited BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'on_sale' CHECK (status IN ('on_sale', 'sold_out', 'hidden', 'ended')),
  total_sold INTEGER NOT NULL DEFAULT 0 CHECK (total_sold >= 0),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. product_images 테이블
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. product_options 테이블
CREATE TABLE IF NOT EXISTS public.product_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  option_name TEXT NOT NULL,
  option_value TEXT NOT NULL,
  additional_price INTEGER NOT NULL DEFAULT 0
);

-- 6. limited_products 테이블
CREATE TABLE IF NOT EXISTS public.limited_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID UNIQUE NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  limited_quantity INTEGER NOT NULL CHECK (limited_quantity >= 0)
);

-- 7. carts & cart_items 테이블
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  option_id UUID REFERENCES public.product_options(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. orders 테이블
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  shipping_fee INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT '대기' CHECK (payment_status IN ('대기', '완료', '취소', '환불')),
  order_status TEXT NOT NULL DEFAULT '결제 대기' CHECK (order_status IN ('결제 대기', '결제 완료', '상품 준비 중', '배송 중', '배송 완료', '주문 취소', '환불 완료')),
  shipping_address TEXT NOT NULL,
  is_test_order BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. order_items 테이블 (주문 당시 상품명 및 가격 보존, 상품 삭제 시에도 보존)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  option_text TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0)
);

-- 10. payments & payment_refunds 테이블
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_key TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('대기', '완료', '취소', '환불')),
  is_test BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  refund_amount INTEGER NOT NULL CHECK (refund_amount >= 0),
  reason TEXT NOT NULL,
  refunded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. shipping_info 테이블
CREATE TABLE IF NOT EXISTS public.shipping_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  address TEXT NOT NULL,
  address_detail TEXT,
  memo TEXT,
  courier TEXT,
  tracking_number TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. order_status_history 테이블
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. inventory_movements 테이블
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUST', 'ORDER', 'CANCEL', 'REFUND')),
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  current_stock INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. admin_activity_logs 테이블
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 관리자 권한 확인 헬퍼 함수 및 권한 변경 차단 트리거
-- =========================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 일반 회원이 자신의 role을 admin으로 변경하는 것을 원천 차단하는 트리거
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() AND current_setting('role', true) <> 'service_role' THEN
      RAISE EXCEPTION '일반 회원은 관리자 권한(role)을 변경할 수 없습니다.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_escalation();

-- =========================================================
-- 트랜잭션 기반 주문 및 재고 차감 함수 (동시 주문 시 음수 재고 방지)
-- =========================================================

CREATE OR REPLACE FUNCTION public.decrease_product_stock(
  p_product_id UUID,
  p_quantity INTEGER,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prev_stock INTEGER;
  v_new_stock INTEGER;
  v_is_limited BOOLEAN;
BEGIN
  -- 행 잠금(FOR UPDATE)으로 동시 주문 시 정합성 보장
  SELECT stock, is_limited INTO v_prev_stock, v_is_limited
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '상품을 찾을 수 없습니다.';
  END IF;

  IF v_prev_stock < p_quantity THEN
    RAISE EXCEPTION '재고가 부족합니다. (현재 재고: %)', v_prev_stock;
  END IF;

  v_new_stock := v_prev_stock - p_quantity;

  UPDATE public.products
  SET
    stock = v_new_stock,
    total_sold = total_sold + p_quantity,
    status = CASE WHEN v_new_stock = 0 THEN 'sold_out' ELSE status END
  WHERE id = p_product_id;

  INSERT INTO public.inventory_movements (
    product_id, movement_type, quantity, previous_stock, current_stock, reason
  ) VALUES (
    p_product_id, 'ORDER', -p_quantity, v_prev_stock, v_new_stock, p_reason
  );

  RETURN TRUE;
END;
$$;

-- =========================================================
-- Supabase RLS (Row Level Security) 정책
-- =========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.limited_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Profiles: 본인 조회/수정 가능 (단 role 변경은 트리거로 차단), 관리자는 전체 조회 가능
CREATE POLICY "Users can view own profile or admin can view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Categories & Products: 누구나 조회 가능, 관리자만 생성/수정/삭제 가능
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT USING (is_deleted = false OR public.is_admin());

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL USING (public.is_admin());

-- Orders: 본인 주문 조회/생성 가능, 관리자는 모든 주문 조회/수정 가능
CREATE POLICY "Users can view own orders or admin all"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Authenticated users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- Inventory movements: 관리자만 조회 및 생성 가능
CREATE POLICY "Admins can view and manage inventory movements"
  ON public.inventory_movements FOR ALL
  USING (public.is_admin());
