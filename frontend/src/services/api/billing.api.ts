import { apiClient } from './client';

export interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  currency: string;
  max_guests?: number;
  maxGuests?: number;
  durationDays?: number;
  features?: {
    en?: string[];
    ar?: string[];
    [key: string]: unknown;
  } | string[] | null;
  is_active?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface ValidateCouponRequest {
  code: string;
  planId: string;
}

export interface CouponValidationResponse {
  valid: boolean;
  couponCode: string;
  originalPrice: number;
  discountAmount: number;
  discountPercentage?: number;
  finalTotal: number;
  finalPrice?: number;
  currency: string;
}

export interface CreateOrderRequest {
  eventId: string;
  planId: string;
  couponCode?: string;
}

export interface ManualPaymentVerificationInfo {
  id: string;
  order_id?: string;
  orderId?: string;
  receipt_image_url: string;
  receiptImageUrl?: string;
  sender_name?: string | null;
  senderName?: string | null;
  cliq_reference?: string | null;
  cliqReference?: string | null;
  admin_notes?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  createdAt: string;
}

export interface OrderResponse {
  id: string;
  event_id?: string;
  eventId?: string;
  user_id?: string;
  userId?: string;
  amount: number | string;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'VERIFIED' | string;
  payment_provider?: string | null;
  paymentProvider?: string | null;
  transaction_reference?: string | null;
  orderNumber?: string;
  createdAt: string;
  event?: {
    id: string;
    event_title?: string;
    eventTitle?: string;
    status?: string;
    slug?: string | null;
    event_date?: string;
  } | null;
  plan?: PricingPlan | null;
  manualVerification?: ManualPaymentVerificationInfo | null;
}

export interface SubmitReceiptDto {
  receiptImageUrl: string;
  senderName?: string;
  referenceNumber?: string;
  cliqReference?: string;
  notes?: string;
}

export interface SubmitReceiptResponse {
  message: string;
  orderId: string;
  verification?: ManualPaymentVerificationInfo;
}

// Fallback helper to support both /pricing-plans /orders and /billing/plans /billing/orders
async function requestWithFallback<T>(
  primaryUrl: string,
  fallbackUrl: string,
  method: 'GET' | 'POST',
  body?: unknown
): Promise<T> {
  try {
    if (method === 'GET') {
      return await apiClient.get<T>(primaryUrl);
    }
    return await apiClient.post<T>(primaryUrl, body);
  } catch (err: any) {
    if (err?.statusCode === 404 && primaryUrl !== fallbackUrl) {
      if (method === 'GET') {
        return await apiClient.get<T>(fallbackUrl);
      }
      return await apiClient.post<T>(fallbackUrl, body);
    }
    throw err;
  }
}

export const billingApi = {
  /**
   * Fetch active pricing tiers (name, price, currency, features, limits)
   */
  getPlans: async (): Promise<PricingPlan[]> => {
    const res = await requestWithFallback<any>('/pricing-plans', '/billing/plans', 'GET');
    const resData = res?.data?.data || res?.data || res;
    return Array.isArray(resData) ? resData : (resData?.plans || resData?.data || []);
  },

  /**
   * Alias for getPlans
   */
  getPricingPlans: async (): Promise<PricingPlan[]> => {
    return billingApi.getPlans();
  },

  /**
   * Validate promotional coupon code against chosen plan
   */
  validateCoupon: async (payload: ValidateCouponRequest): Promise<CouponValidationResponse> => {
    const res = await requestWithFallback<any>(
      '/coupons/validate',
      '/billing/coupons/validate',
      'POST',
      payload
    );

    const data = res?.data?.data || res?.data || res;
    return {
      ...data,
      finalPrice: data.finalPrice ?? data.finalTotal,
    };
  },

  /**
   * Create a new pending checkout order
   */
  createOrder: async (payload: CreateOrderRequest): Promise<OrderResponse> => {
    const res = await requestWithFallback<any>(
      '/orders',
      '/billing/orders',
      'POST',
      payload
    );

    const data = res?.data?.data || res?.data || res;
    return {
      ...data,
      orderNumber: data.orderNumber || data.id?.slice(0, 8).toUpperCase(),
    };
  },

  /**
   * List user's payment history and order statuses
   * Safely unwraps nested array shapes: Array.isArray(resData) ? resData : (resData?.orders || [])
   */
  getMyOrders: async (): Promise<OrderResponse[]> => {
    const res = await requestWithFallback<any>(
      '/orders/my-orders',
      '/billing/orders/my-orders',
      'GET'
    );

    const resData = res?.data?.data || res?.data || res;
    const ordersList: any[] = Array.isArray(resData)
      ? resData
      : Array.isArray(resData?.orders)
      ? resData.orders
      : Array.isArray(resData?.data)
      ? resData.data
      : [];

    return ordersList.map((ord: any) => ({
      ...ord,
      orderNumber: ord.orderNumber || ord.id?.slice(0, 8).toUpperCase(),
    }));
  },

  /**
   * Get single order details by ID
   */
  getOrderById: async (orderId: string): Promise<OrderResponse> => {
    const res = await requestWithFallback<any>(
      `/orders/${encodeURIComponent(orderId)}`,
      `/billing/orders/${encodeURIComponent(orderId)}`,
      'GET'
    );

    const data = res?.data?.data || res?.data || res;
    return {
      ...data,
      orderNumber: data.orderNumber || data.id?.slice(0, 8).toUpperCase(),
    };
  },

  /**
   * Submit manual CliQ transfer payment receipt
   */
  submitCliqReceipt: async (
    orderId: string,
    payload: SubmitReceiptDto
  ): Promise<SubmitReceiptResponse> => {
    const body = {
      receiptImageUrl: payload.receiptImageUrl,
      senderName: payload.senderName || 'Host',
      cliqReference: payload.cliqReference || payload.referenceNumber || undefined,
    };

    const res = await requestWithFallback<any>(
      `/orders/${encodeURIComponent(orderId)}/cliq-receipt`,
      `/billing/orders/${encodeURIComponent(orderId)}/payment-receipt`,
      'POST',
      body
    );

    const data = res?.data?.data || res?.data || res;
    return data;
  },
};

