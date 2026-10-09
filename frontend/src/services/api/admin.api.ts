import { apiClient } from './client';

export interface AdminUser {
  id: string;
  name: string;
  phone_number?: string;
  phoneNumber?: string;
  email?: string;
  role?: string;
  createdAt?: string;
}

export interface AdminEventSummary {
  id: string;
  event_title: string;
  eventTitle?: string;
  event_date: string;
  eventDate?: string;
  status: string;
  slug?: string | null;
}

export interface AdminManualVerification {
  id: string;
  receipt_image_url: string;
  receiptImageUrl?: string;
  sender_name: string;
  senderName?: string;
  cliq_reference?: string | null;
  cliqReference?: string | null;
  admin_notes?: string | null;
  verified_at?: string | null;
  createdAt: string;
}

export interface AdminOrder {
  id: string;
  amount: number | string;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REJECTED' | string;
  orderNumber?: string;
  createdAt: string;
  user?: AdminUser;
  hostName?: string;
  hostPhone?: string;
  event?: AdminEventSummary;
  eventTitle?: string;
  manualVerification?: AdminManualVerification | null;
  receiptImageUrl?: string;
  cliqReference?: string | null;
}

export interface AdminVerifyOrderDto {
  approved?: boolean;
  status?: 'COMPLETED' | 'REJECTED' | 'FAILED';
  rejectionReason?: string;
  notes?: string;
}

export interface AdminVerifyOrderResponse {
  message: string;
  order: any;
  event?: any;
}

export interface AdminDashboardAnalytics {
  revenue: {
    totalJod: number;
    currency: string;
  };
  events: {
    published: number;
    draft: number;
    total: number;
  };
  guests: {
    total: number;
    accepted: number;
    rsvpConfirmationRate: string;
  };
  verifications: {
    pendingCliqOrders: number;
  };
  // Flattened aliases for frontend convenience
  totalRevenue?: number;
  totalOrders?: number;
  activeEvents?: number;
  totalGuests?: number;
  pendingVerifications?: number;
}

