import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { PrismaService } from '../../prisma/prisma.service';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockPrismaService: {
    systemErrorLog: {
      create: jest.Mock;
    };
  };

  const createMockFastifyReply = () => {
    const statusSpy = jest.fn();
    const sendSpy = jest.fn();
    const res = {
      status: statusSpy,
      send: sendSpy,
    } as unknown as FastifyReply;
    statusSpy.mockReturnValue(res);
    sendSpy.mockReturnValue(res);

    return { res, statusSpy, sendSpy };
  };

  const createMockFastifyRequest = (overrides?: Partial<FastifyRequest>) =>
    ({
      url: '/api/v1/events',
      method: 'POST',
      ip: '127.0.0.1',
      params: {},
      query: {},
      headers: {
        'user-agent': 'JestTestRunner/1.0',
        'content-type': 'application/json',
      },
      ...overrides,
    }) as unknown as FastifyRequest;

  const createMockArgumentsHost = (req: FastifyRequest, res: FastifyReply) =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    }) as unknown as ArgumentsHost;

  beforeEach(() => {
    mockPrismaService = {
      systemErrorLog: {
        create: jest.fn().mockResolvedValue({ id: BigInt(1) }),
      },
    };
    filter = new AllExceptionsFilter(mockPrismaService as unknown as PrismaService);
  });

  it('should handle HttpException and send formatted error response without logging to DB', async () => {
    const req = createMockFastifyRequest();
    const { res, statusSpy, sendSpy } = createMockFastifyReply();
    const host = createMockArgumentsHost(req, res);
    const exception = new HttpException('Resource not found', HttpStatus.NOT_FOUND);

    await filter.catch(exception, host);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        path: '/api/v1/events',
        method: 'POST',
        message: 'Resource not found',
      }),
    );
    expect(mockPrismaService.systemErrorLog.create).not.toHaveBeenCalled();
  });

  it('should catch unhandled system Error, send 500, and persist to SystemErrorLog', async () => {
    const req = createMockFastifyRequest();
    const { res, statusSpy, sendSpy } = createMockFastifyReply();
    const host = createMockArgumentsHost(req, res);
    const exception = new Error('Unexpected database failure');

    await filter.catch(exception, host);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        path: '/api/v1/events',
        method: 'POST',
        message: 'Unexpected database failure',
      }),
    );
    expect(mockPrismaService.systemErrorLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        level: 'ERROR',
        message: 'Unexpected database failure',
        service_name: expect.any(String),
      }),
    });
  });

  it('should not crash or fail to reply if persisting to SystemErrorLog throws an error', async () => {
    mockPrismaService.systemErrorLog.create.mockRejectedValueOnce(
      new Error('DB connection pool exhausted'),
    );
    const req = createMockFastifyRequest();
    const { res, statusSpy, sendSpy } = createMockFastifyReply();
    const host = createMockArgumentsHost(req, res);
    const exception = new Error('Catastrophic failure');

    await expect(filter.catch(exception, host)).resolves.not.toThrow();

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(sendSpy).toHaveBeenCalled();
  });
});
