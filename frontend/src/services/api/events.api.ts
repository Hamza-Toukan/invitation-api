import { apiClient } from './client';
import type {
  EventDetails,
  EventGalleryItem,
  CreateEventRequest,
  UpdateEventRequest,
  AddGalleryImageRequest,
} from '../types';

/**
 * Normalizes create payload to strictly camelCase matching NestJS CreateEventDto
 */
export function normalizeCreateEventPayload(
  payload: CreateEventRequest | Record<string, any>
): {
  templateId: string;
  eventTitle: string;
  eventDate: string;
  locationName?: string | null;
  locationUrl?: string | null;
  locationCoordinates?: { lat: number; lng: number } | null;
  musicUrl?: string | null;
  customConfig?: Record<string, any> | null;
} {
  const templateId = payload.templateId || payload.template_id;
  if (!templateId) {
    throw new Error('templateId is required as a valid UUID string to create an event.');
  }

  const eventTitle = payload.eventTitle || payload.event_title;
  if (!eventTitle) {
    throw new Error('eventTitle is required to create an event.');
  }

  const eventDate = payload.eventDate || payload.event_date || new Date().toISOString();

  const locationName =
    payload.locationName !== undefined
      ? payload.locationName
      : payload.location_name !== undefined
      ? payload.location_name
      : payload.venueName !== undefined
      ? payload.venueName
      : payload.venue_name;

  const locationUrl =
    payload.locationUrl !== undefined
      ? payload.locationUrl
      : payload.location_url !== undefined
      ? payload.location_url
      : payload.venueAddress !== undefined
      ? payload.venueAddress
      : payload.venue_address;

  const locationCoordinates =
    payload.locationCoordinates !== undefined
      ? payload.locationCoordinates
      : payload.location_coordinates;

  const musicUrl = payload.musicUrl !== undefined ? payload.musicUrl : payload.music_url;
  const customConfig =
    payload.customConfig !== undefined ? payload.customConfig : payload.custom_config;

  return {
    templateId,
    eventTitle,
    eventDate: typeof eventDate === 'string' ? eventDate : new Date(eventDate).toISOString(),
    ...(locationName !== undefined ? { locationName } : {}),
    ...(locationUrl !== undefined ? { locationUrl } : {}),
    ...(locationCoordinates !== undefined ? { locationCoordinates } : {}),
    ...(musicUrl !== undefined ? { musicUrl } : {}),
    ...(customConfig !== undefined ? { customConfig } : {}),
  };
}

/**
 * Normalizes update payload to strictly camelCase matching NestJS UpdateEventDto
 */
export function normalizeUpdateEventPayload(
  payload: UpdateEventRequest | Record<string, any>
): {
  templateId?: string;
  eventTitle?: string;
  eventDate?: string;
  locationName?: string | null;
  locationUrl?: string | null;
  locationCoordinates?: { lat: number; lng: number } | null;
  musicUrl?: string | null;
  customConfig?: Record<string, any> | null;
} {
  const result: {
    templateId?: string;
    eventTitle?: string;
    eventDate?: string;
    locationName?: string | null;
    locationUrl?: string | null;
    locationCoordinates?: { lat: number; lng: number } | null;
    musicUrl?: string | null;
    customConfig?: Record<string, any> | null;
  } = {};

  if (payload.templateId || payload.template_id) {
    result.templateId = payload.templateId || payload.template_id;
  }
  if (payload.eventTitle !== undefined || payload.event_title !== undefined) {
    result.eventTitle = payload.eventTitle ?? payload.event_title;
  }
  if (payload.eventDate !== undefined || payload.event_date !== undefined) {
    const d = payload.eventDate ?? payload.event_date;
    result.eventDate = typeof d === 'string' ? d : new Date(d).toISOString();
  }

  const locName =
    payload.locationName ?? payload.location_name ?? payload.venueName ?? payload.venue_name;
  if (locName !== undefined) {
    result.locationName = locName;
  }

  const locUrl =
    payload.locationUrl ?? payload.location_url ?? payload.venueAddress ?? payload.venue_address;
  if (locUrl !== undefined) {
    result.locationUrl = locUrl;
  }

  const locCoords = payload.locationCoordinates ?? payload.location_coordinates;
  if (locCoords !== undefined) {
    result.locationCoordinates = locCoords;
  }

  const music = payload.musicUrl ?? payload.music_url;
  if (music !== undefined) {
    result.musicUrl = music;
  }

  const config = payload.customConfig ?? payload.custom_config;
  if (config !== undefined) {
    result.customConfig = config;
  }

  return result;
}

