import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly prisma: PrismaService) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string | object) || exception.message;
        if (resObj.error) {
          details = resObj.error;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const isSystemError =
      !(exception instanceof HttpException) ||
      status >= HttpStatus.INTERNAL_SERVER_ERROR;

    const stackTrace =
      exception instanceof Error ? exception.stack : undefined;

    // Log the error
    if (isSystemError) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${status} - ${typeof message === 'string' ? message : JSON.stringify(message)}`,
        stackTrace,
      );

      // Persist to SystemErrorLog table
      await this.persistSystemError(exception, request, status, stackTrace);
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status} - ${typeof message === 'string' ? message : JSON.stringify(message)}`,
      );
    }

    // Format safe response payload for client
    const clientMessage =
      status >= HttpStatus.INTERNAL_SERVER_ERROR &&
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : message;

    const errorPayload = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: clientMessage,
      ...(details ? { details } : {}),
    };

    response.status(status).send(errorPayload);
  }

  private async persistSystemError(
    exception: unknown,
    request: FastifyRequest,
    status: number,
    stackTrace?: string,
  ): Promise<void> {
    try {
      const errorMessage =
        exception instanceof Error
          ? exception.message
          : typeof exception === 'string'
            ? exception
            : 'Unknown system exception';

      const contextData: Prisma.InputJsonValue = {
        statusCode: status,
        url: request.url,
        method: request.method,
        ip: request.ip ?? 'unknown',
        params: (request.params as Prisma.InputJsonObject) ?? {},
        query: (request.query as Prisma.InputJsonObject) ?? {},
        headers: {
          'user-agent': request.headers['user-agent'] ?? '',
          'content-type': request.headers['content-type'] ?? '',
        },
      };

      await this.prisma.systemErrorLog.create({
        data: {
          level: status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'ERROR' : 'WARN',
          service_name: process.env.SERVICE_NAME ?? 'invitation-api',
          message: errorMessage.substring(0, 1000),
          stack_trace: stackTrace ? stackTrace.substring(0, 4000) : null,
          context_data: contextData,
        },
      });
    } catch (dbError) {
      // Must never crash the HTTP response cycle if logging to DB fails
      this.logger.error(
        'Failed to persist unhandled error to SystemErrorLog table:',
        dbError,
      );
    }
  }
}
