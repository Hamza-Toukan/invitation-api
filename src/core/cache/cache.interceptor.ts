import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { FastifyRequest } from 'fastify';
import { CacheService } from './cache.service';
import { CACHEABLE_METADATA_KEY, CacheableOptions } from './cacheable.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const options = this.reflector.getAllAndOverride<CacheableOptions | undefined>(
      CACHEABLE_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<FastifyRequest>();
    const url = req.url || '';
    const cacheKey = `${options.keyPrefix}:${url}`;

    const cachedResponse = await this.cacheService.get(cacheKey);
    if (cachedResponse !== null && cachedResponse !== undefined) {
      return of(cachedResponse);
    }

    const ttlMs = (options.ttlSeconds ?? 60) * 1000;

    return next.handle().pipe(
      tap((data) => {
        void this.cacheService.set(cacheKey, data, ttlMs);
      }),
    );
  }
}
