import 'dotenv/config';
import { PrismaClient, TemplateCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/invitation_db?schema=public';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // 1. System Settings
  console.log('Inserting / updating SystemSettings...');
  const settings = [
    {
      key: 'PLATFORM_NAME',
      value: { en: 'Aura Interactive Invitations', ar: 'منصة أورا للدعوات التفاعلية' },
      description: 'Platform name displayed in portal and notifications',
    },
    {
      key: 'DEFAULT_CURRENCY',
      value: 'JOD',
      description: 'Primary platform transaction currency',
    },
    {
      key: 'SUPPORT_WHATSAPP',
      value: '+962790000000',
      description: 'Official WhatsApp customer care and support line',
    },
    {
      key: 'EVENT_DEFAULT_GRACE_PERIOD_DAYS',
      value: 14,
      description: 'Days an event remains active after event_date before auto-archiving',
    },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: { key: s.key, value: s.value, description: s.description },
    });
  }

  // 2. Pricing Plans
  console.log('Inserting / updating PricingPlans...');
  const plans = [
    {
      slug: 'basic-tier',
      name: 'باقة الفرح الأساسية (Basic Plan)',
      price: 15.0,
      currency: 'JOD',
      max_guests: 150,
      features: {
        en: [
          'Up to 150 unique guest invitations',
          'Interactive RSVP tracking',
          'Custom music playback',
          'Google Maps venue integration',
          'Basic guest pass downloads',
        ],
        ar: [
          'حتى 150 دعوة مخصصة للضيوف',
          'تتبع تأكيد الحضور (RSVP) لحظياً',
          'تشغيل موسيقى الخلفية المخصصة',
          'موقع القاعة عبر خرائط Google',
          'تنزيل بطاقات الدخول للضيوف',
        ],
      },
      is_active: true,
    },
    {
      slug: 'premium-vip',
      name: 'الباقة الملكية الفاخرة (VIP Royal Plan)',
      price: 35.0,
      currency: 'JOD',
      max_guests: 500,
      features: {
        en: [
          'Up to 500 unique guest invitations',
          'Photo Memories Gallery (up to 15 photos)',
          'Instant WhatsApp / SMS notifications',
          'VIP Entry QR Codes & Table assignments',
          'Live attendance scanner for reception desk',
          'Export RSVP and guest list to Excel/PDF',
        ],
        ar: [
          'حتى 500 دعوة مخصصة للضيوف',
          'معرض صور الذكريات (حتى 15 صورة)',
          'إرسال إشعارات وتذكير واتساب و SMS',
          'بطاقات دخول VIP مع QR Code وتوزيع الطاولات',
          'نظام مسح الحضور المباشر لموظفي الاستقبال',
          'تصدير قائمة الحضور إلى Excel و PDF',
        ],
      },
      is_active: true,
    },
  ];

  for (const plan of plans) {
    await prisma.pricingPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        max_guests: plan.max_guests,
        features: plan.features,
        is_active: plan.is_active,
      },
      create: {
        slug: plan.slug,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        max_guests: plan.max_guests,
        features: plan.features,
        is_active: plan.is_active,
      },
    });
  }

  // 3. Core Templates
  console.log('Inserting / updating Core Templates...');
  const templates = [
    {
      slug: 'classic-royal-wedding',
      name: 'القالب الملكي الكلاسيكي (Classic Royal Wedding)',
      category: TemplateCategory.WEDDING,
      preview_image_url: 'https://cdn.aura-invite.com/templates/classic-royal.webp',
      default_config: {
        primaryColor: '#D4AF37', // Gold
        accentColor: '#1F2937',  // Charcoal
        fontFamily: 'Amiri, Playfair Display, serif',
        backgroundEffect: 'golden-glitter',
        coverLayout: 'split-monogram',
        countdownStyle: 'minimal-boxes',
      },
      is_active: true,
    },
    {
      slug: 'modern-floral-engagement',
      name: 'قالب الزهور العصرية (Modern Floral Engagement)',
      category: TemplateCategory.ENGAGEMENT,
      preview_image_url: 'https://cdn.aura-invite.com/templates/modern-floral.webp',
      default_config: {
        primaryColor: '#E0A96D', // Rose blush
        accentColor: '#4A5568',
        fontFamily: 'Cairo, sans-serif',
        backgroundEffect: 'floating-petals',
        coverLayout: 'curved-arch',
        countdownStyle: 'circular-rings',
      },
      is_active: true,
    },
    {
      slug: 'golden-excellence-graduation',
      name: 'قالب التميز الذهبي (Golden Excellence Graduation)',
      category: TemplateCategory.GRADUATION,
      preview_image_url: 'https://cdn.aura-invite.com/templates/golden-graduation.webp',
      default_config: {
        primaryColor: '#2563EB', // Sapphire Blue
        accentColor: '#F59E0B',  // Gold
        fontFamily: 'Tajawal, sans-serif',
        backgroundEffect: 'confetti-burst',
        coverLayout: 'grad-cap-banner',
        countdownStyle: 'digital-card',
      },
      is_active: true,
    },
  ];

  for (const t of templates) {
    await prisma.template.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        category: t.category,
        preview_image_url: t.preview_image_url,
        default_config: t.default_config,
        is_active: t.is_active,
      },
      create: {
        slug: t.slug,
        name: t.name,
        category: t.category,
        preview_image_url: t.preview_image_url,
        default_config: t.default_config,
        is_active: t.is_active,
      },
    });
  }

  // 4. Audio Library Tracks
  console.log('Inserting Curated Audio Tracks...');
  const audioTracks = [
    {
      title: 'زفة أردنية تراثية - دخلة العرسان (Traditional Jordanian Zaffeh)',
      category: 'Zaffeh',
      file_url: 'https://cdn.aura-invite.com/audio/traditional-zaffeh.mp3',
      duration_seconds: 245,
    },
    {
      title: 'معزوفة البيانو الكلاسيكية - الرومانسية الهادئة (Soft Romance Piano)',
      category: 'Classical',
      file_url: 'https://cdn.aura-invite.com/audio/soft-piano-romance.mp3',
      duration_seconds: 180,
    },
    {
      title: 'موسيقى احتفالية التخرج والنجاح (Grand Graduation March)',
      category: 'Graduation',
      file_url: 'https://cdn.aura-invite.com/audio/graduation-grand-march.mp3',
      duration_seconds: 210,
    },
  ];

  for (const audio of audioTracks) {
    const existing = await prisma.audioLibrary.findFirst({
      where: { title: audio.title },
    });
    if (!existing) {
      await prisma.audioLibrary.create({
        data: audio,
      });
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
