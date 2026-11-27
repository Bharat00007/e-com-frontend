import { apiRequest } from './apiClient';

export interface BackendCustomer {
  id: string;
  fullName: string;
  email: string | null;
  phone?: string | null;
  emailVerified: boolean;
  marketingConsent?: boolean;
}

export interface RegisterInitResponse {
  verificationRequired: boolean;
  email: string;
  maskedEmail: string;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
  message: string;
  devOtp?: string;
  isDevMode?: boolean;
}

export interface ResendOtpResponse {
  message: string;
  maskedEmail?: string;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
  devOtp?: string;
  isDevMode?: boolean;
}

export const authService = {
  getCsrf: () => apiRequest<{ csrfToken: string }>('/auth/csrf'),
  getSession: () =>
    apiRequest<{
      authenticated: boolean;
      customer: BackendCustomer | null;
      hasGuestSession?: boolean;
      csrfToken?: string;
    }>('/auth/session'),
  getEmailConfigStatus: () =>
    apiRequest<{ configured: boolean }>('/auth/email-configuration-status'),
  register: (body: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    marketingConsent?: boolean;
  }) =>
    apiRequest<RegisterInitResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  verifyOtp: (body: { email: string; otp: string }) =>
    apiRequest<{ customer: BackendCustomer; cartMerged?: boolean; csrfToken?: string }>(
      '/auth/verify-otp',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    ),
  resendOtp: (body: { email: string }) =>
    apiRequest<ResendOtpResponse>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: { identifier: string; password: string; rememberMe?: boolean }) =>
    apiRequest<{ customer: BackendCustomer; cartMerged?: boolean; csrfToken?: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    ),
  logout: () => apiRequest<{ message: string }>('/auth/logout', { method: 'POST' }),
  refresh: () => apiRequest<{ refreshed: boolean; csrfToken?: string }>('/auth/refresh', { method: 'POST' }),
};

export const productService = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest<unknown[]>(`/products${qs}`);
  },
  getBySlug: (slug: string) => apiRequest<unknown>(`/products/${slug}`),
  getFeatured: () => apiRequest<unknown[]>('/products/featured'),
  getBestsellers: () => apiRequest<unknown[]>('/products/bestsellers'),
};

export const categoryService = {
  getAll: () => apiRequest<unknown[]>('/categories'),
};

export interface CheckoutQuoteItem {
  id: string;
  variantId: string;
  productId: string;
  name: string;
  packSizeLabel: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  discountApplied: number;
  isSubscription: boolean;
  stockAvailable: number;
  isOutOfStock: boolean;
}

export interface CheckoutQuoteResponse {
  items: CheckoutQuoteItem[];
  totals: {
    subtotal: number;
    subscriptionDiscount: number;
    couponDiscount: number;
    shippingCharge: number;
    taxAmount: number;
    totalAmount: number;
    totalSavings: number;
  };
  couponCode: string | null;
  shippingMethod: 'standard' | 'express';
  isValid: boolean;
  validationErrors: string[];
}

