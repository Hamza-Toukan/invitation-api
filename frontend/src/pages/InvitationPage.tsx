import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext';
import { LangSwitch } from '../components/LangSwitch';
import { BrandLogo } from '../components/BrandLogo';
import {
  invitationsApi,
  type PublicInvitationResponse,
  type PublicWish,
} from '../services/api/invitations.api';

// Icons
const VolumeOnIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const VolumeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
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

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// Fallback preview data when opened without guest token (e.g. preview mode)
const DEMO_INVITATION: PublicInvitationResponse = {
  guest: {
    id: 'demo-guest',
    name: 'الضيوف الكرام / Honored Guests',
    status: 'PENDING',
    companionsAllowed: 2,
    companionsConfirmed: 0,
    table: 'A-1',
  },
  event: {
    id: 'demo-event',
    title: 'حفل زفاف نور وطارق — Nour & Tarek Wedding',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    locationName: 'قاعة اللؤلؤة الملكية — The Grand Ballroom, Four Seasons',
    locationUrl: 'https://maps.google.com',
    musicUrl: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
    template: {
      slug: 'amalfi-rose',
      category: 'wedding',
    },
    gallery: [
      { id: 'g1', imageUrl: '/templates/romance.jpg', order: 1 },
      { id: 'g2', imageUrl: '/templates/white%20and%20pink.jpg', order: 2 },
      { id: 'g3', imageUrl: '/templates/gold%20and%20sky.jpg', order: 3 },
    ],
  },
};

