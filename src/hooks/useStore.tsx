'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  Category,
  Order,
  Profile,
  InventoryMovement,
  CartItem,
  OrderStatus,
  PaymentStatus,
  MovementType,
  ShippingInfo,
  Review,
  CommissionRequest,
  CommissionStatus,
} from '@/types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_PROFILES,
  INITIAL_INVENTORY_MOVEMENTS,
  INITIAL_REVIEWS,
  INITIAL_COMMISSIONS,
  INITIAL_LIKE_COUNTS,
} from '@/lib/supabase/seed-data';
import { getEffectivePrice } from '@/lib/utils';

interface CreateOrderPayload {
  shipping_info: ShippingInfo;
  payment_method: string;
  payment_key: string;
  is_test_order: boolean;
  direct_items?: CartItem[];
}

interface StoreContextType {
  categories: Category[];
  products: Product[];
  orders: Order[];
  profiles: Profile[];
  inventoryMovements: InventoryMovement[];
  cart: CartItem[];
  currentUser: Profile | null;
  isInitialized: boolean;

  // Community, Wishlist, Commission & UI Drawer States
  reviews: Review[];
  commissions: CommissionRequest[];
  wishlist: string[];
  likeCounts: Record<string, number>;
  isCartDrawerOpen: boolean;
  isCommissionModalOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  setCommissionModalOpen: (open: boolean) => void;
  toggleWishlist: (productId: string) => { liked: boolean; count: number };
  addReview: (payload: Omit<Review, 'id' | 'created_at'>) => { success: boolean; message: string };
  createCommission: (payload: Omit<CommissionRequest, 'id' | 'status' | 'created_at'>) => { success: boolean; message: string };
  updateCommissionStatus: (id: string, status: CommissionStatus, adminNote?: string) => { success: boolean; message: string };

  // Auth actions
  login: (email: string, password?: string, requireAdmin?: boolean) => { success: boolean; message: string; user?: Profile };
  signup: (name: string, email: string, password?: string, phone?: string) => { success: boolean; message: string; user?: Profile };
  logout: () => void;
  updateProfile: (updates: Partial<Profile>) => { success: boolean; message: string };
  resetPasswordRequest: (email: string) => { success: boolean; message: string };

  // Cart actions
  addToCart: (item: Omit<CartItem, 'id'>) => { success: boolean; message: string };
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => { success: boolean; message: string };
  updateCartOption: (cartItemId: string, optionId: string, optionLabel: string, additionalPrice: number) => void;
  clearCart: () => void;

  // Order & Checkout actions (Transactional stock check & deduction)
  createOrder: (payload: CreateOrderPayload) => { success: boolean; message: string; order?: Order };
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string, courier?: string, trackingNumber?: string) => { success: boolean; message: string };

  // Product & Limited Management actions (Admin)
  addProduct: (newProd: Omit<Product, 'id' | 'created_at' | 'total_sold'>) => { success: boolean; message: string; product?: Product };
  updateProduct: (productId: string, updates: Partial<Product>, reason?: string) => { success: boolean; message: string };
  deleteProduct: (productId: string) => { success: boolean; message: string };

  // Inventory Management actions (Admin)
  adjustInventory: (productId: string, type: MovementType, quantityChange: number, reason: string) => { success: boolean; message: string };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'cnu_chacha_products_v2',
  ORDERS: 'cnu_chacha_orders_v2',
  PROFILES: 'cnu_chacha_profiles_v2',
  MOVEMENTS: 'cnu_chacha_movements_v2',
  CART: 'cnu_chacha_cart_v2',
  CURRENT_USER: 'cnu_chacha_current_user_v2',
  REVIEWS: 'cnu_chacha_reviews_v2',
  COMMISSIONS: 'cnu_chacha_commissions_v2',
  WISHLIST: 'cnu_chacha_wishlist_v2',
  LIKE_COUNTS: 'cnu_chacha_likes_v2',
};

