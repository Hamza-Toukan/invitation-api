import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { TransformResponseInterceptor } from './transform-response.interceptor';
import { BYPASS_TRANSFORM_KEY } from './bypass-transform.decorator';

describe('TransformResponseInterceptor', () => {
  let interceptor: TransformResponseInterceptor<unknown>;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    interceptor = new TransformResponseInterceptor(reflector);
  });

  const createMockContext = (statusCode = 200): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({ statusCode }),
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;
  };

  it('should wrap raw data in unified response contract', (done) => {
    const mockContext = createMockContext(200);
    const mockData = { id: 'evt-123', title: 'Wedding' };
    const callHandler: CallHandler = {
      handle: () => of(mockData),
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    interceptor.intercept(mockContext, callHandler).subscribe({
      next: (result) => {
        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('statusCode', 200);
        expect(result).toHaveProperty('message', 'Operation completed successfully');
        expect(result).toHaveProperty('data', mockData);
        expect(result).toHaveProperty('timestamp');
        done();
      },
      error: (err) => done(err),
    });
  });

  it('should preserve custom message if returned as { message, data }', (done) => {
    const mockContext = createMockContext(201);
    const payload = {
      message: 'Event created successfully',
      data: { id: 'evt-456' },
    };
    const callHandler: CallHandler = {
      handle: () => of(payload),
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    interceptor.intercept(mockContext, callHandler).subscribe({
      next: (result) => {
        expect(result).toEqual(
          expect.objectContaining({
            success: true,
            statusCode: 201,
            message: 'Event created successfully',
            data: { id: 'evt-456' },
          }),
        );
        done();
      },
      error: (err) => done(err),
    });
  });

  it('should bypass transformation when @BypassTransform is set', (done) => {
    const mockContext = createMockContext(200);
    const rawBuffer = Buffer.from('excel content');
    const callHandler: CallHandler = {
      handle: () => of(rawBuffer),
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === BYPASS_TRANSFORM_KEY) return true;
      return false;
    });

    interceptor.intercept(mockContext, callHandler).subscribe({
      next: (result) => {
        expect(result).toBe(rawBuffer);
        done();
      },
      error: (err) => done(err),
    });
  });
});
