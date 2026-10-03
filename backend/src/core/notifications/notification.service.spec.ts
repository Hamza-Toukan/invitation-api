import { Test, TestingModule } from '@nestjs/testing';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { NotificationService } from './notification.service';
import { NOTIFICATION_PROVIDER_TOKEN } from './notification-provider.interface';
import { PrismaService } from '../../prisma/prisma.service';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockProvider = {
    sendSms: jest.fn(),
    sendWhatsApp: jest.fn(),
  };

  const mockPrisma = {
    notificationDispatch: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NOTIFICATION_PROVIDER_TOKEN,
          useValue: mockProvider,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should dispatch SMS and record audit log in NotificationDispatch table', async () => {
    (mockProvider.sendSms as jest.Mock).mockResolvedValue({
      success: true,
      messageId: 'sms-12345',
    });
    mockPrisma.notificationDispatch.create.mockResolvedValue({ id: 'disp-1' });

    const result = await service.dispatch({
      eventId: 'evt-1',
      guestId: 'gst-1',
      phoneNumber: '+962791234567',
      channel: NotificationChannel.SMS,
      message: 'You are cordially invited!',
    });

    expect(result.success).toBe(true);
    expect(mockProvider.sendSms).toHaveBeenCalledWith(
      '+962791234567',
      'You are cordially invited!',
    );
    expect(mockPrisma.notificationDispatch.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event_id: 'evt-1',
        guest_id: 'gst-1',
        channel: NotificationChannel.SMS,
        status: NotificationStatus.DELIVERED,
        provider_message_id: 'sms-12345',
      }),
    });
  });

  it('should record FAILED status when provider throws error', async () => {
    (mockProvider.sendWhatsApp as jest.Mock).mockRejectedValue(
      new Error('Provider rate limit reached'),
    );
    mockPrisma.notificationDispatch.create.mockResolvedValue({ id: 'disp-2' });

    const result = await service.dispatch({
      eventId: 'evt-2',
      guestId: 'gst-2',
      phoneNumber: '+962799887766',
      channel: NotificationChannel.WHATSAPP,
      templateName: 'invite_ar',
    });

    expect(result.success).toBe(false);
    expect(mockPrisma.notificationDispatch.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event_id: 'evt-2',
        guest_id: 'gst-2',
        channel: NotificationChannel.WHATSAPP,
        status: NotificationStatus.FAILED,
        error_reason: 'Provider rate limit reached',
      }),
    });
  });
});
