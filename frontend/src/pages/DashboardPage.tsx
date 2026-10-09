import { useState, useEffect, useMemo, useRef, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { eventsService } from '../services/eventsService';
import { mediaApi } from '../services/api/media.api';
import { triggerFileDownload } from '../services/api/guests.api';
import { billingApi, type OrderResponse } from '../services/api/billing.api';
import { CliqCheckoutModal } from '../components/CliqCheckoutModal';
import type { EventDetails, Guest, GuestWish, GuestStatus } from '../services/types';
import { BrandLogo } from '../components/BrandLogo';
import { LangSwitch } from '../components/LangSwitch';
import { Btn } from '../components/Btn';

// Icons
const ExternalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 5h5v5M19 5l-8 8" />
    <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function DashboardPage() {
  const { t, lang } = useLang();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [wishes, setWishes] = useState<GuestWish[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | GuestStatus>('ALL');
  const [copied, setCopied] = useState(false);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orders, setOrders] = useState<OrderResponse[]>([]);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    date: '',
    location: '',
  });

  // Add guest form state
  const [guestForm, setGuestForm] = useState({
    name: '',
    phone: '',
    companions: 0,
    notes: '',
  });

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event) return;
    try {
      setIsUploading(true);
      const publicUrl = await mediaApi.uploadMedia(file, 'EVENT_GALLERY');
      const newImage = await eventsService.addGalleryImage(event.id, { imageUrl: publicUrl });
      setEvent(prev => (prev ? { ...prev, gallery: [...prev.gallery, newImage] } : prev));
    } catch (err: any) {
      console.error('Gallery upload error:', err);
      alert(err?.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Guest management states
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const updateOrdersState = useCallback((fetchedOrders: any) => {
    const arr: OrderResponse[] = Array.isArray(fetchedOrders)
      ? fetchedOrders
      : Array.isArray(fetchedOrders?.data)
      ? fetchedOrders.data
      : Array.isArray(fetchedOrders?.data?.data)
      ? fetchedOrders.data.data
      : Array.isArray(fetchedOrders?.orders)
      ? fetchedOrders.orders
      : [];
    setOrders(arr);
  }, []);

  useEffect(() => {
    document.title = t.dashboard.metaTitle;

    eventsService.getMyEvent().then(ev => {
      if (ev) {
        setEvent(ev);
        setEditForm({
          title: ev.event_title || '',
          date: ev.event_date ? ev.event_date.slice(0, 16) : '',
          location: ev.location_name || '',
        });
        eventsService.getGuests(ev.id).then(resGuests => {
          setGuests(Array.isArray(resGuests) ? resGuests : []);
        }).catch(() => setGuests([]));
      }
    }).catch(() => {});

    eventsService.getWishes().then(resWishes => {
      setWishes(Array.isArray(resWishes) ? resWishes : []);
    }).catch(() => setWishes([]));

    billingApi.getMyOrders().then(updateOrdersState).catch(() => setOrders([]));
  }, [t, updateOrdersState]);

  // Live countdown
  useEffect(() => {
    if (!event) return;
    const target = new Date(event.event_date).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const handleCopyLink = () => {
    const link = event ? `${window.location.origin}/invite/${event.slug || event.id}` : window.location.origin;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyGuestLink = (g: Guest) => {
    const token = g.invitation_token || g.invitationToken;
    const baseUrl = window.location.origin;
    const invitePath = event?.slug ? `/invite/${event.slug}` : `/invite/${event?.id}`;
    const link = token ? `${baseUrl}${invitePath}?token=${token}` : `${baseUrl}${invitePath}`;
    navigator.clipboard.writeText(link);
    setCopiedGuestId(g.id);
    setTimeout(() => setCopiedGuestId(null), 2500);
  };

  const handleToggleCheckIn = async (guestId: string) => {
    const targetGuest = guests.find(g => g.id === guestId);
    const updated = await eventsService.toggleGuestCheckIn(
      guestId,
      event?.id,
      targetGuest?.invitation_token || targetGuest?.invitationToken
    );
    setGuests(prev => (Array.isArray(prev) ? prev : []).map(g => (g.id === updated.id ? updated : g)));
    const updatedEv = await eventsService.getMyEvent();
    setEvent(updatedEv);
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الضيف؟' : 'Are you sure you want to delete this guest?')) return;
    try {
      await eventsService.deleteGuest(guestId, event?.id);
      setGuests(prev => (Array.isArray(prev) ? prev : []).filter(g => g.id !== guestId));
      const updatedEv = await eventsService.getMyEvent();
      setEvent(updatedEv);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete guest');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event) return;
    try {
      setIsImportingExcel(true);
      const res = await eventsService.importExcel(file, event.id);
      alert(lang === 'ar' ? `تم استيراد ${res.totalImported} ضيف بنجاح` : `Successfully imported ${res.totalImported} guests`);
      const refreshedGuests = await eventsService.getGuests(event.id);
      setGuests(Array.isArray(refreshedGuests) ? refreshedGuests : []);
      const updatedEv = await eventsService.getMyEvent();
      setEvent(updatedEv);
    } catch (err: any) {
      alert(err?.message || 'Failed to import Excel file');
    } finally {
      setIsImportingExcel(false);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  const handleExportExcel = async () => {
    if (!event) return;
    try {
      setIsExportingExcel(true);
      const blob = await eventsService.exportExcel(event.id);
      triggerFileDownload(blob, `guests-${event.slug || event.id}.xlsx`);
    } catch (err: any) {
      alert(err?.message || 'Failed to export Excel sheet');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleSaveEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!event) return;
    const updated = await eventsService.updateEvent(event.id, {
      eventTitle: editForm.title,
      eventDate: new Date(editForm.date).toISOString(),
      locationName: editForm.location,
    });
    setEvent(updated);
    setIsEditModalOpen(false);
  };

  const handleAddGuest = async (e: FormEvent) => {
    e.preventDefault();
    if (!guestForm.name.trim()) return;

    try {
      const added = await eventsService.addGuest({
        guestName: guestForm.name.trim(),
        phoneNumber: guestForm.phone.trim() || null,
        companionsAllowed: Number(guestForm.companions) || 0,
        notes: guestForm.notes.trim() || null,
      }, event?.id);

      setGuests(prev => [added, ...prev]);
      const updatedEv = await eventsService.getMyEvent();
      setEvent(updatedEv);
      setGuestForm({ name: '', phone: '', companions: 0, notes: '' });
      setIsAddGuestOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to add guest');
    }
  };

  const filteredGuests = useMemo(() => {
    const list = Array.isArray(guests) ? guests : [];
    return list.filter(g => {
      const matchFilter = filter === 'ALL' || g.status === filter;
      const matchSearch =
        !search.trim() ||
        (g.guest_name && g.guest_name.toLowerCase().includes(search.toLowerCase())) ||
        (g.phone_number && g.phone_number.includes(search));
      return matchFilter && matchSearch;
    });
  }, [guests, filter, search]);

  const rsvp = event?.rsvpSummary || {
    totalGuests: 0,
    acceptedCount: 0,
    declinedCount: 0,
    pendingCount: 0,
    checkedInCount: 0,
  };

  const acceptedPct = rsvp.totalGuests ? Math.round((rsvp.acceptedCount / rsvp.totalGuests) * 100) : 0;
  const declinedPct = rsvp.totalGuests ? Math.round((rsvp.declinedCount / rsvp.totalGuests) * 100) : 0;

  return (
    <div className="client-shell" style={{ minHeight: '100vh', background: 'var(--admin-bg, #fdf7f4)' }}>
      {/* Top Header */}
      <header className="admin-header" style={{
        background: 'var(--ivory)',
        borderBottom: '1px solid var(--border-soft)',
        padding: '0.8rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <BrandLogo />
          </a>
          <span style={{
            fontSize: '0.78rem',
            background: 'var(--rose-tint)',
            color: 'var(--rose-gold-deep)',
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 600,
          }}>
            Host Portal
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <LangSwitch />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--gradient-rose)',
              color: 'var(--ivory)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}>
              {user?.name ? user.name.trim().charAt(0) : 'H'}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cocoa)' }} className="hide-mobile">
              {user?.name || 'Ahmad Toukan'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              background: 'none',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-pill)',
              padding: '0.35rem 0.85rem',
              fontSize: '0.85rem',
              color: 'var(--taupe)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {t.admin.nav.logout}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="container" style={{ paddingBlock: '2rem 4rem' }}>
        {/* Welcome & Event Hero Card */}
        {event && (
          <div style={{
            background: 'var(--gradient-blush)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-lg)',
            padding: 'clamp(1.5rem, 3.5vw, 2.5rem)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '2rem',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <span style={{
                  display: 'inline-block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--rose-gold)',
                  marginBottom: '0.4rem',
                }}>
                  {event.template.name} • {event.status}
                </span>
                <h1 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                  color: 'var(--cocoa)',
                  marginBottom: '0.75rem',
                }}>
                  {event.event_title}
                </h1>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--taupe)', fontSize: '0.95rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CalendarIcon />
                    {new Date(event.event_date).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  {event.location_name && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPinIcon />
                      {event.location_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Btn
                  href={event.slug ? `/invite/${event.slug}` : (event.template.demoUrl && !event.template.demoUrl.includes('pages.dev') ? event.template.demoUrl : `/invite/${event.id}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  icon={<ExternalIcon />}
                >
                  {t.dashboard.previewInvite}
                </Btn>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--ivory)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.65rem 1.2rem',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    color: 'var(--cocoa)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? t.dashboard.copied : t.dashboard.copyLink}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'transparent',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.65rem 1.1rem',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    color: 'var(--rose-gold-deep)',
                    cursor: 'pointer',
                  }}
                >
                  <EditIcon /> {t.dashboard.editEvent}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: event.status === 'DRAFT' ? 'var(--teal)' : 'var(--sand-card)',
                    color: event.status === 'DRAFT' ? 'var(--ivory)' : 'var(--teal)',
                    border: event.status === 'DRAFT' ? 'none' : '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.65rem 1.3rem',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    boxShadow: event.status === 'DRAFT' ? '0 4px 14px rgba(18, 54, 58, 0.25)' : 'var(--shadow-xs)',
                  }}
                >
                  <span>💳</span> {t.billing.activateEvent}
                </button>
              </div>
            </div>

            {/* Countdown Box */}
            <div style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-fine)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--taupe)' }}>
                ⏳ {t.dashboard.countdownTo}
              </span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[
                  { label: t.dashboard.countdownDays, val: timeLeft.days },
                  { label: t.dashboard.countdownHours, val: timeLeft.hours },
                  { label: t.dashboard.countdownMinutes, val: timeLeft.minutes },
                  { label: t.dashboard.countdownSeconds, val: timeLeft.seconds },
                ].map((item, idx) => (
                  <div key={idx} style={{
                    background: 'var(--ivory)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.8rem',
                    minWidth: '60px',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-xs)',
                  }}>
                    <span style={{
                      display: 'block',
                      fontFamily: 'var(--font-serif-en)',
                      fontSize: '1.45rem',
                      fontWeight: 700,
                      color: 'var(--rose-gold-deep)',
                      lineHeight: 1,
                    }}>
                      {String(item.val).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--taupe)', textTransform: 'uppercase' }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RSVP Stats Grid & Donut Chart */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}>
          {/* Donut Chart Card */}
          <div style={{
            background: 'var(--ivory)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--cocoa)', marginBottom: '1rem' }}>
              {t.dashboard.rsvpStatsTitle}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              {/* SVG Donut */}
              <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                <svg width="130" height="130" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="40" stroke="rgba(184, 115, 90, 0.12)" strokeWidth="12" fill="none" />
                  {/* Confirmed green segment */}
                  <circle
                    cx="50" cy="50" r="40"
                    stroke="#4f7d5b"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${acceptedPct * 2.51} 251.2`}
                    strokeLinecap="round"
                  />
                  {/* Declined red segment */}
                  <circle
                    cx="50" cy="50" r="40"
                    stroke="#b0564f"
                    strokeWidth="12"
                    fill="none"
                    strokeDashoffset={`-${acceptedPct * 2.51}`}
                    strokeDasharray={`${declinedPct * 2.51} 251.2`}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--cocoa)', lineHeight: 1 }}>
                    {acceptedPct}%
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--taupe)' }}>
                    {t.dashboard.confirmed}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#4f7d5b' }} />
                  <span>{t.dashboard.confirmed}: <strong>{rsvp.acceptedCount}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#b0564f' }} />
                  <span>{t.dashboard.declined}: <strong>{rsvp.declinedCount}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#a9752f' }} />
                  <span>{t.dashboard.pending}: <strong>{rsvp.pendingCount}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Counter Chips */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
          }}>
            {[
              { label: t.dashboard.totalInvited, val: rsvp.totalGuests, color: 'var(--cocoa)', icon: <UsersIcon /> },
              { label: t.dashboard.confirmed, val: rsvp.acceptedCount, color: '#4f7d5b', icon: <CheckIcon /> },
              { label: t.dashboard.declined, val: rsvp.declinedCount, color: '#b0564f', icon: <CloseIcon /> },
              { label: t.dashboard.checkedIn, val: rsvp.checkedInCount, color: 'var(--rose-gold-deep)', icon: <MapPinIcon /> },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'var(--ivory)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-xs)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--taupe)', fontWeight: 600 }}>
                    {stat.label}
                  </span>
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                </div>
                <span style={{
                  fontSize: '2rem',
                  fontFamily: 'var(--font-serif-en)',
                  fontWeight: 700,
                  color: stat.color,
                  marginTop: '0.5rem',
                }}>
                  {stat.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Guest Management Table Section */}
        <section style={{
          background: 'var(--ivory)',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius-lg)',
          padding: 'clamp(1.2rem, 3vw, 2rem)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2.5rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--cocoa)', margin: 0 }}>
              {t.dashboard.guestsTitle} ({filteredGuests.length})
            </h2>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="file"
                ref={excelInputRef}
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                style={{ display: 'none' }}
                onChange={handleImportExcel}
              />
              <button
                type="button"
                onClick={() => excelInputRef.current?.click()}
                disabled={isImportingExcel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'var(--ivory)',
                  color: 'var(--cocoa)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '0.55rem 1rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: isImportingExcel ? 'not-allowed' : 'pointer',
                  opacity: isImportingExcel ? 0.6 : 1,
                }}
              >
                📥 {isImportingExcel ? 'Importing…' : (lang === 'ar' ? 'استيراد Excel' : 'Import Excel')}
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'var(--ivory)',
                  color: 'var(--cocoa)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '0.55rem 1rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: isExportingExcel ? 'not-allowed' : 'pointer',
                  opacity: isExportingExcel ? 0.6 : 1,
                }}
              >
                📤 {isExportingExcel ? 'Exporting…' : (lang === 'ar' ? 'تصدير Excel' : 'Export Excel')}
              </button>
              <button
                type="button"
                onClick={() => setIsAddGuestOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'var(--gradient-rose)',
                  color: 'var(--ivory)',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '0.6rem 1.25rem',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <PlusIcon /> {t.dashboard.addGuest}
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            {/* Search */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--ivory-pale)',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-pill)',
              padding: '0.4rem 1rem',
              flex: '1',
              maxWidth: '360px',
            }}>
              <span style={{ color: 'var(--taupe)' }}><SearchIcon /></span>
              <input
                type="text"
                value={search}
                placeholder={t.dashboard.searchGuests}
                onChange={e => setSearch(e.target.value)}
                style={{
                  border: 'none',
                  background: 'none',
                  outline: 'none',
                  fontSize: '0.9rem',
                  color: 'var(--cocoa)',
                  width: '100%',
                }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {(['ALL', 'ACCEPTED', 'DECLINED', 'PENDING'] as const).map(f => {
                const label =
                  f === 'ALL'
                    ? t.dashboard.filterAll
                    : f === 'ACCEPTED'
                    ? t.dashboard.filterConfirmed
                    : f === 'DECLINED'
                    ? t.dashboard.filterDeclined
                    : t.dashboard.filterPending;
                const active = filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    style={{
                      border: active ? '1px solid transparent' : '1px solid var(--border-soft)',
                      background: active ? 'var(--cocoa)' : 'transparent',
                      color: active ? 'var(--ivory)' : 'var(--taupe)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'start', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-fine)', color: 'var(--taupe)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{t.dashboard.colGuest}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{t.dashboard.colPhone}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{t.dashboard.colCompanions}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{t.dashboard.colStatus}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{t.dashboard.colCheckedIn}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{t.dashboard.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {!Array.isArray(filteredGuests) || filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--taupe)' }}>
                      {t.dashboard.noGuestsFound}
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map(g => (
                    <tr key={g.id} style={{ borderBottom: '1px solid var(--border-fine)' }}>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--cocoa)' }}>{g.guest_name}</span>
                        {g.notes && (
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--taupe)' }}>
                            {g.notes}
                          </span>
                        )}
                      </td>
                      <td dir="ltr" style={{ padding: '0.85rem 0.5rem', fontFamily: 'monospace' }}>
                        {g.phone_number || '—'}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                        +{g.companions_confirmed || 0}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.65rem',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          background:
                            g.status === 'ACCEPTED'
                              ? 'rgba(79, 125, 91, 0.15)'
                              : g.status === 'DECLINED'
                              ? 'rgba(176, 86, 79, 0.15)'
                              : 'rgba(169, 117, 47, 0.15)',
                          color:
                            g.status === 'ACCEPTED'
                              ? '#4f7d5b'
                              : g.status === 'DECLINED'
                              ? '#b0564f'
                              : '#a9752f',
                        }}>
                          {g.status === 'ACCEPTED'
                            ? t.dashboard.confirmed
                            : g.status === 'DECLINED'
                            ? t.dashboard.declined
                            : t.dashboard.pending}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleCheckIn(g.id)}
                          style={{
                            border: '1px solid',
                            borderColor: g.checked_in ? '#4f7d5b' : 'var(--border-soft)',
                            background: g.checked_in ? '#4f7d5b' : 'transparent',
                            color: g.checked_in ? 'var(--ivory)' : 'var(--taupe)',
                            borderRadius: 'var(--radius-pill)',
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {g.checked_in ? `✓ ${t.dashboard.checkedIn}` : t.dashboard.checkInAction}
                        </button>
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            title={lang === 'ar' ? 'نسخ رابط الدعوة الخاص' : 'Copy guest invitation link'}
                            onClick={() => handleCopyGuestLink(g)}
                            style={{
                              background: copiedGuestId === g.id ? 'var(--cocoa)' : 'transparent',
                              color: copiedGuestId === g.id ? 'var(--ivory)' : 'var(--taupe)',
                              border: '1px solid var(--border-soft)',
                              borderRadius: 'var(--radius-pill)',
                              padding: '0.25rem 0.55rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            {copiedGuestId === g.id ? '✓' : '🔗'}
                          </button>
                          <button
                            type="button"
                            title={lang === 'ar' ? 'حذف الضيف' : 'Delete guest'}
                            onClick={() => handleDeleteGuest(g.id)}
                            style={{
                              background: 'transparent',
                              color: '#b0564f',
                              border: '1px solid rgba(176,86,79,0.3)',
                              borderRadius: 'var(--radius-pill)',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Wishes Wall & Gallery Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}>
          {/* Wishes Wall */}
          <div style={{
            background: 'var(--ivory)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--cocoa)', marginBottom: '0.4rem' }}>
              💌 {t.dashboard.wishesTitle}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', marginBottom: '1.25rem' }}>
              {t.dashboard.wishesSubtitle}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '380px', overflowY: 'auto' }}>
              {Array.isArray(wishes) && wishes.length > 0 ? (
                wishes.map(w => (
                  <div key={w.id} style={{
                    background: 'var(--ivory-pale)',
                    border: '1px solid var(--border-fine)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    fontSize: '0.9rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--cocoa)' }}>{w.author_name}</span>
                      <span style={{ color: 'var(--rose-gold)' }}><HeartIcon /></span>
                    </div>
                    <p style={{ color: 'var(--taupe)', lineHeight: 1.5, margin: 0 }}>{w.message}</p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--taupe)', fontSize: '0.88rem' }}>
                  {lang === 'ar' ? 'لا توجد رسائل تهنئة حتى الآن' : 'No guestbook wishes yet'}
                </div>
              )}
            </div>
          </div>

          {/* Photo Gallery Preview */}
          <div style={{
            background: 'var(--ivory)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--cocoa)', margin: 0 }}>
                📸 {t.dashboard.galleryTitle}
              </h2>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  background: 'none',
                  border: '1px dashed var(--border-soft)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--rose-gold-deep)',
                  fontWeight: 600,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.6 : 1,
                }}
              >
                {isUploading ? 'Uploading…' : `+ ${t.dashboard.uploadPhoto}`}
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', marginBottom: '1.25rem' }}>
              {t.dashboard.gallerySubtitle}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {(Array.isArray(event?.gallery) ? event.gallery : []).map(img => (
                <div key={img.id} style={{
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  aspectRatio: '4/3',
                  border: '1px solid var(--border-soft)',
                }}>
                  <img
                    src={img.image_url}
                    alt="Gallery item"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Billing & Orders History Section */}
          <div style={{
            gridColumn: '1 / -1',
            background: 'var(--ivory)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
            marginTop: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--cocoa)', margin: 0 }}>
                  💳 {t.billing.ordersHistoryTitle}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
                  {event?.status === 'DRAFT' ? t.billing.orderStatusDraft : t.billing.pricingSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--teal)',
                  color: 'var(--ivory)',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '0.5rem 1.2rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + {t.billing.activateEvent}
              </button>
            </div>

            {!Array.isArray(orders) || orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--taupe)', fontSize: '0.9rem' }}>
                <p style={{ margin: 0 }}>{t.billing.noOrders}</p>
                {event?.status === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(true)}
                    style={{
                      marginTop: '0.75rem',
                      background: 'none',
                      border: '1px dashed var(--brass)',
                      color: 'var(--teal)',
                      padding: '0.45rem 1rem',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t.billing.proceedToPayment} →
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-soft)', textAlign: lang === 'ar' ? 'right' : 'left', color: 'var(--taupe)' }}>
                      <th style={{ padding: '0.75rem' }}>{t.billing.colOrderNumber}</th>
                      <th style={{ padding: '0.75rem' }}>{t.billing.colAmount}</th>
                      <th style={{ padding: '0.75rem' }}>{t.billing.colStatus}</th>
                      <th style={{ padding: '0.75rem' }}>{t.billing.colReceipt}</th>
                      <th style={{ padding: '0.75rem' }}>{t.billing.colDate}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => {
                      const isPending = ord.status === 'PENDING';
                      const isCompleted = ord.status === 'COMPLETED' || ord.status === 'VERIFIED';
                      const receiptUrl = ord.manualVerification?.receipt_image_url || ord.manualVerification?.receiptImageUrl;

                      return (
                        <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-fine)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--cocoa)' }}>
                            {ord.orderNumber || ord.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--teal)', fontWeight: 600 }}>
                            {ord.amount} {ord.currency}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.65rem',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: isPending ? 'rgba(184, 138, 74, 0.15)' : isCompleted ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: isPending ? 'var(--brass)' : isCompleted ? '#166534' : '#991b1b',
                            }}>
                              {isPending ? `⏳ ${t.billing.orderStatusPending}` : isCompleted ? `✓ ${t.billing.orderStatusCompleted}` : `✕ ${t.billing.orderStatusRejected}`}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {receiptUrl ? (
                              <a
                                href={receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--brass)', textDecoration: 'underline', fontSize: '0.8rem' }}
                              >
                                {t.billing.viewReceipt} ↗
                              </a>
                            ) : (
                              <span style={{ color: 'var(--taupe)', fontSize: '0.8rem' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--taupe)', fontSize: '0.8rem' }}>
                            {new Date(ord.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-US')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Event Settings Modal */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(75, 48, 43, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div style={{
            background: 'var(--ivory)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '480px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--cocoa)', margin: 0 }}>
                {t.dashboard.eventDetailsModal}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--taupe)', cursor: 'pointer' }}
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="field">
                <label className="field__label">{t.admin.colEventTitle}</label>
                <div className="field__control">
                  <input
                    type="text"
                    className="field__input"
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field__label">{t.dashboard.dateLabel}</label>
                <div className="field__control">
                  <input
                    type="datetime-local"
                    className="field__input"
                    value={editForm.date}
                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field__label">{t.dashboard.venueLabel}</label>
                <div className="field__control">
                  <input
                    type="text"
                    className="field__input"
                    value={editForm.location}
                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <Btn type="submit" variant="primary" size="md">
                  {t.dashboard.saveChanges}
                </Btn>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    border: '1px solid var(--border-soft)',
                    background: 'none',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.5rem 1.2rem',
                    cursor: 'pointer',
                  }}
                >
                  {t.dashboard.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Guest Modal */}
      {isAddGuestOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(75, 48, 43, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div style={{
            background: 'var(--ivory)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--cocoa)', margin: 0 }}>
                {t.dashboard.addGuestModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddGuestOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--taupe)', cursor: 'pointer' }}
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleAddGuest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="field">
                <label className="field__label">{t.dashboard.guestNameLabel} *</label>
                <div className="field__control">
                  <input
                    type="text"
                    required
                    className="field__input"
                    placeholder="e.g. عمر القواسمي"
                    value={guestForm.name}
                    onChange={e => setGuestForm({ ...guestForm, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field__label">{t.dashboard.colPhone}</label>
                <div className="field__control">
                  <input
                    type="tel"
                    className="field__input"
                    dir="ltr"
                    placeholder="+962 79..."
                    value={guestForm.phone}
                    onChange={e => setGuestForm({ ...guestForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field__label">{t.dashboard.companionsLabel}</label>
                <div className="field__control">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="field__input"
                    value={guestForm.companions}
                    onChange={e => setGuestForm({ ...guestForm, companions: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field__label">{t.dashboard.notesLabel}</label>
                <div className="field__control">
                  <input
                    type="text"
                    className="field__input"
                    placeholder="e.g. طاولة 4"
                    value={guestForm.notes}
                    onChange={e => setGuestForm({ ...guestForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <Btn type="submit" variant="primary" size="md">
                  {t.dashboard.addGuest}
                </Btn>
                <button
                  type="button"
                  onClick={() => setIsAddGuestOpen(false)}
                  style={{
                    border: '1px solid var(--border-soft)',
                    background: 'none',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.5rem 1.2rem',
                    cursor: 'pointer',
                  }}
                >
                  {t.dashboard.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CliQ Billing & Payment Modal */}
      {event && (
        <CliqCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          eventId={event.id}
          eventTitle={event.event_title}
          onOrderCompleted={() => {
            billingApi.getMyOrders().then(updateOrdersState).catch(() => setOrders([]));
            eventsService.getMyEvent().then(ev => {
              if (ev) setEvent(ev);
            }).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