/**
 * Normalizes gallery image payload to strictly camelCase matching AddGalleryImageDto
 */
export function normalizeAddGalleryImagePayload(
  payload: AddGalleryImageRequest | { image_url: string; display_order?: number }
): { imageUrl: string; displayOrder?: number } {
  const imageUrl = (payload as any).imageUrl || (payload as any).image_url;
  if (!imageUrl) {
    throw new Error('imageUrl is required to add a gallery image.');
  }

  const displayOrder = (payload as any).displayOrder ?? (payload as any).display_order ?? 0;
  return {
    imageUrl,
    displayOrder,
  };
}

/**
 * Normalizes and adapts raw event objects from the backend, providing both
 * camelCase and snake_case fields so UI components have complete compatibility.
 */
export function adaptEventDetails(raw: any): EventDetails {
  if (!raw) return raw;

  const eventDateStr =
    raw.event_date instanceof Date
      ? raw.event_date.toISOString()
      : typeof raw.event_date === 'string'
      ? raw.event_date
      : typeof raw.eventDate === 'string'
      ? raw.eventDate
      : new Date().toISOString();

  const gallery: EventGalleryItem[] = Array.isArray(raw.gallery)
    ? raw.gallery.map((g: any) => ({
        id: g.id,
        image_url: g.image_url || g.imageUrl || '',
        imageUrl: g.imageUrl || g.image_url || '',
        display_order: g.display_order ?? g.displayOrder ?? 0,
        displayOrder: g.displayOrder ?? g.display_order ?? 0,
        createdAt:
          typeof g.createdAt === 'string'
            ? g.createdAt
            : g.createdAt?.toISOString?.() || new Date().toISOString(),
      }))
    : [];

  const locationName = raw.location_name ?? raw.locationName ?? null;
  const locationUrl = raw.location_url ?? raw.locationUrl ?? null;
  const locationCoordinates =
    raw.location_coordinates ?? raw.locationCoordinates ?? null;
  const musicUrl = raw.music_url ?? raw.musicUrl ?? null;
  const customConfig = raw.custom_config ?? raw.customConfig ?? null;
  const templateId = raw.template_id || raw.templateId || raw.template?.id || '';
  const hostId = raw.host_id || raw.hostId || '';
  const eventTitle = raw.event_title || raw.eventTitle || '';

  return {
    ...raw,
    id: raw.id,
    host_id: hostId,
    hostId,
    template_id: templateId,
    templateId,
    slug: raw.slug ?? null,
    status: raw.status || 'DRAFT',

    // Title
    event_title: eventTitle,
    eventTitle,

    // Date
    event_date: eventDateStr,
    eventDate: eventDateStr,

    // Venue / Location
    location_name: locationName,
    locationName,
    venue_name: locationName,
    venueName: locationName,

    location_url: locationUrl,
    locationUrl,
    venue_address: locationUrl,
    venueAddress: locationUrl,

    location_coordinates: locationCoordinates,
    locationCoordinates,

    // Music
    music_url: musicUrl,
    musicUrl,

    // Custom Config
    custom_config: customConfig,
    customConfig,

    // Template
    template: raw.template,

    // Gallery
    gallery,

    // RSVP Summary
    rsvpSummary: raw.rsvpSummary || {
      totalGuests: 0,
      acceptedCount: 0,
      declinedCount: 0,
      pendingCount: 0,
      checkedInCount: 0,
    },

    createdAt:
      typeof raw.createdAt === 'string'
        ? raw.createdAt
        : raw.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === 'string'
        ? raw.updatedAt
        : raw.updatedAt?.toISOString?.() || new Date().toISOString(),
  };
}

