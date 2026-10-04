import type { EventDetails, Guest, GuestWish, ClientOverview } from './types';

const INITIAL_EVENT: EventDetails = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  host_id: 'host-uuid-0001',
  template_id: '1',
  slug: 'ahmad-and-sara-2026',
  status: 'PUBLISHED',
  event_title: 'حفل زفاف أحمد وسارة',
  event_date: '2026-10-15T18:00:00.000Z',
  location_name: 'فندق الفور سيزونز — عمّان، الأردن',
  location_url: 'https://maps.google.com/?q=31.9539,35.9106',
  location_coordinates: { lat: 31.9539, lng: 35.9106 },
  music_url: '/intro.mp4',
  custom_config: {
    groomName: { ar: 'أحمد التوكان', en: 'Ahmad Toukan' },
    brideName: { ar: 'سارة العلمي', en: 'Sara Al-Alami' },
    welcomeMessage: {
      ar: 'نتشرف بدعوتكم لمشاركتنا فرحتنا بأجمل ليلة في العمر',
      en: 'We are thrilled to invite you to celebrate our love and new beginning',
    },
    dressCode: { ar: 'ملابس رسمية أنيقة', en: 'Black Tie / Formal Evening Wear' },
  },
  template: {
    id: '1',
    name: 'Amalfi Rose',
    slug: 'amalfi-rose',
    category: 'WEDDING',
    preview_image_url: '/templates/romance.jpg',
    hasLiveDemo: true,
    demoUrl: 'https://invitations-a8x.pages.dev/demo/amalfi-rose/',
  },
  gallery: [
    { id: 'g1', image_url: '/templates/romance.jpg', display_order: 1, createdAt: '2026-09-01T12:00:00.000Z' },
    { id: 'g2', image_url: '/templates/pink.jpg', display_order: 2, createdAt: '2026-09-01T12:05:00.000Z' },
    { id: 'g3', image_url: '/templates/white%20and%20pink.jpg', display_order: 3, createdAt: '2026-09-01T12:10:00.000Z' },
    { id: 'g4', image_url: '/templates/yellow.jpg', display_order: 4, createdAt: '2026-09-01T12:15:00.000Z' },
  ],
  rsvpSummary: {
    totalGuests: 120,
    acceptedCount: 78,
    declinedCount: 14,
    pendingCount: 28,
    checkedInCount: 42,
  },
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-10-01T15:30:00.000Z',
};

const INITIAL_GUESTS: Guest[] = [
  {
    id: 'gst-1',
    event_id: '550e8400-e29b-41d4-a716-446655440000',
    guest_name: 'عمر القواسمي وزوجته',
    phone_number: '+962791112233',
    invitation_token: 'tok-omar-88',
    status: 'ACCEPTED',
    companions_allowed: 1,
    companions_confirmed: 1,
    checked_in: true,
    checked_in_at: '2026-10-15T18:15:00.000Z',
    notes: 'طاولة العائلة VIP',
    createdAt: '2026-09-05T11:00:00.000Z',
  },
  {
    id: 'gst-2',
    event_id: '550e8400-e29b-41d4-a716-446655440000',
    guest_name: 'د. طارق الحسين',
    phone_number: '+962785554433',
    invitation_token: 'tok-tareq-44',
    status: 'ACCEPTED',
    companions_allowed: 2,
    companions_confirmed: 2,
    checked_in: true,
    checked_in_at: '2026-10-15T18:22:00.000Z',
    notes: 'طاولة 3',
    createdAt: '2026-09-06T14:30:00.000Z',
  },
  {
    id: 'gst-3',
    event_id: '550e8400-e29b-41d4-a716-446655440000',
    guest_name: 'رانية الكردي',
    phone_number: '+962799988776',
    invitation_token: 'tok-rania-99',
    status: 'DECLINED',
    companions_allowed: 1,
    companions_confirmed: 0,
    checked_in: false,
    notes: 'مسافرة خارج البلاد',
    createdAt: '2026-09-08T09:15:00.000Z',
  },
  {
    id: 'gst-4',
    event_id: '550e8400-e29b-41d4-a716-446655440000',
    guest_name: 'م. خالد النجار والعائلة',
    phone_number: '+962772233445',
    invitation_token: 'tok-khaled-12',
    status: 'ACCEPTED',
    companions_allowed: 3,
    companions_confirmed: 3,
    checked_in: false,
    notes: 'طاولة 5',
    createdAt: '2026-09-10T16:40:00.000Z',
  },
  {
    id: 'gst-5',
    event_id: '550e8400-e29b-41d4-a716-446655440000',
    guest_name: 'فرح الشريف',
    phone_number: '+962796677889',
    invitation_token: 'tok-farah-33',
    status: 'PENDING',
    companions_allowed: 1,
    companions_confirmed: 0,
    checked_in: false,
    notes: null,
    createdAt: '2026-09-12T18:00:00.000Z',
  },
  {
    id: 'gst-6',
    event_id: '550e8400-e29b-41d4-a716-446655440000',
    guest_name: 'يزن المجالي',
    phone_number: '+962788877665',
    invitation_token: 'tok-yazan-77',
    status: 'PENDING',
    companions_allowed: 0,
    companions_confirmed: 0,
    checked_in: false,
    notes: null,
    createdAt: '2026-09-14T20:10:00.000Z',
  },
];

