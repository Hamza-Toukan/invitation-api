import { apiClient } from './client';
import type { EventDetails, EventGalleryItem } from '../types';

export const eventsApi = {
  /**
   * Get all events belonging to the logged-in host
   */
  async getMyEvents(): Promise<EventDetails[]> {
    return apiClient.get<EventDetails[]>('/events/my-events');
  },

  /**
   * Get single event by ID
   */
  async getEventById(id: string): Promise<EventDetails> {
    return apiClient.get<EventDetails>(`/events/${id}`);
  },

  /**
   * Get public event by custom friendly slug
   */
  async getEventBySlug(slug: string): Promise<EventDetails> {
    return apiClient.get<EventDetails>(`/events/slug/${slug}`);
  },

  /**
   * Create new event draft
   */
  async createEvent(data: Partial<EventDetails>): Promise<EventDetails> {
    return apiClient.post<EventDetails>('/events', data);
  },

  /**
   * Update existing event details
   */
  async updateEvent(id: string, data: Partial<EventDetails>): Promise<EventDetails> {
    return apiClient.patch<EventDetails>(`/events/${id}`, data);
  },

  /**
   * Add image to event gallery
   */
  async addGalleryImage(
    eventId: string,
    data: { image_url: string; display_order?: number }
  ): Promise<EventGalleryItem> {
    return apiClient.post<EventGalleryItem>(`/events/${eventId}/gallery`, data);
  },

  /**
   * Delete image from event gallery
   */
  async deleteGalleryImage(eventId: string, imageId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/events/${eventId}/gallery/${imageId}`);
  },

  /**
   * Publish an event
   */
  async publishEvent(eventId: string): Promise<EventDetails> {
    return apiClient.patch<EventDetails>(`/events/${eventId}/publish`, {});
  },
};