export const eventsApi = {
  /**
   * Get all events belonging to the logged-in host
   * GET /events/my-events
   */
  async getMyEvents(): Promise<EventDetails[]> {
    const raw = await apiClient.get<any>('/events/my-events');
    const resData = raw?.data?.data || raw?.data || raw;
    const items: any[] = Array.isArray(resData)
      ? resData
      : Array.isArray(resData?.events)
      ? resData.events
      : [];
    return items.map(adaptEventDetails);
  },

  /**
   * Get single event by UUID
   * GET /events/:id
   */
  async getEventById(id: string): Promise<EventDetails> {
    const raw = await apiClient.get<any>(`/events/${id}`);
    const resData = raw?.data?.data || raw?.data || raw;
    return adaptEventDetails(resData);
  },

  /**
   * Create new event invitation draft
   * POST /events
   * Payload normalized strictly to NestJS CreateEventDto (camelCase, templateId UUID)
   */
  async createEvent(data: CreateEventRequest): Promise<EventDetails> {
    const payload = normalizeCreateEventPayload(data);
    const raw = await apiClient.post<any>('/events', payload);
    const resData = raw?.data?.data || raw?.data || raw;
    return adaptEventDetails(resData);
  },

  /**
   * Update existing event details
   * PATCH /events/:id
   * Payload normalized strictly to NestJS UpdateEventDto (camelCase)
   */
  async updateEvent(id: string, data: UpdateEventRequest): Promise<EventDetails> {
    const payload = normalizeUpdateEventPayload(data);
    const raw = await apiClient.patch<any>(`/events/${id}`, payload);
    const resData = raw?.data?.data || raw?.data || raw;
    return adaptEventDetails(resData);
  },

  /**
   * Add image to event photo gallery
   * POST /events/:id/gallery
   * Payload normalized strictly to NestJS AddGalleryImageDto (imageUrl, displayOrder)
   */
  async addGalleryImage(
    eventId: string,
    data: AddGalleryImageRequest
  ): Promise<EventGalleryItem> {
    const payload = normalizeAddGalleryImagePayload(data);
    const raw = await apiClient.post<any>(`/events/${eventId}/gallery`, payload);
    const resData = raw?.data?.data || raw?.data || raw;
    return {
      id: resData.id,
      image_url: resData.image_url || resData.imageUrl || payload.imageUrl,
      imageUrl: resData.imageUrl || resData.image_url || payload.imageUrl,
      display_order: resData.display_order ?? resData.displayOrder ?? payload.displayOrder ?? 0,
      displayOrder: resData.displayOrder ?? resData.display_order ?? payload.displayOrder ?? 0,
      createdAt:
        typeof raw.createdAt === 'string'
          ? raw.createdAt
          : raw.createdAt?.toISOString?.() || new Date().toISOString(),
    };
  },

  /**
   * Delete image from event photo gallery
   * DELETE /events/:id/gallery/:imageId
   */
  async deleteGalleryImage(eventId: string, imageId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/events/${eventId}/gallery/${imageId}`);
  },

  /**
   * Update event status (e.g. to PUBLISHED)
   * PATCH /events/:id with valid status payload (replacing phantom /events/:id/publish)
   */
  async updateEventStatus(eventId: string, status: 'DRAFT' | 'PUBLISHED' | 'EXPIRED'): Promise<EventDetails> {
    return this.updateEvent(eventId, { status } as any);
  },
};
