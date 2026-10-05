import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_METADATA_KEY = 'CACHEABLE_METADATA';

export interface CacheableOptions {
  ttlSeconds?: number;
  keyPrefix: string;
}

export const Cacheable = (options: CacheableOptions) =>
  SetMetadata(CACHEABLE_METADATA_KEY, options);