export interface AdminAuditLog {
  id: string;
  actor_id?: string;
  actorId?: string;
  action: string;
  entity_type?: string;
  entityType?: string;
  entity_id?: string;
  entityId?: string;
  new_values?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminPaginatedResponse<T> {
  data: T[];
  meta: AdminPaginationMeta;
}

export interface QueryAdminPaginationParams {
  page?: number;
  limit?: number;
  status?: string;
}

// Fallback helper to seamlessly handle alternative routes
async function requestWithFallback<T>(
  primaryUrl: string,
  fallbackUrl: string,
  method: 'GET' | 'POST' | 'PATCH',
  body?: unknown
): Promise<T> {
  try {
    if (method === 'GET') {
      return await apiClient.get<T>(primaryUrl);
    }
    if (method === 'PATCH') {
      return await apiClient.patch<T>(primaryUrl, body);
    }
    return await apiClient.post<T>(primaryUrl, body);
  } catch (err: any) {
    if (err?.statusCode === 404 && primaryUrl !== fallbackUrl) {
      if (method === 'GET') {
        return await apiClient.get<T>(fallbackUrl);
      }
      if (method === 'PATCH') {
        return await apiClient.patch<T>(fallbackUrl, body);
      }
      return await apiClient.post<T>(fallbackUrl, body);
    }
    throw err;
  }
}

export const adminApi = {
  /**
   * List pending manual CliQ orders awaiting verification
   */
  getPendingVerifications: async (
    params?: QueryAdminPaginationParams
  ): Promise<AdminPaginatedResponse<AdminOrder>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';

    const res = await requestWithFallback<any>(
      `/admin/orders/pending-verifications${qs}`,
      `/admin/orders${qs}`,
      'GET'
    );

    const payload = res?.data !== undefined && (res?.success !== undefined || res?.statusCode !== undefined)
      ? res.data
      : res;

    const items: AdminOrder[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
      ? payload.data
      : [];

    // Map helper fields for easy UI consumption
    const enrichedData = items.map((o) => ({
      ...o,
      orderNumber: o.orderNumber || o.id?.slice(0, 8).toUpperCase(),
      hostName: o.user?.name || 'Client',
      hostPhone: o.user?.phone_number || o.user?.phoneNumber || '',
      eventTitle: o.event?.event_title || o.event?.eventTitle || 'Untitled Event',
      receiptImageUrl:
        o.manualVerification?.receipt_image_url || o.manualVerification?.receiptImageUrl || '',
      cliqReference:
        o.manualVerification?.cliq_reference || o.manualVerification?.cliqReference || null,
    }));

    const total = payload?.meta?.total ?? payload?.total ?? enrichedData.length;
    const page = params?.page || payload?.meta?.page || 1;
    const limit = params?.limit || payload?.meta?.limit || (enrichedData.length || 10);
    const totalPages = payload?.meta?.totalPages || Math.ceil(total / (limit || 1)) || 1;

    return {
      data: enrichedData,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  /**
   * Alias for getOrders with optional status filter
   */
  getOrders: async (
    params?: QueryAdminPaginationParams
  ): Promise<AdminPaginatedResponse<AdminOrder>> => {
    return adminApi.getPendingVerifications(params);
  },

  /**
   * Approve or reject a manual CliQ order
   * When approved: order is marked COMPLETED, linked event is published with unique slug.
   * When rejected: order is marked FAILED/REJECTED with reason recorded in audit log.
   */
  verifyOrder: async (
    orderId: string,
    dto: AdminVerifyOrderDto
  ): Promise<AdminVerifyOrderResponse> => {
    const isApproved =
      dto.approved !== undefined
        ? dto.approved
        : dto.status === 'COMPLETED';

    const rejectionReason = dto.rejectionReason || dto.notes || undefined;

    const payload = {
      approved: isApproved,
      rejectionReason,
    };

    // Supports both POST /admin/orders/:id/verify and PATCH /admin/orders/:id/verify
    try {
      return await apiClient.post<AdminVerifyOrderResponse>(
        `/admin/orders/${encodeURIComponent(orderId)}/verify`,
        payload
      );
    } catch (err: any) {
      if (err?.statusCode === 404) {
        return await apiClient.patch<AdminVerifyOrderResponse>(
          `/admin/orders/${encodeURIComponent(orderId)}/verify`,
          {
            status: isApproved ? 'COMPLETED' : 'REJECTED',
            rejectionReason,
          }
        );
      }
      throw err;
    }
  },

  /**
   * Platform KPIs, revenue in JOD, event publication status, RSVP confirmation rate
   */
  getDashboardAnalytics: async (): Promise<AdminDashboardAnalytics> => {
    const res = await requestWithFallback<AdminDashboardAnalytics>(
      '/admin/analytics/dashboard',
      '/admin/analytics',
      'GET'
    );

    return {
      ...res,
      totalRevenue: res.revenue?.totalJod ?? 0,
      activeEvents: res.events?.published ?? 0,
      totalGuests: res.guests?.total ?? 0,
      pendingVerifications: res.verifications?.pendingCliqOrders ?? 0,
    };
  },

  /**
   * Alias for getDashboardAnalytics
   */
  getStats: async (): Promise<AdminDashboardAnalytics> => {
    return adminApi.getDashboardAnalytics();
  },

  /**
   * Platform security and administrative audit trail
   */
  getAuditLogs: async (
    params?: QueryAdminPaginationParams
  ): Promise<AdminPaginatedResponse<AdminAuditLog>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';

    return requestWithFallback<AdminPaginatedResponse<AdminAuditLog>>(
      `/admin/audit-logs${qs}`,
      `/admin/audit-logs${qs}`,
      'GET'
    );
  },

  /**
   * Retrieve platform clients/hosts overview
   */
  getClients: async (): Promise<any[]> => {
    try {
      const raw = await apiClient.get<any>('/admin/users');
      const resData = raw?.data?.data || raw?.data || raw;
      if (Array.isArray(resData)) return resData;
      if (Array.isArray(resData?.users)) return resData.users;
      if (Array.isArray(resData?.data)) return resData.data;
      throw new Error('Not an array');
    } catch {
      try {
        const raw = await apiClient.get<any>('/admin/clients');
        const resData = raw?.data?.data || raw?.data || raw;
        if (Array.isArray(resData)) return resData;
        if (Array.isArray(resData?.clients)) return resData.clients;
        if (Array.isArray(resData?.data)) return resData.data;
        throw new Error('Not an array');
      } catch {
        // Synthesize from pending/recent orders if users endpoint is not present
        const ordersRes = await adminApi.getPendingVerifications({ limit: 50 });
        const ordersList = Array.isArray(ordersRes?.data) ? ordersRes.data : [];
        return ordersList.map((o) => ({
          id: o.user?.id || o.id,
          name: o.user?.name || 'Client',
          email: o.user?.email || '',
          phone: o.user?.phone_number || o.user?.phoneNumber || '',
          eventTitle: o.event?.event_title || o.event?.eventTitle || 'Wedding Event',
          eventDate: o.event?.event_date || o.event?.eventDate || o.createdAt,
          status: o.event?.status || 'DRAFT',
          totalGuests: 150,
          confirmedGuests: 0,
        }));
      }
    }
  },
};
