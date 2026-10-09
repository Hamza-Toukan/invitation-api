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
  previewImageUrl?: string | null;
  hasLiveDemo?: boolean;
  demoUrl?: string;
}

export interface EventGalleryItem {
  id: string;
  image_url: string;
  imageUrl?: string;
  display_order: number;
  displayOrder?: number;
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
  eventId?: string;
  guest_name: string;
  guestName?: string;
  phone_number?: string | null;
  phoneNumber?: string | null;
  invitation_token: string;
  invitationToken?: string;
  status: GuestStatus;
  companions_allowed: number;
  companionsAllowed?: number;
  companions_confirmed: number;
  companionsConfirmed?: number;
  checked_in: boolean;
  checkedIn?: boolean;
  checked_in_at?: string | null;
  checkedInAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface GuestWish {
  id: string;
  event_id: string;
  eventId?: string;
  author_name: string;
  authorName?: string;
  message: string;
  is_approved: boolean;
  isApproved?: boolean;
  createdAt: string;
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface EventDetails {
  id: string;
  host_id: string;
  hostId?: string;
  template_id: string;
  templateId?: string;
  slug: string | null;
  status: EventStatus;

  // Title
  event_title: string;
  eventTitle?: string;

  // Date
  event_date: string;
  eventDate?: string;

  // Location / Venue
  location_name: string | null;
  locationName?: string | null;
  venue_name?: string | null;
  venueName?: string | null;

  location_url: string | null;
  locationUrl?: string | null;
  venue_address?: string | null;
  venueAddress?: string | null;

  location_coordinates?: LocationCoordinates | null;
  locationCoordinates?: LocationCoordinates | null;

  // Music
  music_url: string | null;
  musicUrl?: string | null;

  // Custom Configuration
  custom_config?: {
    brideName?: { ar: string; en: string };
    groomName?: { ar: string; en: string };
    welcomeMessage?: { ar: string; en: string };
    dressCode?: { ar: string; en: string };
    [key: string]: any;
  } | null;
  customConfig?: Record<string, any> | null;

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

/**
 * Mutation DTOs strictly aligned with NestJS Swagger API
 */

export interface CreateEventRequest {
  /** Mandatory template UUID string */
  templateId: string;
  /** Event title */
  eventTitle: string;
  /** ISO 8601 date string */
  eventDate: string;
  locationName?: string | null;
  locationUrl?: string | null;
  locationCoordinates?: LocationCoordinates | null;
  musicUrl?: string | null;
  customConfig?: Record<string, any> | null;

  // Backwards-compatibility aliases for legacy code
  template_id?: string;
  event_title?: string;
  event_date?: string;
  location_name?: string | null;
  location_url?: string | null;
  location_coordinates?: LocationCoordinates | null;
  music_url?: string | null;
  custom_config?: Record<string, any> | null;
  venue_name?: string | null;
  venueName?: string | null;
  venue_address?: string | null;
  venueAddress?: string | null;
}

export interface UpdateEventRequest {
  templateId?: string;
  eventTitle?: string;
  eventDate?: string;
  locationName?: string | null;
  locationUrl?: string | null;
  locationCoordinates?: LocationCoordinates | null;
  musicUrl?: string | null;
  customConfig?: Record<string, any> | null;

  // Backwards-compatibility aliases for legacy code
  template_id?: string;
  event_title?: string;
  event_date?: string;
  location_name?: string | null;
  location_url?: string | null;
  location_coordinates?: LocationCoordinates | null;
  music_url?: string | null;
  custom_config?: Record<string, any> | null;
  venue_name?: string | null;
  venueName?: string | null;
  venue_address?: string | null;
  venueAddress?: string | null;
}

export interface AddGalleryImageRequest {
  imageUrl: string;
  displayOrder?: number;

  // Backwards-compatibility aliases
  image_url?: string;
  display_order?: number;
}
