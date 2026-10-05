import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, MemoryHealthIndicator, PrismaHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaService } from '../../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockHealthService = {
    check: jest.fn(),
  };

  const mockPrismaHealth = {
    pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
  };

  const mockMemoryHealth = {
    checkHeap: jest.fn().mockResolvedValue({ memory_heap: { status: 'up' } }),
  };

  const mockPrismaService = {
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthService,
        },
        {
          provide: PrismaHealthIndicator,
          useValue: mockPrismaHealth,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryHealth,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should execute health indicators', async () => {
    const expectedResult = {
      status: 'ok',
      info: {
        database: { status: 'up' },
        memory_heap: { status: 'up' },
      },
      error: {},
      details: {
        database: { status: 'up' },
        memory_heap: { status: 'up' },
      },
    };

    mockHealthService.check.mockImplementation(async (indicators: (() => Promise<unknown>)[]) => {
      for (const indicator of indicators) {
        await indicator();
      }
      return expectedResult;
    });

    const result = await controller.check();
    expect(result).toEqual(expectedResult);
    expect(mockHealthService.check).toHaveBeenCalled();
    expect(mockPrismaHealth.pingCheck).toHaveBeenCalledWith('database', mockPrismaService);
    expect(mockMemoryHealth.checkHeap).toHaveBeenCalledWith('memory_heap', 300 * 1024 * 1024);
  });
});
