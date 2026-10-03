import { CacheService } from './cache.service';
import type { Cache } from 'cache-manager';

describe('CacheService', () => {
  let service: CacheService;
  let mockCacheManager: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    store?: {
      keys?: jest.Mock;
      reset?: jest.Mock;
    };
  };

  beforeEach(() => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      store: {
        keys: jest.fn().mockResolvedValue(['event:slug:wedding-1', 'event:slug:wedding-2', 'user:profile:1']),
        reset: jest.fn().mockResolvedValue(undefined),
      },
    };

    service = new CacheService(mockCacheManager as unknown as Cache);
  });

  it('should get cached item', async () => {
    mockCacheManager.get.mockResolvedValue({ id: 'evt-1' });

    const result = await service.get('event:slug:wedding-1');
    expect(result).toEqual({ id: 'evt-1' });
    expect(mockCacheManager.get).toHaveBeenCalledWith('event:slug:wedding-1');
  });

  it('should return null when cached item does not exist', async () => {
    mockCacheManager.get.mockResolvedValue(undefined);

    const result = await service.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should set cache item with TTL', async () => {
    await service.set('test-key', { foo: 'bar' }, 30000);
    expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', { foo: 'bar' }, 30000);
  });

  it('should delete a cache key', async () => {
    await service.delete('test-key');
    expect(mockCacheManager.del).toHaveBeenCalledWith('test-key');
  });

  it('should invalidate keys by prefix', async () => {
    await service.invalidatePrefix('event:slug:');
    expect(mockCacheManager.del).toHaveBeenCalledWith('event:slug:wedding-1');
    expect(mockCacheManager.del).toHaveBeenCalledWith('event:slug:wedding-2');
    expect(mockCacheManager.del).not.toHaveBeenCalledWith('user:profile:1');
  });
});