const INITIAL_WISHES: GuestWish[] = [
  {
    id: 'w-1',
    event_id: '550e8400-e29b-41d4-a716-446655440000',
    author_name: 'عمر القواسمي',
    message: 'ألف مبارك لأجمل عريسين! بارك الله لكما وبارك عليكما وجمع بينكما في خير.',
    is_approved: true,
    createdAt: '2026-09-20T14:15:00.000Z',
  },
  {
    id: 'w-2',
    event_id: '550e8400-e29b-41d4-a716-446655440000',
    author_name: 'د. طارق الحسين',
    message: 'فرحتنا فيكم لا توصف يا أحمد وسارة. تمنياتي لكم بحياة زوجية مليئة بالحب والسعادة الدائمة.',
    is_approved: true,
    createdAt: '2026-09-22T09:30:00.000Z',
  },
  {
    id: 'w-3',
    event_id: '550e8400-e29b-41d4-a716-446655440000',
    author_name: 'رانية الكردي',
    message: 'كان بودي أكون معكم بهالليلة المميزة! ألف ألف مبروك وإن شاء الله دايماً دياركم عامرة بالأفراح.',
    is_approved: true,
    createdAt: '2026-09-24T18:45:00.000Z',
  },
  {
    id: 'w-4',
    event_id: '550e8400-e29b-41d4-a716-446655440000',
    author_name: 'خالد النجار',
    message: 'أجمل تهانينا القلبية للعروسين. ربي يتمملكم على خير وسعادة.',
    is_approved: true,
    createdAt: '2026-09-25T11:20:00.000Z',
  },
];

const INITIAL_CLIENTS: ClientOverview[] = [
  {
    id: 'cl-1',
    name: 'أحمد التوكان & سارة العلمي',
    phoneNumber: '+962791234567',
    email: 'ahmad@example.com',
    eventTitle: 'حفل زفاف أحمد وسارة',
    eventDate: '2026-10-15T18:00:00.000Z',
    status: 'PUBLISHED',
    templateName: 'Amalfi Rose',
    totalGuests: 120,
    confirmedGuests: 78,
  },
  {
    id: 'cl-2',
    name: 'فيصل الحداد & ليلى طوقان',
    phoneNumber: '+962788990011',
    email: 'faisal@example.com',
    eventTitle: 'حفل خطوبة فيصل وليلى',
    eventDate: '2026-11-20T19:00:00.000Z',
    status: 'PUBLISHED',
    templateName: 'Golden Sunset',
    totalGuests: 85,
    confirmedGuests: 52,
  },
  {
    id: 'cl-3',
    name: 'كريم النابلسي & دينا قاسم',
    phoneNumber: '+962795556677',
    email: 'kareem@example.com',
    eventTitle: 'حفل زفاف كريم ودينا',
    eventDate: '2026-12-05T17:30:00.000Z',
    status: 'DRAFT',
    templateName: 'Soft Blush',
    totalGuests: 150,
    confirmedGuests: 0,
  },
  {
    id: 'cl-4',
    name: 'سيف الدين بدر & هبة صوالحة',
    phoneNumber: '+962773344556',
    email: 'saif@example.com',
    eventTitle: 'حفل زفاف سيف وهبة',
    eventDate: '2026-10-28T20:00:00.000Z',
    status: 'PUBLISHED',
    templateName: 'Burgundy Classic',
    totalGuests: 200,
    confirmedGuests: 145,
  },
];