export const cartService = {
  getCart: () => apiRequest<unknown>('/cart'),
  addItem: (body: {
    variantId: string;
    quantity: number;
    isSubscription: boolean;
    frequencyWeeks?: number;
    idempotencyKey?: string;
  }) =>
    apiRequest<unknown>('/cart/items', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateItem: (itemId: string, body: { quantity?: number; isSubscription?: boolean }) =>
    apiRequest<unknown>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  removeItem: (itemId: string) =>
    apiRequest<unknown>(`/cart/items/${itemId}`, { method: 'DELETE' }),
  clearCart: () => apiRequest<unknown>('/cart', { method: 'DELETE' }),
  merge: () =>
    apiRequest<unknown>('/cart/merge', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  applyCoupon: (code: string) =>
    apiRequest<unknown>('/cart/coupon', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
};

export const checkoutService = {
  getQuote: (
    body: {
      shippingMethod?: 'standard' | 'express';
      couponCode?: string;
      pincode?: string;
    },
    signal?: AbortSignal
  ) =>
    apiRequest<CheckoutQuoteResponse>('/checkout/quote', {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    }),
  createOrder: (body: Record<string, unknown>) =>
    apiRequest<unknown>('/checkout/create-order', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export interface OrderTrackingStep {
  status: string;
  label: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isPending: boolean;
  timestamp: string | null;
}

export interface OrderTrackingData {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  currentStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  isTerminal: boolean;
  terminalReason: string | null;
  steps: OrderTrackingStep[];
  shipment: {
    carrier: string;
    trackingNumber?: string | null;
    awbNumber?: string | null;
    carrierTrackingUrl?: string | null;
    status: string;
    estimatedDelivery?: string | null;
    shippedAt?: string | null;
    deliveredAt?: string | null;
  } | null;
  shippingAddress: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    id: string;
    productName: string;
    packSizeLabel: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  history: Array<{
    id: string;
    status: string;
    note?: string | null;
    updatedBy?: string | null;
    carrier?: string | null;
    trackingNumber?: string | null;
    carrierTrackingUrl?: string | null;
    createdAt: string;
  }>;
}

export const orderService = {
  getMyOrders: () => apiRequest<unknown[]>('/orders'),
  getByIdOrNumber: (idOrNumber: string) => apiRequest<unknown>(`/orders/${idOrNumber}`),
  getTracking: (idOrNumber: string) =>
    apiRequest<OrderTrackingData>(`/orders/${idOrNumber}/tracking`),
  cancelOrder: (id: string) => apiRequest<unknown>(`/orders/${id}/cancel`, { method: 'POST' }),
};

export const paymentService = {
  getConfigurationStatus: () =>
    apiRequest<{ onlinePaymentsAvailable: boolean; provider: string; message: string }>(
      '/payments/configuration-status'
    ),
  createGatewayOrder: (orderId: string) =>
    apiRequest<unknown>('/payments/create-gateway-order', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    }),
  verifyPayment: (body: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) =>
    apiRequest<unknown>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const customerService = {
  getProfile: () => apiRequest<BackendCustomer>('/customers/me'),
  updateProfile: (body: { fullName?: string; phone?: string }) =>
    apiRequest<BackendCustomer>('/customers/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};

export const addressService = {
  list: () => apiRequest<unknown[]>('/customers/addresses'),
  create: (body: Record<string, unknown>) =>
    apiRequest<unknown>('/customers/addresses', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    apiRequest<void>(`/customers/addresses/${id}`, { method: 'DELETE' }),
};

export const couponService = {
  validate: (code: string, subtotal: number) =>
    apiRequest<{ code: string; calculatedDiscount: number }>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    }),
};

export const wishlistService = {
  get: () => apiRequest<unknown>('/wishlist'),
  add: (productId: string) =>
    apiRequest<{ added: boolean; productId: string }>(`/wishlist/${productId}`, {
      method: 'POST',
    }),
  remove: (productId: string) =>
    apiRequest<{ removed: boolean; productId: string }>(`/wishlist/${productId}`, {
      method: 'DELETE',
    }),
  toggle: (productId: string) =>
    apiRequest<{ added: boolean; productId: string }>('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    }),
  merge: (productIds: string[]) =>
    apiRequest<{ mergedCount: number; productIds: string[] }>('/wishlist/merge', {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    }),
};

export const adminOrderService = {
  listOrders: () => apiRequest<unknown[]>('/admin/orders'),
  getOrder: (id: string) => apiRequest<unknown>(`/admin/orders/${id}`),
  updateStatus: (
    id: string,
    body: {
      status: string;
      note?: string;
      carrier?: string;
      trackingNumber?: string;
      carrierTrackingUrl?: string;
      estimatedDelivery?: string;
      paymentStatus?: string;
    }
  ) =>
    apiRequest<unknown>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    apiRequest<{
      token: string;
      admin: { id: string; fullName: string; email: string; role: string };
    }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const reviewService = {
  getByProduct: (productId: string) => apiRequest<unknown[]>(`/reviews/product/${productId}`),
  create: (body: { productId: string; rating: number; title?: string; comment: string }) =>
    apiRequest<unknown>('/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const subscriptionService = {
  getPlans: () => apiRequest<unknown[]>('/subscriptions/plans'),
  getMine: () => apiRequest<unknown[]>('/subscriptions'),
  pause: (id: string) => apiRequest<unknown>(`/subscriptions/${id}/pause`, { method: 'POST' }),
  resume: (id: string) => apiRequest<unknown>(`/subscriptions/${id}/resume`, { method: 'POST' }),
  skip: (id: string) => apiRequest<unknown>(`/subscriptions/${id}/skip`, { method: 'POST' }),
  cancel: (id: string) => apiRequest<unknown>(`/subscriptions/${id}/cancel`, { method: 'POST' }),
};

export const shippingService = {
  checkPincode: (pincode: string) =>
    apiRequest<{
      pincode: string;
      serviceable: boolean;
      codAvailable: boolean;
      estimatedDays: string;
      provider: string;
    }>(`/shipping/pincode/${pincode}`),
  track: (trackingNumber: string) => apiRequest<unknown>(`/shipping/track/${trackingNumber}`),
};
