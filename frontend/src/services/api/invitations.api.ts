import { apiClient } from './client';

export interface PublicGuestInfo {
  id: string;
  name: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  companionsAllowed: number;
  companionsConfirmed: number;
  table: string | null;
}

export interface PublicGalleryItem {
  id: string;
  imageUrl: string;
  order: number;
}

export interface PublicTemplateInfo {
  slug: string;
  category: string;
  config?: Record<string, unknown> | null;
}

export interface PublicEventInfo {
  id: string;
  title: string;
  date: string;
  locationName: string;
  locationCoordinates?: { lat?: number; lng?: number; address?: string } | null;
  locationUrl?: string | null;
  musicUrl?: string | null;
  customConfig?: Record<string, unknown> | null;
  template: PublicTemplateInfo;
  gallery: PublicGalleryItem[];
}

export interface PublicInvitationResponse {
  guest: PublicGuestInfo;
  event: PublicEventInfo;
}

export interface SubmitRsvpRequest {
  status: 'ACCEPTED' | 'DECLINED';
  companionsConfirmed?: number;
  notes?: string;
}

export interface SubmitRsvpResponse {
  message: string;
  guest: {
    id: string;
    name: string;
    status: 'ACCEPTED' | 'DECLINED';
    companionsConfirmed: number;
  };
}

export interface CreateWishRequest {
  authorName: string;
  message: string;
}

export interface PublicWish {
  id: string;
  author_name?: string;
  authorName?: string;
  message: string;
  createdAt: string;
}

export interface CreateWishResponse {
  message: string;
  wish: {
    id: string;
    authorName: string;
    message: string;
    createdAt: string;
  };
}

export const invitationsApi = {
  /**
   * Fetch invitation details by secret token
   */
  getInvitation: async (token: string): Promise<PublicInvitationResponse> => {
    const raw = await apiClient.get<any>(`/invitations/${encodeURIComponent(token)}`);
    return raw?.data?.data || raw?.data || raw;
  },

  /**
   * Submit guest RSVP decision
   */
  submitRsvp: async (token: string, payload: SubmitRsvpRequest): Promise<SubmitRsvpResponse> => {
    const raw = await apiClient.post<any>(`/invitations/${encodeURIComponent(token)}/rsvp`, payload);
    return raw?.data?.data || raw?.data || raw;
  },

  /**
   * Retrieve approved guestbook messages for this invitation's event
   */
  getWishes: async (token: string): Promise<PublicWish[]> => {
    const raw = await apiClient.get<any>(`/invitations/${encodeURIComponent(token)}/wishes`);
    const resData = raw?.data?.data || raw?.data || raw;
    return Array.isArray(resData) ? resData : (resData?.wishes || resData?.data || []);
  },

  /**
   * Submit a congratulations wish to the event guestbook
   */
  submitWish: async (token: string, payload: CreateWishRequest): Promise<CreateWishResponse> => {
    const raw = await apiClient.post<any>(`/invitations/${encodeURIComponent(token)}/wishes`, payload);
    return raw?.data?.data || raw?.data || raw;
  },
};
