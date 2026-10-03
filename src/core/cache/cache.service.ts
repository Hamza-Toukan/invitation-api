import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Retrieves a cached item by key.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      return value ?? null;
    } catch (error) {
      this.logger.warn(`Failed to read cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Stores an item in cache with TTL in milliseconds.
   */
  async set<T>(key: string, value: T, ttlMilliseconds = 60000): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttlMilliseconds);
    } catch (error) {
      this.logger.warn(`Failed to set cache for key ${key}:`, error);
    }
  }

  /**
   * Deletes a specific cache key.
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.warn(`Failed to delete cache key ${key}:`, error);
    }
  }

  /**
   * Invalidates multiple cache keys by prefix (e.g. "event:slug:*").
   */
  async invalidatePrefix(prefix: string): Promise<void> {
    try {
      const store = (this.cacheManager as unknown as { store?: { keys?: () => Promise<string[]> | string[] } }).store;
      if (store?.keys) {
        const allKeys = await store.keys();
        const matchingKeys = allKeys.filter((k: string) => k.startsWith(prefix));
        for (const key of matchingKeys) {
          await this.cacheManager.del(key);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to invalidate keys by prefix ${prefix}:`, error);
    }
  }

  /**
   * Clears the entire cache store.
   */
  async reset(): Promise<void> {
    try {
      const store = (this.cacheManager as unknown as { store?: { reset?: () => Promise<void> } }).store;
      if (store?.reset) {
        await store.reset();
      }
    } catch (error) {
      this.logger.warn('Failed to reset cache store:', error);
    }
  }
}
