import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';

@Injectable()
export class FastifyThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const fastifyReq = req as unknown as FastifyRequest;

    // 1. Cloudflare header
    const cfConnectingIp = fastifyReq.headers['cf-connecting-ip'];
    if (typeof cfConnectingIp === 'string' && cfConnectingIp.trim().length > 0) {
      return cfConnectingIp.trim();
    }

    // 2. Standard proxy header X-Forwarded-For (take the first IP in client chain)
    const xForwardedFor = fastifyReq.headers['x-forwarded-for'];
    if (typeof xForwardedFor === 'string' && xForwardedFor.trim().length > 0) {
      const firstIp = xForwardedFor.split(',')[0]?.trim();
      if (firstIp) return firstIp;
    } else if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
      const firstIp = xForwardedFor[0]?.split(',')[0]?.trim();
      if (firstIp) return firstIp;
    }

    // 3. Fallback to direct client IP from socket / connection
    return fastifyReq.ip || (fastifyReq.raw?.socket?.remoteAddress ?? '127.0.0.1');
  }
}