class MockEventsStore {
  private event: EventDetails = { ...INITIAL_EVENT };
  private guests: Guest[] = [...INITIAL_GUESTS];
  private wishes: GuestWish[] = [...INITIAL_WISHES];
  private clients: ClientOverview[] = [...INITIAL_CLIENTS];

  async getMyEvent(): Promise<EventDetails> {
    await new Promise(r => setTimeout(r, 200));
    return { ...this.event };
  }

  async updateEvent(partial: Partial<EventDetails>): Promise<EventDetails> {
    await new Promise(r => setTimeout(r, 400));
    this.event = { ...this.event, ...partial, updatedAt: new Date().toISOString() };
    return { ...this.event };
  }

  async getGuests(): Promise<Guest[]> {
    await new Promise(r => setTimeout(r, 200));
    return [...this.guests];
  }

  async addGuest(guestData: Omit<Guest, 'id' | 'event_id' | 'invitation_token' | 'createdAt'>): Promise<Guest> {
    await new Promise(r => setTimeout(r, 300));
    const newGuest: Guest = {
      ...guestData,
      id: `gst-${Date.now()}`,
      event_id: this.event.id,
      invitation_token: `tok-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    this.guests.unshift(newGuest);
    this.recalculateRsvp();
    return newGuest;
  }

  async updateGuestStatus(guestId: string, status: Guest['status']): Promise<Guest> {
    await new Promise(r => setTimeout(r, 200));
    const target = this.guests.find(g => g.id === guestId);
    if (!target) throw new Error('Guest not found');
    target.status = status;
    this.recalculateRsvp();
    return { ...target };
  }

  async toggleGuestCheckIn(guestId: string): Promise<Guest> {
    await new Promise(r => setTimeout(r, 200));
    const target = this.guests.find(g => g.id === guestId);
    if (!target) throw new Error('Guest not found');
    target.checked_in = !target.checked_in;
    target.checked_in_at = target.checked_in ? new Date().toISOString() : null;
    this.recalculateRsvp();
    return { ...target };
  }

  async deleteGuest(guestId: string): Promise<void> {
    await new Promise(r => setTimeout(r, 200));
    this.guests = this.guests.filter(g => g.id !== guestId);
    this.recalculateRsvp();
  }

  async getWishes(): Promise<GuestWish[]> {
    await new Promise(r => setTimeout(r, 200));
    return [...this.wishes];
  }

  async toggleWishApproval(wishId: string): Promise<GuestWish> {
    await new Promise(r => setTimeout(r, 200));
    const target = this.wishes.find(w => w.id === wishId);
    if (!target) throw new Error('Wish not found');
    target.is_approved = !target.is_approved;
    return { ...target };
  }

  async getClients(): Promise<ClientOverview[]> {
    await new Promise(r => setTimeout(r, 250));
    return [...this.clients];
  }

  private recalculateRsvp() {
    let accepted = 0;
    let declined = 0;
    let pending = 0;
    let checkedIn = 0;

    for (const g of this.guests) {
      if (g.status === 'ACCEPTED') accepted += 1 + (g.companions_confirmed || 0);
      else if (g.status === 'DECLINED') declined += 1;
      else pending += 1;
      if (g.checked_in) checkedIn += 1 + (g.companions_confirmed || 0);
    }

    this.event.rsvpSummary = {
      totalGuests: accepted + declined + pending,
      acceptedCount: accepted,
      declinedCount: declined,
      pendingCount: pending,
      checkedInCount: checkedIn,
    };
  }
}

export const mockEventsService = new MockEventsStore();
