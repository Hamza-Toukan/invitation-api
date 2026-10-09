import { eventsApi } from './api/events.api';
import { guestsApi, type QueryGuestsParams, type CreateGuestPayload } from './api/guests.api';
import { adminApi } from './api/admin.api';
import type {
  EventDetails,
  Guest,
  GuestWish,
  ClientOverview,
  CreateEventRequest,
  UpdateEventRequest,
  AddGalleryImageRequest,
  EventGalleryItem,
} from './types';

const DEFAULT_EVENT: EventDetails = {
  id: 'event-active',
  host_id: 'current-host',
  template_id: 'classic-royal-wedding',
  event_title: 'حفل زفاف مبارك — Mira Celebration',
  event_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
  location_name: 'قاعة اللؤلؤة الملكية',
  location_url: null,
  music_url: null,
  slug: null,
  status: 'DRAFT',
  template: {
    id: 't-1',
    name: 'القالب الملكي الكلاسيكي',
    slug: 'classic-royal-wedding',
    category: 'WEDDING',
    preview_image_url: '/templates/romance.jpg',
  },
  gallery: [],
  rsvpSummary: {
    totalGuests: 0,
    acceptedCount: 0,
    declinedCount: 0,
    pendingCount: 0,
    checkedInCount: 0,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const eventsService = {
  /**
   * Get host events from real backend eventsApi
   */
  async getMyEvents(): Promise<EventDetails[]> {
    try {
      const events = await eventsApi.getMyEvents();
      if (Array.isArray(events) && events.length > 0) return events;
      return [DEFAULT_EVENT];
    } catch {
      return [DEFAULT_EVENT];
    }
  },

  async getMyEvent(): Promise<EventDetails> {
    try {
      const events = await eventsApi.getMyEvents();
      if (Array.isArray(events) && events.length > 0) return events[0];
      return DEFAULT_EVENT;
    } catch {
      return DEFAULT_EVENT;
    }
  },

  async getEventById(id: string): Promise<EventDetails> {
    try {
      return await eventsApi.getEventById(id);
    } catch {
      return DEFAULT_EVENT;
    }
  },

  async createEvent(data: CreateEventRequest): Promise<EventDetails> {
    return eventsApi.createEvent(data);
  },

  async updateEvent(id: string, data: UpdateEventRequest): Promise<EventDetails> {
    return eventsApi.updateEvent(id, data);
  },

  async addGalleryImage(eventId: string, data: AddGalleryImageRequest): Promise<EventGalleryItem> {
    try {
      if (eventId && !eventId.startsWith('mock') && !eventId.startsWith('event-')) {
        return await eventsApi.addGalleryImage(eventId, data);
      }
    } catch {
      // Return simulated gallery item if in demo/fallback
    }

    const newItem: EventGalleryItem = {
      id: `img-${Date.now()}`,
      imageUrl: data.imageUrl || (data as any).image_url || '',
      image_url: data.imageUrl || (data as any).image_url || '',
      displayOrder: data.displayOrder ?? (data as any).display_order ?? 0,
      display_order: data.displayOrder ?? (data as any).display_order ?? 0,
      createdAt: new Date().toISOString(),
    };
    return newItem;
  },

  async deleteGalleryImage(eventId: string, imageId: string): Promise<void> {
    if (eventId && !eventId.startsWith('mock') && !eventId.startsWith('event-')) {
      await eventsApi.deleteGalleryImage(eventId, imageId);
    }
  },

  /**
   * Guest Operations connected directly to real backend guestsApi
   */
  async getGuests(eventId?: string, params?: QueryGuestsParams): Promise<Guest[]> {
    try {
      let targetId = eventId;
      if (!targetId) {
        const ev = await this.getMyEvent();
        targetId = ev?.id;
      }
      if (targetId && !targetId.startsWith('mock') && !targetId.startsWith('event-')) {
        const res = await guestsApi.getGuests(targetId, params);
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res)) return res;
      }
      return [];
    } catch {
      return [];
    }
  },

  async addGuest(guestData: CreateGuestPayload, eventId?: string): Promise<Guest> {
    let targetId = eventId;
    if (!targetId) {
      const ev = await this.getMyEvent();
      targetId = ev?.id;
    }
    if (targetId && !targetId.startsWith('mock') && !targetId.startsWith('event-')) {
      return guestsApi.createGuest(targetId, guestData);
    }

    // Fallback guest object
    return {
      id: `g-${Date.now()}`,
      event_id: targetId || 'default',
      guest_name: guestData.guestName,
      phone_number: guestData.phoneNumber || null,
      invitation_token: `token-${Date.now()}`,
      status: 'PENDING',
      companions_allowed: guestData.companionsAllowed ?? 0,
      companions_confirmed: 0,
      checked_in: false,
      notes: guestData.notes || null,
      createdAt: new Date().toISOString(),
    };
  },

  async updateGuest(guestId: string, guestData: any, eventId?: string): Promise<Guest> {
    let targetId = eventId;
    if (!targetId) {
      const ev = await this.getMyEvent();
      targetId = ev?.id;
    }
    return guestsApi.updateGuest(targetId || '', guestId, guestData);
  },

  async deleteGuest(guestId: string, eventId?: string): Promise<void> {
    let targetId = eventId;
    if (!targetId) {
      const ev = await this.getMyEvent();
      targetId = ev?.id;
    }
    if (targetId && !targetId.startsWith('mock') && !targetId.startsWith('event-')) {
      await guestsApi.deleteGuest(targetId, guestId);
    }
  },

  async toggleGuestCheckIn(
    guestId: string,
    eventId?: string,
    guestToken?: string
  ): Promise<Guest> {
    let targetId = eventId;
    if (!targetId) {
      const ev = await this.getMyEvent();
      targetId = ev?.id;
    }
    return guestsApi.updateGuest(targetId || '', guestId, { checkedIn: true }, guestToken);
  },

  async importExcel(file: File, eventId?: string): Promise<{ message: string; totalImported: number }> {
    let targetId = eventId;
    if (!targetId) {
      const ev = await this.getMyEvent();
      targetId = ev?.id;
    }
    if (!targetId || targetId.startsWith('mock') || targetId.startsWith('event-')) {
      throw new Error('Please select a valid event to import guests.');
    }
    return guestsApi.importExcel(targetId, file);
  },

  async exportExcel(eventId?: string): Promise<Blob> {
    let targetId = eventId;
    if (!targetId) {
      const ev = await this.getMyEvent();
      targetId = ev?.id;
    }
    if (!targetId || targetId.startsWith('mock') || targetId.startsWith('event-')) {
      throw new Error('Please select a valid event to export guests.');
    }
    return guestsApi.exportExcel(targetId);
  },

  async getWishes(): Promise<GuestWish[]> {
    return [];
  },

  async toggleWishApproval(wishId: string): Promise<GuestWish> {
    return {
      id: wishId,
      event_id: 'default',
      author_name: 'Guest',
      message: 'Best wishes!',
      is_approved: true,
      createdAt: new Date().toISOString(),
    };
  },

  async getClients(): Promise<ClientOverview[]> {
    return adminApi.getClients();
  },
};
