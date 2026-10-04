import { eventsApi } from './api/events.api';
import { mockEventsService } from './mockEventsService';
import type { EventDetails, Guest, GuestWish, ClientOverview } from './types';

export const eventsService = {
  /**
   * Get host events from real backend, with fallback
   */
  async getMyEvents(): Promise<EventDetails[]> {
    try {
      const events = await eventsApi.getMyEvents();
      if (events && events.length > 0) return events;
      return [await mockEventsService.getMyEvent()];
    } catch (err) {
      console.warn('Real backend getMyEvents failed, falling back to mock:', err);
      return [await mockEventsService.getMyEvent()];
    }
  },

  async getMyEvent(): Promise<EventDetails> {
    try {
      const events = await eventsApi.getMyEvents();
      if (events && events.length > 0) return events[0];
      return await mockEventsService.getMyEvent();
    } catch (err) {
      console.warn('Real backend getMyEvent failed, falling back to mock:', err);
      return await mockEventsService.getMyEvent();
    }
  },

  async getGuests(): Promise<Guest[]> {
    return mockEventsService.getGuests();
  },

  async getWishes(): Promise<GuestWish[]> {
    return mockEventsService.getWishes();
  },

  async updateEvent(partial: Partial<EventDetails>): Promise<EventDetails> {
    try {
      const current = await this.getMyEvent();
      if (current && current.id && !current.id.startsWith('mock')) {
        return await eventsApi.updateEvent(current.id, partial);
      }
      return await mockEventsService.updateEvent(partial);
    } catch (err) {
      console.warn('Real backend updateEvent failed, falling back to mock:', err);
      return await mockEventsService.updateEvent(partial);
    }
  },

  async addGuest(guestData: Omit<Guest, 'id' | 'event_id' | 'createdAt' | 'invitation_token'>): Promise<Guest> {
    return mockEventsService.addGuest(guestData);
  },

  async toggleGuestCheckIn(guestId: string): Promise<Guest> {
    return mockEventsService.toggleGuestCheckIn(guestId);
  },

  async toggleWishApproval(wishId: string): Promise<GuestWish> {
    return mockEventsService.toggleWishApproval(wishId);
  },

  async getClients(): Promise<ClientOverview[]> {
    return mockEventsService.getClients();
  },
};