export function synchronizeProductState(product: Product): Product {
  const now = new Date();
  let status = product.status;

  if (product.is_limited && product.end_at) {
    const endDate = new Date(product.end_at);
    if (!isNaN(endDate.getTime()) && now > endDate && status !== 'hidden') {
      status = 'ended';
    }
  }

  if (product.stock <= 0 && status === 'on_sale') {
    status = 'sold_out';
  } else if (product.stock > 0 && status === 'sold_out') {
    status = 'on_sale';
  }

  return {
    ...product,
    stock: Math.max(0, product.stock),
    status,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(() =>
    INITIAL_PRODUCTS.map(synchronizeProductState)
  );
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(INITIAL_INVENTORY_MOVEMENTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [commissions, setCommissions] = useState<CommissionRequest[]>(INITIAL_COMMISSIONS);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(INITIAL_LIKE_COUNTS);
  const [isCartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [isCommissionModalOpen, setCommissionModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load persisted state from localStorage
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) {
        const parsed: Product[] = JSON.parse(savedProducts);
        setProducts(parsed.map(synchronizeProductState));
      }

      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (savedProfiles) setProfiles(JSON.parse(savedProfiles));

      const savedMovements = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      if (savedMovements) setInventoryMovements(JSON.parse(savedMovements));

      const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      const savedReviews = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (savedReviews) setReviews(JSON.parse(savedReviews));

      const savedCommissions = localStorage.getItem(STORAGE_KEYS.COMMISSIONS);
      if (savedCommissions) setCommissions(JSON.parse(savedCommissions));

      const savedWishlist = localStorage.getItem(STORAGE_KEYS.WISHLIST);
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

      const savedLikes = localStorage.getItem(STORAGE_KEYS.LIKE_COUNTS);
      if (savedLikes) setLikeCounts(JSON.parse(savedLikes));
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save state changes
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(inventoryMovements));
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
      localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(commissions));
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
      localStorage.setItem(STORAGE_KEYS.LIKE_COUNTS, JSON.stringify(likeCounts));
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  }, [
    products,
    orders,
    profiles,
    inventoryMovements,
    cart,
    reviews,
    commissions,
    wishlist,
    likeCounts,
    currentUser,
    isInitialized,
  ]);

  const login = useCallback(
    (email: string, _password?: string, requireAdmin = false) => {
      const normalized = email.trim().toLowerCase();
      const found = profiles.find((p) => p.email.toLowerCase() === normalized);

      if (!found) {
        return {
          success: false,
          message: '등록되지 않은 이메일입니다. 데모 계정 또는 회원가입 후 이용해주세요.',
        };
      }

      if (requireAdmin && found.role !== 'admin') {
        return {
          success: false,
          message: '관리자 권한이 없는 계정입니다. 일반 회원은 관리자 페이지에 접근할 수 없습니다.',
        };
      }

      setCurrentUser(found);
      if (typeof document !== 'undefined') {
        document.cookie = `cnu_chacha_role=${found.role}; path=/; max-age=86400`;
        document.cookie = `cnu_chacha_uid=${found.id}; path=/; max-age=86400`;
      }
      return { success: true, message: `${found.name}님 환영합니다!`, user: found };
    },
    [profiles]
  );

  const signup = useCallback(
    (name: string, email: string, _password?: string, phone?: string) => {
      const normalized = email.trim().toLowerCase();
      if (profiles.some((p) => p.email.toLowerCase() === normalized)) {
        return { success: false, message: '이미 가입된 이메일 주소입니다.' };
      }

      // 일반 회원가입은 항상 customer 권한으로만 생성됨 (관리자 권한 상승 원천 차단)
      const newProfile: Profile = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: normalized,
        phone: phone || '010-0000-0000',
        postal_code: '34134',
        address: '대전광역시 유성구 대학로 99',
        address_detail: '충남대학교',
        role: 'customer',
        created_at: new Date().toISOString(),
      };

      setProfiles((prev) => [...prev, newProfile]);
      setCurrentUser(newProfile);
      if (typeof document !== 'undefined') {
        document.cookie = `cnu_chacha_role=customer; path=/; max-age=86400`;
        document.cookie = `cnu_chacha_uid=${newProfile.id}; path=/; max-age=86400`;
      }
      return { success: true, message: '회원가입이 완료되었습니다.', user: newProfile };
    },
    [profiles]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    if (typeof document !== 'undefined') {
      document.cookie = 'cnu_chacha_role=; path=/; max-age=0';
      document.cookie = 'cnu_chacha_uid=; path=/; max-age=0';
    }
  }, []);

  const updateProfile = useCallback(
    (updates: Partial<Profile>) => {
      if (!currentUser) {
        return { success: false, message: '로그인이 필요합니다.' };
      }
      // 보안 규칙: 일반 회원이 자신의 role을 변경하는 시도를 철저히 차단
      const safeUpdates = { ...updates };
      delete safeUpdates.role;
      delete safeUpdates.id;

      const updated: Profile = { ...currentUser, ...safeUpdates };
      setCurrentUser(updated);
      setProfiles((prev) => prev.map((p) => (p.id === currentUser.id ? updated : p)));
      return { success: true, message: '회원 정보가 성공적으로 수정되었습니다.' };
    },
    [currentUser]
  );

  const resetPasswordRequest = useCallback(
    (email: string) => {
      const found = profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
      if (!found) {
        return { success: false, message: '해당 이메일로 가입된 계정을 찾을 수 없습니다.' };
      }
      return {
        success: true,
        message: `${email} 주소로 비밀번호 재설정 안내 링크가 발송되었습니다.`,
      };
    },
    [profiles]
  );

  const addToCart = useCallback(
    (item: Omit<CartItem, 'id'>) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        return { success: false, message: '상품 정보를 찾을 수 없습니다.' };
      }
      if (product.status === 'ended') {
        return { success: false, message: '판매 기간이 종료된 한정판 상품입니다.' };
      }
      if (product.stock <= 0 || product.status === 'sold_out') {
        return { success: false, message: '현재 품절된 상품입니다.' };
      }

      const existingIndex = cart.findIndex(
        (c) => c.product_id === item.product_id && c.option_id === item.option_id
      );

      const currentQtyInCart = existingIndex >= 0 ? cart[existingIndex].quantity : 0;
      if (currentQtyInCart + item.quantity > product.stock) {
        return {
          success: false,
          message: `재고가 부족합니다. (현재 구매 가능 수량: ${product.stock}개)`,
        };
      }

      if (existingIndex >= 0) {
        setCart((prev) =>
          prev.map((c, i) =>
            i === existingIndex ? { ...c, quantity: c.quantity + item.quantity } : c
          )
        );
      } else {
        setCart((prev) => [
          ...prev,
          { ...item, id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
        ]);
      }

      return { success: true, message: '장바구니에 상품을 담았습니다.' };
    },
    [products, cart]
  );

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== cartItemId));
  }, []);

  const updateCartQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      if (quantity < 1) {
        return { success: false, message: '최소 주문 수량은 1개입니다.' };
      }
      const target = cart.find((c) => c.id === cartItemId);
      if (!target) return { success: false, message: '장바구니 항목을 찾을 수 없습니다.' };

      const product = products.find((p) => p.id === target.product_id);
      if (!product) return { success: false, message: '상품이 존재하지 않습니다.' };

      if (quantity > product.stock) {
        return {
          success: false,
          message: `재고 수량(${product.stock}개)을 초과하여 담을 수 없습니다.`,
        };
      }

      setCart((prev) =>
        prev.map((c) => (c.id === cartItemId ? { ...c, quantity } : c))
      );
      return { success: true, message: '수량이 변경되었습니다.' };
    },
    [cart, products]
  );

  const updateCartOption = useCallback(
    (cartItemId: string, optionId: string, optionLabel: string, additionalPrice: number) => {
      setCart((prev) =>
        prev.map((c) =>
          c.id === cartItemId
            ? { ...c, option_id: optionId, option_label: optionLabel, additional_price: additionalPrice }
            : c
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const createOrder = useCallback(
    (payload: CreateOrderPayload) => {
      const targetItems = payload.direct_items || cart;
      if (targetItems.length === 0) {
        return { success: false, message: '주문할 상품이 없습니다.' };
      }

      // 1단계: 트랜잭션 사전 검증 (모든 주문 항목의 재고 및 판매 상태 확인, 음수 재고 절대 방지)
      const requestedByProduct = new Map<string, number>();
      for (const item of targetItems) {
        requestedByProduct.set(
          item.product_id,
          (requestedByProduct.get(item.product_id) || 0) + item.quantity
        );
      }

      for (const [productId, totalQty] of Array.from(requestedByProduct.entries())) {
        const product = products.find((p) => p.id === productId);
        if (!product) {
          return { success: false, message: '존재하지 않는 상품이 포함되어 있습니다.' };
        }
        const synced = synchronizeProductState(product);
        if (synced.status === 'ended') {
          return {
            success: false,
            message: `[${product.name}] 상품의 한정 판매 기간이 종료되어 주문할 수 없습니다.`,
          };
        }
        if (synced.stock < totalQty) {
          return {
            success: false,
            message: `[${product.name}] 상품의 재고가 부족합니다. (남은 재고: ${synced.stock}개, 요청 수량: ${totalQty}개)`,
          };
        }
      }

      const nowIso = new Date().toISOString();
      const datePart = nowIso.slice(0, 10).replace(/-/g, '');
      const randomSeq = Math.floor(100 + Math.random() * 900);
      const orderId = `ord-${Date.now()}`;
      const orderNumber = `CNU-${datePart}-${randomSeq}`;

      // 2단계: 주문 당시 상품명, 단가, 옵션 정보 스냅샷 생성 (과거 판매 기록 보존)
      const orderItems = targetItems.map((item, idx) => {
        const product = products.find((p) => p.id === item.product_id)!;
        const unitPrice = getEffectivePrice(product.price, product.sale_price) + (item.additional_price || 0);
        return {
          id: `oi-${Date.now()}-${idx}`,
          order_id: orderId,
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          category_name: product.category_name,
          option_text: item.option_label || '기본 옵션',
          price: unitPrice,
          quantity: item.quantity,
          subtotal: unitPrice * item.quantity,
          image_url: product.image_url,
        };
      });

      const subtotalSum = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
      const shippingFee = subtotalSum >= 30000 ? 0 : 3000;
      const totalAmount = subtotalSum + shippingFee;

      const newOrder: Order = {
        id: orderId,
        order_number: orderNumber,
        user_id: currentUser?.id || 'guest-user',
        user_name: payload.shipping_info.recipient_name || currentUser?.name || '비회원 고객',
        user_email: currentUser?.email || 'guest@cnu.ac.kr',
        user_phone: payload.shipping_info.recipient_phone,
        total_amount: totalAmount,
        shipping_fee: shippingFee,
        payment_status: '완료',
        order_status: '결제 완료',
        shipping_address: `(${payload.shipping_info.postal_code}) ${payload.shipping_info.address} ${payload.shipping_info.address_detail}`.trim(),
        shipping_info: payload.shipping_info,
        payment_method: payload.payment_method,
        payment_key: payload.payment_key,
        is_test_order: payload.is_test_order,
        items: orderItems,
        status_history: [
          {
            id: `osh-${Date.now()}`,
            order_id: orderId,
            previous_status: null,
            new_status: '결제 완료',
            changed_by: payload.is_test_order ? '시스템 (테스트 결제승인)' : '시스템 (결제승인)',
            note: `${payload.payment_method} 결제 완료`,
            created_at: nowIso,
          },
        ],
        created_at: nowIso,
      };

      // 3단계: 상품 재고 차감, 한정판 재고 0 시 자동 품절 처리 및 재고 변경 이력 기록
      const newMovements: InventoryMovement[] = [];
      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          const deductQty = requestedByProduct.get(p.id);
          if (!deductQty) return p;

          const prevStock = p.stock;
          const nextStock = Math.max(0, prevStock - deductQty);
          newMovements.push({
            id: `inv-mov-${Date.now()}-${p.id}`,
            product_id: p.id,
            product_name: p.name,
            product_sku: p.sku,
            movement_type: 'ORDER',
            quantity: -deductQty,
            previous_stock: prevStock,
            current_stock: nextStock,
            reason: `주문 결제 완료 (${orderNumber})`,
            created_at: nowIso,
          });

          return synchronizeProductState({
            ...p,
            stock: nextStock,
            total_sold: p.total_sold + deductQty,
          });
        })
      );

      setInventoryMovements((prev) => [...newMovements, ...prev]);
      setOrders((prev) => [newOrder, ...prev]);

      if (!payload.direct_items) {
        setCart([]);
      }

      return {
        success: true,
        message: '주문이 성공적으로 완료되었습니다.',
        order: newOrder,
      };
    },
    [cart, products, currentUser]
  );

  const updateOrderStatus = useCallback(
    (
      orderId: string,
      newStatus: OrderStatus,
      note?: string,
      courier?: string,
      trackingNumber?: string
    ) => {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder) {
        return { success: false, message: '주문을 찾을 수 없습니다.' };
      }

      const prevStatus = targetOrder.order_status;
      const wasCanceledOrRefunded = prevStatus === '주문 취소' || prevStatus === '환불 완료';
      const isNowCanceledOrRefunded = newStatus === '주문 취소' || newStatus === '환불 완료';

      const nowIso = new Date().toISOString();

      // 취소 또는 환불로 전환되는 경우 재고 복구 및 판매량 차감 + 이력 기록
      if (!wasCanceledOrRefunded && isNowCanceledOrRefunded) {
        const restoreMovements: InventoryMovement[] = [];
        setProducts((prevProducts) =>
          prevProducts.map((p) => {
            const orderItemForProduct = targetOrder.items.filter((i) => i.product_id === p.id);
            if (orderItemForProduct.length === 0) return p;

            const restoreQty = orderItemForProduct.reduce((sum, i) => sum + i.quantity, 0);
            const prevStock = p.stock;
            const nextStock = prevStock + restoreQty;

            restoreMovements.push({
              id: `inv-mov-${Date.now()}-${p.id}`,
              product_id: p.id,
              product_name: p.name,
              product_sku: p.sku,
              movement_type: newStatus === '환불 완료' ? 'REFUND' : 'CANCEL',
              quantity: restoreQty,
              previous_stock: prevStock,
              current_stock: nextStock,
              reason: `${newStatus} 처리로 인한 재고 복구 (${targetOrder.order_number})`,
              created_at: nowIso,
            });

            return synchronizeProductState({
              ...p,
              stock: nextStock,
              total_sold: Math.max(0, p.total_sold - restoreQty),
            });
          })
        );
        setInventoryMovements((prev) => [...restoreMovements, ...prev]);
      } else if (wasCanceledOrRefunded && !isNowCanceledOrRefunded) {
        // 취소/환불 상태에서 다시 정상 주문 상태로 복원하는 경우 재고 재차감
        const deductMovements: InventoryMovement[] = [];
        setProducts((prevProducts) =>
          prevProducts.map((p) => {
            const orderItemForProduct = targetOrder.items.filter((i) => i.product_id === p.id);
            if (orderItemForProduct.length === 0) return p;

            const deductQty = orderItemForProduct.reduce((sum, i) => sum + i.quantity, 0);
            const prevStock = p.stock;
            const nextStock = Math.max(0, prevStock - deductQty);

            deductMovements.push({
              id: `inv-mov-${Date.now()}-${p.id}`,
              product_id: p.id,
              product_name: p.name,
              product_sku: p.sku,
              movement_type: 'ORDER',
              quantity: -deductQty,
              previous_stock: prevStock,
              current_stock: nextStock,
              reason: `주문 상태 정상 복원(${newStatus})에 따른 재고 차감 (${targetOrder.order_number})`,
              created_at: nowIso,
            });

            return synchronizeProductState({
              ...p,
              stock: nextStock,
              total_sold: p.total_sold + deductQty,
            });
          })
        );
        setInventoryMovements((prev) => [...deductMovements, ...prev]);
      }

      let nextPaymentStatus: PaymentStatus = targetOrder.payment_status;
      if (newStatus === '주문 취소') nextPaymentStatus = '취소';
      else if (newStatus === '환불 완료') nextPaymentStatus = '환불';
      else if (newStatus === '결제 대기') nextPaymentStatus = '대기';
      else nextPaymentStatus = '완료';

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            order_status: newStatus,
            payment_status: nextPaymentStatus,
            shipping_info: {
              ...o.shipping_info,
              courier: courier !== undefined ? courier : o.shipping_info.courier,
              tracking_number:
                trackingNumber !== undefined ? trackingNumber : o.shipping_info.tracking_number,
            },
            status_history: [
              {
                id: `osh-${Date.now()}`,
                order_id: orderId,
                previous_status: prevStatus,
                new_status: newStatus,
                changed_by: currentUser?.name || '관리자',
                note: note || `${prevStatus} → ${newStatus} 상태 변경`,
                created_at: nowIso,
              },
              ...o.status_history,
            ],
          };
        })
      );

      return {
        success: true,
        message: `주문 상태가 [${newStatus}](으)로 변경되었습니다.`,
      };
    },
    [orders, currentUser]
  );

  const addProduct = useCallback(
    (newProd: Omit<Product, 'id' | 'created_at' | 'total_sold'>) => {
      const nowIso = new Date().toISOString();
      const created: Product = synchronizeProductState({
        ...newProd,
        id: `prod-${Date.now()}`,
        total_sold: 0,
        created_at: nowIso,
      });

      setProducts((prev) => [created, ...prev]);

      if (created.stock > 0) {
        setInventoryMovements((prev) => [
          {
            id: `inv-mov-${Date.now()}`,
            product_id: created.id,
            product_name: created.name,
            product_sku: created.sku,
            movement_type: 'IN',
            quantity: created.stock,
            previous_stock: 0,
            current_stock: created.stock,
            reason: '신규 상품 등록 초기 재고',
            created_at: nowIso,
          },
          ...prev,
        ]);
      }

      return { success: true, message: '신규 상품이 등록되었습니다.', product: created };
    },
    []
  );

  const updateProduct = useCallback(
    (productId: string, updates: Partial<Product>, reason = '관리자 상품 정보 수정') => {
      const existing = products.find((p) => p.id === productId);
      if (!existing) {
        return { success: false, message: '수정할 상품을 찾을 수 없습니다.' };
      }

      const nowIso = new Date().toISOString();
      if (updates.stock !== undefined && updates.stock !== existing.stock) {
        const diff = updates.stock - existing.stock;
        setInventoryMovements((prev) => [
          {
            id: `inv-mov-${Date.now()}`,
            product_id: existing.id,
            product_name: updates.name || existing.name,
            product_sku: updates.sku || existing.sku,
            movement_type: diff > 0 ? 'IN' : 'ADJUST',
            quantity: diff,
            previous_stock: existing.stock,
            current_stock: Math.max(0, updates.stock!),
            reason,
            created_at: nowIso,
          },
          ...prev,
        ]);
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? synchronizeProductState({ ...p, ...updates }) : p
        )
      );

      return { success: true, message: '상품 정보가 수정되었습니다.' };
    },
    [products]
  );

  const deleteProduct = useCallback((productId: string) => {
    // 삭제 시 기존 주문 기록(orders.items)의 상품명과 가격 스냅샷은 그대로 보존됨
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((c) => c.product_id !== productId));
    return {
      success: true,
      message: '상품이 삭제되었습니다. (기존 주문 내역의 판매 기록은 안전하게 보존됩니다)',
    };
  }, []);

  const adjustInventory = useCallback(
    (productId: string, type: MovementType, quantityChange: number, reason: string) => {
      const target = products.find((p) => p.id === productId);
      if (!target) {
        return { success: false, message: '상품을 찾을 수 없습니다.' };
      }

      const prevStock = target.stock;
      let nextStock = prevStock;

      if (type === 'IN') {
        nextStock = prevStock + Math.abs(quantityChange);
      } else if (type === 'OUT') {
        if (prevStock < Math.abs(quantityChange)) {
          return { success: false, message: '현재 재고보다 많은 수량을 출고할 수 없습니다.' };
        }
        nextStock = prevStock - Math.abs(quantityChange);
      } else {
        // ADJUST: quantityChange를 목표 재고 수량 또는 증감분으로 처리
        nextStock = Math.max(0, prevStock + quantityChange);
      }

      const delta = nextStock - prevStock;
      const nowIso = new Date().toISOString();

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? synchronizeProductState({ ...p, stock: nextStock }) : p
        )
      );

      setInventoryMovements((prev) => [
        {
          id: `inv-mov-${Date.now()}`,
          product_id: target.id,
          product_name: target.name,
          product_sku: target.sku,
          movement_type: type,
          quantity: delta,
          previous_stock: prevStock,
          current_stock: nextStock,
          reason: reason || '관리자 재고 조정',
          created_at: nowIso,
        },
        ...prev,
      ]);

      return {
        success: true,
        message: `[${target.name}] 재고가 ${prevStock}개 → ${nextStock}개로 변경되었습니다.`,
      };
    },
    [products]
  );

  const toggleWishlist = useCallback(
    (productId: string) => {
      const isLiked = wishlist.includes(productId);
      const currentCount = likeCounts[productId] || 120;
      const nextCount = isLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

      setWishlist((prev) =>
        isLiked ? prev.filter((id) => id !== productId) : [...prev, productId]
      );
      setLikeCounts((prev) => ({
        ...prev,
        [productId]: nextCount,
      }));

      return { liked: !isLiked, count: nextCount };
    },
    [wishlist, likeCounts]
  );

  const addReview = useCallback(
    (payload: Omit<Review, 'id' | 'created_at'>) => {
      if (!payload.author.trim() || !payload.comment.trim()) {
        return { success: false, message: '작성자명과 후기 내용을 모두 입력해주세요.' };
      }
      const newReview: Review = {
        ...payload,
        id: `rev-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setReviews((prev) => [newReview, ...prev]);
      return { success: true, message: '소중한 구매 후기가 등록되었습니다!' };
    },
    []
  );

  const createCommission = useCallback(
    (payload: Omit<CommissionRequest, 'id' | 'status' | 'created_at'>) => {
      if (!payload.customer_name.trim() || !payload.phone.trim() || !payload.details.trim()) {
        return { success: false, message: '필수 항목을 모두 입력해주세요.' };
      }
      const newComm: CommissionRequest = {
        ...payload,
        id: `comm-${Date.now()}`,
        status: '접수 대기',
        admin_note: '',
        created_at: new Date().toISOString(),
      };
      setCommissions((prev) => [newComm, ...prev]);
      return {
        success: true,
        message: '차차 굿즈 맞춤 제작 의뢰가 접수되었습니다! 담당 학생 디자이너가 검토 후 연락드립니다.',
      };
    },
    []
  );

  const updateCommissionStatus = useCallback(
    (id: string, status: CommissionStatus, adminNote?: string) => {
      setCommissions((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status,
                admin_note: adminNote !== undefined ? adminNote : c.admin_note,
              }
            : c
        )
      );
      return { success: true, message: `의뢰 상태가 [${status}](으)로 변경되었습니다.` };
    },
    []
  );

  return (
    <StoreContext.Provider
      value={{
        categories,
        products,
        orders,
        profiles,
        inventoryMovements,
        cart,
        currentUser,
        isInitialized,
        reviews,
        commissions,
        wishlist,
        likeCounts,
        isCartDrawerOpen,
        isCommissionModalOpen,
        setCartDrawerOpen,
        setCommissionModalOpen,
        toggleWishlist,
        addReview,
        createCommission,
        updateCommissionStatus,
        login,
        signup,
        logout,
        updateProfile,
        resetPasswordRequest,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateCartOption,
        clearCart,
        createOrder,
        updateOrderStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustInventory,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
