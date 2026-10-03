import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { CacheInterceptor } from './cache.interceptor';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      isGlobal: true,
      ttl: 60 * 1000, // 60 seconds default
    }),
  ],
  providers: [CacheService, CacheInterceptor],
  exports: [CacheService, CacheInterceptor],
})
export class AppCacheModule {}