export function InvitationPage() {
  const { lang, t } = useLang();
  const isAr = lang === 'ar';
  const invT = t.invitation;

  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || routeToken;

  // Main Invitation State
  const [data, setData] = useState<PublicInvitationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Envelope Opening Experience State
  const [isOpened, setIsOpened] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // RSVP State
  const [selectedStatus, setSelectedStatus] = useState<'ACCEPTED' | 'DECLINED' | null>(null);
  const [companions, setCompanions] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpFeedback, setRsvpFeedback] = useState<string | null>(null);
  const [isEditingRsvp, setIsEditingRsvp] = useState(false);

  // Wishes Wall State
  const [wishes, setWishes] = useState<PublicWish[]>([]);
  const [wishAuthor, setWishAuthor] = useState('');
  const [wishMessage, setWishMessage] = useState('');
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);
  const [wishFeedback, setWishFeedback] = useState<string | null>(null);

  // General State
  const [copiedLink, setCopiedLink] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Fetch Invitation & Wishes
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!token || token === 'demo' || token === 'preview') {
        setData(DEMO_INVITATION);
        setWishAuthor(DEMO_INVITATION.guest.name);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const invRes = await invitationsApi.getInvitation(token);
        if (!isMounted) return;
        setData(invRes);

        // Prepopulate RSVP if already saved
        if (invRes.guest.status !== 'PENDING') {
          setSelectedStatus(invRes.guest.status);
          setCompanions(invRes.guest.companionsConfirmed || 0);
        }
        setWishAuthor(invRes.guest.name || '');

        // Fetch approved wishes
        try {
          const wishesRes = await invitationsApi.getWishes(token);
          if (isMounted) setWishes(wishesRes || []);
        } catch {
          // Non-critical if wishes fail
        }
      } catch (err: any) {
        if (!isMounted) return;
        // If 404 and might be a preview / event slug, fallback to demo preview with grace
        if (err?.statusCode === 404 || err?.message?.includes('not found')) {
          setData(DEMO_INVITATION);
        } else {
          setError(err?.message || invT.errors.notFound);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [token, invT.errors.notFound]);

  // Document Title
  useEffect(() => {
    if (data?.event?.title) {
      document.title = invT.metaTitle.replace('{title}', data.event.title);
    }
  }, [data, invT.metaTitle]);

  // Audio Playback Handler
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(() => {
        setIsPlayingAudio(false);
      });
    }
  };

  // Unseal Envelope Handler
  const handleUnsealEnvelope = () => {
    setIsOpened(true);
    if (data?.event.musicUrl && audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(() => {
        // Autoplay policy fallback: user can click speaker button
        setIsPlayingAudio(false);
      });
    }
  };

  // Live Countdown Timer
  useEffect(() => {
    if (!data?.event.date) return;

    const targetDate = new Date(data.event.date).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data?.event.date]);

  // Handle RSVP Submit
  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) return;

    setIsSubmittingRsvp(true);
    setRsvpFeedback(null);

    try {
      if (token && token !== 'demo' && token !== 'preview') {
        const res = await invitationsApi.submitRsvp(token, {
          status: selectedStatus,
          companionsConfirmed: selectedStatus === 'ACCEPTED' ? companions : 0,
          notes: notes.trim() || undefined,
        });
        setRsvpFeedback(res.message);
      } else {
        // Simulated response for demo
        setRsvpFeedback(
          selectedStatus === 'ACCEPTED'
            ? invT.rsvp.confirmedTitle
            : invT.rsvp.declinedTitle
        );
      }

      setIsEditingRsvp(false);
      if (data) {
        setData({
          ...data,
          guest: {
            ...data.guest,
            status: selectedStatus,
            companionsConfirmed: selectedStatus === 'ACCEPTED' ? companions : 0,
          },
        });
      }
    } catch (err: any) {
      setRsvpFeedback(err?.message || 'Failed to submit RSVP. Please try again.');
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  // Handle Wish Submit
  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishAuthor.trim() || !wishMessage.trim()) return;

    setIsSubmittingWish(true);
    setWishFeedback(null);

    try {
      if (token && token !== 'demo' && token !== 'preview') {
        const res = await invitationsApi.submitWish(token, {
          authorName: wishAuthor.trim(),
          message: wishMessage.trim(),
        });
        setWishFeedback(res.message || invT.wishes.success);
        setWishes(prev => [
          {
            id: res.wish?.id || String(Date.now()),
            author_name: res.wish?.authorName || wishAuthor.trim(),
            message: res.wish?.message || wishMessage.trim(),
            createdAt: res.wish?.createdAt || new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        setWishFeedback(invT.wishes.success);
        setWishes(prev => [
          {
            id: String(Date.now()),
            author_name: wishAuthor.trim(),
            message: wishMessage.trim(),
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      setWishMessage('');
    } catch (err: any) {
      setWishFeedback(err?.message || 'Failed to submit wish.');
    } finally {
      setIsSubmittingWish(false);
    }
  };

  // Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Formatted Date
  const formattedDate = useMemo(() => {
    if (!data?.event.date) return '';
    try {
      const d = new Date(data.event.date);
      return new Intl.DateTimeFormat(isAr ? 'ar-JO' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return data.event.date;
    }
  }, [data?.event.date, isAr]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-brass/30 border-t-brass animate-spin mb-4" />
        <p className="font-heading text-lg text-teal tracking-wide animate-pulse">
          {isAr ? 'لحظتك، بأجمل صورة… جارٍ تجهيز دعوتك' : 'Preparing your personalized invitation…'}
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-clay/10 text-clay flex items-center justify-center mb-4">
          <CloseIcon />
        </div>
        <h1 className="font-heading text-2xl text-teal mb-2">{invT.errors.notFound}</h1>
        <p className="text-ink/70 max-w-md mb-6">{invT.errors.notFoundDesc}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-teal text-ivory text-sm font-medium hover:bg-teal/90 transition-colors"
        >
          {invT.errors.backHome}
        </Link>
      </div>
    );
  }

  const { guest, event } = data;
  const isAlreadyResponded = guest.status !== 'PENDING' && !isEditingRsvp;

  return (
    <div className="min-h-screen bg-ivory text-ink selection:bg-brass/20 selection:text-teal font-body relative overflow-x-hidden">
      {/* Background Audio Element */}
      {event.musicUrl && (
        <audio ref={audioRef} src={event.musicUrl} loop preload="auto" />
      )}

      {/* Top Floating Navigation Bar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-ivory/80 backdrop-blur-md border-b border-sand-border/50 py-3 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="sm" />
          </Link>

          <div className="flex items-center gap-3">
            {/* Audio Toggle Button */}
            {event.musicUrl && (
              <button
                type="button"
                onClick={toggleAudio}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isPlayingAudio
                    ? 'bg-teal text-ivory border-teal shadow-sm'
                    : 'bg-sand-card text-teal border-sand-border hover:border-brass'
                }`}
                aria-label={isPlayingAudio ? invT.audio.pause : invT.audio.play}
              >
                {isPlayingAudio ? <VolumeOnIcon /> : <VolumeOffIcon />}
                <span className="hidden sm:inline">
                  {isPlayingAudio ? invT.audio.playing : invT.audio.play}
                </span>
                {isPlayingAudio && (
                  <span className="flex items-center gap-0.5 ms-1">
                    <span className="w-0.5 h-2.5 bg-brass animate-pulse" />
                    <span className="w-0.5 h-3.5 bg-brass animate-pulse delay-100" />
                    <span className="w-0.5 h-2 bg-brass animate-pulse delay-200" />
                  </span>
                )}
              </button>
            )}

            {/* Language Switch */}
            <LangSwitch />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="pt-20 pb-24 px-4 sm:px-6 max-w-3xl mx-auto">
        {/* ========================================================================= */}
        {/* ENVELOPE UNSEALING EXPERIENCE (If not yet opened)                          */}
        {/* ========================================================================= */}
        {!isOpened ? (
          <section className="min-h-[75vh] flex flex-col items-center justify-center text-center py-10 animate-fade-in">
            {/* Decorative Ambient Aura */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brass/10 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="mb-6 space-y-2">
              <span className="inline-block text-xs uppercase tracking-widest text-brass font-medium">
                {isAr ? 'دعوة خاصة ومميزة' : 'Personal Invitation'}
              </span>
              <h1 className="font-heading text-3xl sm:text-4xl text-teal">
                {guest.name}
              </h1>
              <p className="text-sm text-ink/70">
                {invT.cordiallyInvited}
              </p>
            </div>

            {/* Interactive Royal Envelope Device */}
            <div className="relative w-full max-w-md mx-auto group">
              <div className="relative bg-teal rounded-3xl p-6 sm:p-8 shadow-2xl border border-brass/30 text-ivory overflow-hidden transition-all duration-500 hover:shadow-brass/20">
                {/* Gold corner ornaments */}
                <div className="absolute top-4 start-4 w-4 h-4 border-t-2 border-s-2 border-brass/60" />
                <div className="absolute top-4 end-4 w-4 h-4 border-t-2 border-e-2 border-brass/60" />
                <div className="absolute bottom-4 start-4 w-4 h-4 border-b-2 border-s-2 border-brass/60" />
                <div className="absolute bottom-4 end-4 w-4 h-4 border-b-2 border-e-2 border-brass/60" />

                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F6F0E6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                {/* Envelope Crest & Monogram */}
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#1A454A] border border-brass/40 flex items-center justify-center text-brass shadow-inner">
                  <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                    <path d="M15 46V24l17 15 17-15v22" stroke="#F6F0E6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M32 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#B88A4A" />
                  </svg>
                </div>

                <p className="text-xs uppercase tracking-widest text-brass font-medium mb-1">
                  Mira Invitations
                </p>
                <h2 className="font-heading text-xl sm:text-2xl text-ivory mb-6 font-normal">
                  {event.title}
                </h2>

                {/* Wax Seal Button (Click to Open) */}
                <button
                  type="button"
                  onClick={handleUnsealEnvelope}
                  className="relative z-10 mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-[#986E33] via-brass to-[#DCB378] text-ivory shadow-xl flex flex-col items-center justify-center border-4 border-ivory/90 hover:scale-105 active:scale-95 transition-all group-hover:rotate-3 cursor-pointer"
                  title={invT.waxSealLabel}
                  aria-label={invT.openInvitation}
                >
                  <span className="text-2xl">✦</span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase mt-0.5">
                    {isAr ? 'افتح' : 'Open'}
                  </span>
                  {/* Subtle Pulse Ring */}
                  <span className="absolute inset-0 rounded-full border border-brass animate-ping opacity-30 pointer-events-none" />
                </button>

                <p className="text-xs text-ivory/70 mt-6 tracking-wide">
                  {invT.waxSealLabel}
                </p>
              </div>
            </div>

            <p className="text-xs text-ink/50 mt-8">
              {isAr ? 'لحظتك، بأجمل صورة • ميرا للدعوات' : 'Invitations worth opening • Mira'}
            </p>
          </section>
        ) : (
          /* ========================================================================= */
          /* REVEALED INVITATION CARD & SECTIONS                                        */
          /* ========================================================================= */
          <div className="space-y-12 animate-slide-up">
            {/* Top Celebration Card */}
            <article className="relative bg-sand-card rounded-3xl p-6 sm:p-12 shadow-xl border border-sand-border text-center overflow-hidden">
              {/* Corner Ornaments */}
              <div className="absolute top-4 start-4 w-6 h-6 border-t-2 border-s-2 border-brass/70" />
              <div className="absolute top-4 end-4 w-6 h-6 border-t-2 border-e-2 border-brass/70" />
              <div className="absolute bottom-4 start-4 w-6 h-6 border-b-2 border-s-2 border-brass/70" />
              <div className="absolute bottom-4 end-4 w-6 h-6 border-b-2 border-e-2 border-brass/70" />

              {/* Monogram Brand Mark */}
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-teal text-ivory flex items-center justify-center shadow-md">
                <span className="text-brass text-lg">✦</span>
              </div>

              <span className="inline-block text-xs uppercase tracking-widest text-brass font-semibold mb-2">
                {invT.cordiallyInvited}
              </span>

              <h1 className="font-heading text-3xl sm:text-5xl text-teal font-normal mb-4 tracking-tight leading-snug">
                {event.title}
              </h1>

              {/* Guest Greeting Pill */}
              <div className="inline-flex items-center gap-2 bg-ivory border border-sand-border px-4 py-1.5 rounded-full text-sm text-ink mb-8 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-brass" />
                <span>
                  {invT.rsvp.greeting.replace('{name}', guest.name)}
                </span>
                {guest.companionsAllowed > 0 && (
                  <span className="text-xs text-ink/60 border-s border-sand-border ps-2 ms-1">
                    {isAr
                      ? `+${guest.companionsAllowed} مرافقين`
                      : `+${guest.companionsAllowed} companions`}
                  </span>
                )}
              </div>

              {/* Date & Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8 text-start">
                {/* Date Card */}
                <div className="p-5 rounded-2xl bg-ivory/60 border border-sand-border flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-teal text-ivory shrink-0">
                    <CalendarIcon />
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-brass font-semibold mb-1">
                      {invT.dateLabel}
                    </span>
                    <p className="text-sm font-medium text-teal leading-relaxed">
                      {formattedDate}
                    </p>
                  </div>
                </div>

                {/* Location Card */}
                <div className="p-5 rounded-2xl bg-ivory/60 border border-sand-border flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-teal text-ivory shrink-0">
                    <MapPinIcon />
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs uppercase tracking-wider text-brass font-semibold mb-1">
                      {invT.locationLabel}
                    </span>
                    <p className="text-sm font-medium text-teal leading-relaxed mb-2">
                      {event.locationName}
                    </p>
                    {event.locationUrl && (
                      <a
                        href={event.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-brass hover:text-teal font-medium transition-colors"
                      >
                        <span>{invT.openInMaps}</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="py-6 border-y border-sand-border">
                <p className="text-xs uppercase tracking-widest text-ink/60 mb-4 font-medium">
                  {invT.countdown.until}
                </p>
                <div className="flex items-center justify-center gap-3 sm:gap-6">
                  <div className="w-16 sm:w-20 py-2.5 rounded-2xl bg-teal text-ivory shadow-sm">
                    <span className="block font-heading text-2xl sm:text-3xl font-normal text-brass">
                      {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs text-ivory/80 uppercase">
                      {invT.countdown.days}
                    </span>
                  </div>
                  <span className="text-xl font-heading text-brass self-center">:</span>
                  <div className="w-16 sm:w-20 py-2.5 rounded-2xl bg-teal text-ivory shadow-sm">
                    <span className="block font-heading text-2xl sm:text-3xl font-normal text-brass">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs text-ivory/80 uppercase">
                      {invT.countdown.hours}
                    </span>
                  </div>
                  <span className="text-xl font-heading text-brass self-center">:</span>
                  <div className="w-16 sm:w-20 py-2.5 rounded-2xl bg-teal text-ivory shadow-sm">
                    <span className="block font-heading text-2xl sm:text-3xl font-normal text-brass">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs text-ivory/80 uppercase">
                      {invT.countdown.minutes}
                    </span>
                  </div>
                  <span className="text-xl font-heading text-brass self-center">:</span>
                  <div className="w-16 sm:w-20 py-2.5 rounded-2xl bg-teal text-ivory shadow-sm">
                    <span className="block font-heading text-2xl sm:text-3xl font-normal text-brass">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs text-ivory/80 uppercase">
                      {invT.countdown.seconds}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons (Share / Copy link) */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sand-border text-xs font-medium text-teal hover:bg-ivory transition-colors"
                >
                  <ShareIcon />
                  <span>{copiedLink ? invT.share.copied : invT.share.copyLink}</span>
                </button>
              </div>
            </article>

            {/* Gallery Section (If photos exist) */}
            {event.gallery && event.gallery.length > 0 && (
              <section className="bg-sand-card rounded-3xl p-6 sm:p-8 shadow-lg border border-sand-border">
                <div className="text-center mb-6">
                  <span className="text-xs uppercase tracking-widest text-brass font-medium">
                    {isAr ? 'ألبوم الذكريات' : 'Photo Gallery'}
                  </span>
                  <h2 className="font-heading text-2xl text-teal mt-1">
                    {isAr ? 'لقطات من المناسبة' : 'Captured Moments'}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {event.gallery.map((img) => (
                    <div key={img.id} className="aspect-[4/5] rounded-2xl overflow-hidden border border-sand-border shadow-sm group">
                      <img
                        src={img.imageUrl}
                        alt="Event memory"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ========================================================================= */}
            {/* INTERACTIVE RSVP SECTION                                                  */}
            {/* ========================================================================= */}
            <section id="rsvp-section" className="bg-sand-card rounded-3xl p-6 sm:p-10 shadow-xl border border-sand-border text-center">
              <span className="text-xs uppercase tracking-widest text-brass font-semibold">
                {invT.rsvp.sectionTitle}
              </span>
              <h2 className="font-heading text-3xl text-teal mt-1 mb-2 font-normal">
                {invT.rsvp.greeting.replace('{name}', guest.name)}
              </h2>
              <p className="text-sm text-ink/70 max-w-md mx-auto mb-8">
                {invT.rsvp.prompt}
              </p>

              {/* Already Responded State Banner */}
              {isAlreadyResponded ? (
                <div className="bg-ivory border border-sand-border rounded-2xl p-6 max-w-lg mx-auto text-center space-y-4">
                  <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-ivory ${
                    guest.status === 'ACCEPTED' ? 'bg-teal' : 'bg-clay'
                  }`}>
                    {guest.status === 'ACCEPTED' ? <CheckIcon /> : <CloseIcon />}
                  </div>
                  <div>
                    <h3 className="font-heading text-xl text-teal">
                      {guest.status === 'ACCEPTED'
                        ? invT.rsvp.confirmedTitle
                        : invT.rsvp.declinedTitle}
                    </h3>
                    <p className="text-xs text-ink/70 mt-1">
                      {guest.status === 'ACCEPTED'
                        ? invT.rsvp.confirmedDesc
                        : invT.rsvp.declinedDesc}
                    </p>
                    {guest.status === 'ACCEPTED' && guest.companionsConfirmed > 0 && (
                      <p className="text-xs text-brass font-medium mt-2">
                        {isAr
                          ? `المرافقون المؤكدون: ${guest.companionsConfirmed}`
                          : `Confirmed companions: ${guest.companionsConfirmed}`}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingRsvp(true)}
                    className="inline-block text-xs text-teal underline font-medium hover:text-brass"
                  >
                    {invT.rsvp.editRsvp}
                  </button>
                </div>
              ) : (
                /* RSVP Form */
                <form onSubmit={handleRsvpSubmit} className="max-w-lg mx-auto text-start space-y-6">
                  {/* Two Choices Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Accept Choice */}
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('ACCEPTED')}
                      className={`p-4 rounded-2xl border-2 text-start transition-all flex items-start gap-3 ${
                        selectedStatus === 'ACCEPTED'
                          ? 'border-teal bg-teal/5 shadow-md'
                          : 'border-sand-border hover:border-teal/40 bg-sand-card'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                        selectedStatus === 'ACCEPTED'
                          ? 'border-teal bg-teal text-ivory'
                          : 'border-sand-border'
                      }`}>
                        {selectedStatus === 'ACCEPTED' && <span className="w-2 h-2 rounded-full bg-ivory" />}
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-teal">
                          {invT.rsvp.acceptChoice}
                        </span>
                        <span className="text-[11px] text-ink/60">
                          {isAr ? 'يشرفنا مشاركتكم الفرحة' : 'Joyfully accepting'}
                        </span>
                      </div>
                    </button>

                    {/* Decline Choice */}
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('DECLINED')}
                      className={`p-4 rounded-2xl border-2 text-start transition-all flex items-start gap-3 ${
                        selectedStatus === 'DECLINED'
                          ? 'border-clay bg-clay/5 shadow-md'
                          : 'border-sand-border hover:border-clay/40 bg-sand-card'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                        selectedStatus === 'DECLINED'
                          ? 'border-clay bg-clay text-ivory'
                          : 'border-sand-border'
                      }`}>
                        {selectedStatus === 'DECLINED' && <span className="w-2 h-2 rounded-full bg-ivory" />}
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-clay">
                          {invT.rsvp.declineChoice}
                        </span>
                        <span className="text-[11px] text-ink/60">
                          {isAr ? 'نعتذر لعدم تمكننا' : 'Regretfully unable'}
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Companions Selector (If Accepted and allowed > 0) */}
                  {selectedStatus === 'ACCEPTED' && guest.companionsAllowed > 0 && (
                    <div className="p-4 rounded-2xl bg-ivory/80 border border-sand-border space-y-2 animate-fade-in">
                      <label className="block text-xs font-medium text-teal">
                        {invT.rsvp.companionsPrompt.replace('{max}', String(guest.companionsAllowed))}
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setCompanions(Math.max(0, companions - 1))}
                          className="w-10 h-10 rounded-xl bg-sand-card border border-sand-border flex items-center justify-center text-teal font-bold hover:bg-sand-border/30 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-heading text-xl text-teal">
                          {companions}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCompanions(Math.min(guest.companionsAllowed, companions + 1))}
                          className="w-10 h-10 rounded-xl bg-sand-card border border-sand-border flex items-center justify-center text-teal font-bold hover:bg-sand-border/30 transition-colors"
                        >
                          +
                        </button>
                        <span className="text-xs text-ink/60 ms-2">
                          {isAr ? 'مرافق(ين)' : 'attending companion(s)'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Notes / Dietary Textarea */}
                  <div>
                    <label className="block text-xs font-medium text-teal mb-1">
                      {isAr ? 'ملاحظات إضافية أو تهنئة' : 'Notes or Dietary Requirements'}
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={invT.rsvp.notesPlaceholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-sand-card border border-sand-border text-sm text-ink focus:outline-none focus:border-brass resize-none"
                    />
                  </div>

                  {/* Feedback Message */}
                  {rsvpFeedback && (
                    <div className="p-3 rounded-xl bg-teal/10 border border-teal/20 text-teal text-xs text-center font-medium">
                      {rsvpFeedback}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={!selectedStatus || isSubmittingRsvp}
                      className="flex-1 py-3 px-6 rounded-full bg-teal text-ivory font-medium text-sm hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmittingRsvp ? (
                        <>
                          <span className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
                          <span>{invT.rsvp.submitting}</span>
                        </>
                      ) : (
                        <span>{invT.rsvp.submit}</span>
                      )}
                    </button>
                    {isEditingRsvp && (
                      <button
                        type="button"
                        onClick={() => setIsEditingRsvp(false)}
                        className="py-3 px-5 rounded-full border border-sand-border text-xs text-ink/70 hover:bg-ivory"
                      >
                        {t.dashboard.cancel}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </section>

            {/* ========================================================================= */}
            {/* DIGITAL GUESTBOOK / WISHES WALL                                           */}
            {/* ========================================================================= */}
            <section className="bg-sand-card rounded-3xl p-6 sm:p-10 shadow-lg border border-sand-border">
              <div className="text-center mb-8">
                <span className="text-xs uppercase tracking-widest text-brass font-semibold">
                  {invT.wishes.sectionTitle}
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl text-teal mt-1 mb-2 font-normal">
                  {isAr ? 'شاركنا كلماتك الطيبة' : 'Leave a Blessing & Wish'}
                </h2>
                <p className="text-xs text-ink/70 max-w-md mx-auto">
                  {invT.wishes.subtitle}
                </p>
              </div>

              {/* Wish Submission Form */}
              <form onSubmit={handleWishSubmit} className="max-w-xl mx-auto mb-10 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      required
                      value={wishAuthor}
                      onChange={(e) => setWishAuthor(e.target.value)}
                      placeholder={invT.wishes.namePlaceholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-ivory/50 border border-sand-border text-sm text-ink focus:outline-none focus:border-brass"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      value={wishMessage}
                      onChange={(e) => setWishMessage(e.target.value)}
                      placeholder={invT.wishes.messagePlaceholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-ivory/50 border border-sand-border text-sm text-ink focus:outline-none focus:border-brass"
                    />
                  </div>
                </div>

                {wishFeedback && (
                  <p className="text-xs text-teal font-medium text-center">{wishFeedback}</p>
                )}

                <div className="text-end">
                  <button
                    type="submit"
                    disabled={isSubmittingWish || !wishMessage.trim() || !wishAuthor.trim()}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brass text-ivory text-xs font-semibold hover:bg-brass/90 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isSubmittingWish ? (
                      <span>{invT.wishes.submitting}</span>
                    ) : (
                      <>
                        <span>{invT.wishes.submit}</span>
                        <SendIcon />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Wishes Feed */}
              <div className="space-y-3 max-w-xl mx-auto">
                {wishes.length === 0 ? (
                  <p className="text-xs text-ink/50 text-center py-6 italic">
                    {invT.wishes.noWishes}
                  </p>
                ) : (
                  wishes.map((w) => (
                    <div
                      key={w.id}
                      className="p-4 rounded-2xl bg-ivory/50 border border-sand-border/80 text-start space-y-1.5 transition-all hover:border-brass/40"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-teal font-heading">
                          {w.author_name || w.authorName}
                        </span>
                        <span className="text-[10px] text-ink/50">
                          {new Date(w.createdAt).toLocaleDateString(isAr ? 'ar-JO' : 'en-US')}
                        </span>
                      </div>
                      <p className="text-sm text-ink/80 leading-relaxed font-sans">
                        "{w.message}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer Branding Watermark */}
      <footer className="text-center py-8 text-xs text-ink/50 border-t border-sand-border/40">
        <p>
          {isAr
            ? 'ميرا للدعوات • لحظتك، بأجمل صورة'
            : 'Mira Invitations • Invitations worth opening.'}
        </p>
      </footer>
    </div>
  );
}
