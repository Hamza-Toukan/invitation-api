import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { FastifyReply } from 'fastify';
import { BYPASS_TRANSFORM_KEY } from './bypass-transform.decorator';
import type { ApiResponse } from '../response/api-response.interface';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | T>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | T> {
    const isBypassed = this.reflector.getAllAndOverride<boolean>(
      BYPASS_TRANSFORM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isBypassed) {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<FastifyReply>();

    return next.handle().pipe(
      map((data: unknown) => {
        const statusCode = response?.statusCode ?? HttpStatus.OK;

        // If response data is already wrapped or null/undefined
        let message = 'Operation completed successfully';
        let responseData = data as T;

        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          'data' in data &&
          'success' in data
        ) {
          return data as ApiResponse<T>;
        }

        // If service returns an object with a custom message and data payload
        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          typeof (data as Record<string, unknown>).message === 'string' &&
          Object.keys(data).length <= 2 &&
          ('data' in data || Object.keys(data).length === 1)
        ) {
          const obj = data as Record<string, unknown>;
          message = obj.message as string;
          responseData = (obj.data !== undefined ? obj.data : null) as T;
        }

        return {
          success: true,
          statusCode,
          message,
          data: responseData ?? (null as unknown as T),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
