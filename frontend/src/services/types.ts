export type UserRole = 'HOST' | 'ADMIN' | 'SUPER_ADMIN';

export interface UserProfile {
  id: string;
  phoneNumber: string;
  email?: string | null;
  name?: string | null;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'EXPIRED';
export type GuestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type TemplateCategory = 'WEDDING' | 'ENGAGEMENT' | 'GRADUATION';

export interface TemplateBrief {
  id: string;
  name: string;
  slug: string;
  category: TemplateCategory;
  preview_image_url: string | null;
  hasLiveDemo?: boolean;
  demoUrl?: string;
}

export interface EventGalleryItem {
  id: string;
  image_url: string;
  display_order: number;
  createdAt: string;
}

export interface RsvpSummary {
  totalGuests: number;
  acceptedCount: number;
  declinedCount: number;
  pendingCount: number;
  checkedInCount: number;
}

export interface Guest {
  id: string;
  event_id: string;
  guest_name: string;
  phone_number?: string | null;
  invitation_token: string;
  status: GuestStatus;
  companions_allowed: number;
  companions_confirmed: number;
  checked_in: boolean;
  checked_in_at?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface GuestWish {
  id: string;
  event_id: string;
  author_name: string;
  message: string;
  is_approved: boolean;
  createdAt: string;
}

export interface EventDetails {
  id: string;
  host_id: string;
  template_id: string;
  slug: string | null;
  status: EventStatus;
  event_title: string;
  event_date: string;
  location_name: string | null;
  location_url: string | null;
  location_coordinates?: { lat: number; lng: number } | null;
  music_url: string | null;
  custom_config?: {
    brideName?: { ar: string; en: string };
    groomName?: { ar: string; en: string };
    welcomeMessage?: { ar: string; en: string };
    dressCode?: { ar: string; en: string };
  } | null;
  template: TemplateBrief;
  gallery: EventGalleryItem[];
  rsvpSummary: RsvpSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ClientOverview {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  eventTitle: string;
  eventDate: string;
  status: EventStatus;
  templateName: string;
  totalGuests: number;
  confirmedGuests: number;
}
