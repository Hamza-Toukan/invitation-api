import { useLang } from '../i18n/LanguageContext';

export function EnvelopeMockup() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  return (
    <div className="relative w-full max-w-[380px] mx-auto select-none">
      {/* Background Soft Glow */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-brass/20 via-teal/10 to-transparent rounded-3xl blur-2xl -z-10 pointer-events-none" />

      {/* Floating Badge Top-Left / Top-Right */}
      <div className="absolute -top-3 -start-2 sm:-start-4 z-20 bg-sand-card/95 backdrop-blur-md border border-sand-border text-teal px-3.5 py-1.5 rounded-full shadow-md text-xs font-medium flex items-center gap-1.5 animate-bounce-subtle">
        <span className="w-2 h-2 rounded-full bg-brass animate-pulse" />
        <span>{isAr ? 'دعوة تفاعلية حية' : 'Interactive Live Demo'}</span>
      </div>

      {/* Main Digital Device / Invitation Frame */}
      <div className="relative bg-teal text-ivory rounded-[2.25rem] p-3 sm:p-4 shadow-2xl border border-sand-border/30 overflow-hidden">
        {/* Top Speaker / Notch subtle bar */}
        <div className="w-16 h-1 bg-ivory/20 rounded-full mx-auto mb-3" />

        {/* Envelope Container */}
        <div className="relative bg-[#1A454A] rounded-[1.75rem] p-4 sm:p-5 border border-brass/30 overflow-hidden flex flex-col items-center">
          
          {/* Subtle geometric pattern background */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F6F0E6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Floating Music Playing Pill */}
          <div className="relative z-10 w-full mb-3 flex items-center justify-between bg-teal/80 border border-brass/40 rounded-full px-3.5 py-1.5 text-xs text-ivory">
            <div className="flex items-center gap-2">
              <span className="text-brass">♪</span>
              <span className="font-medium tracking-wide">
                {isAr ? 'موسيقى الحفل ترحيبية' : 'Curated Welcome Audio'}
              </span>
            </div>
            {/* Animated Audio Equalizer */}
            <div className="flex items-center gap-0.5">
              <span className="w-0.5 h-3 bg-brass rounded-full animate-[pulse_1s_infinite_100ms]" />
              <span className="w-0.5 h-4 bg-brass rounded-full animate-[pulse_1s_infinite_300ms]" />
              <span className="w-0.5 h-2 bg-brass rounded-full animate-[pulse_1s_infinite_200ms]" />
              <span className="w-0.5 h-3.5 bg-brass rounded-full animate-[pulse_1s_infinite_400ms]" />
            </div>
          </div>

          {/* Invitation Card (Peeking out of envelope) */}
          <div className="relative z-10 w-full bg-ivory text-ink rounded-2xl p-5 sm:p-6 shadow-lg border border-sand-border text-center transform transition-transform hover:-translate-y-1 duration-300">
            {/* Gold Corner Accents */}
            <div className="absolute top-2.5 start-2.5 w-3.5 h-3.5 border-t-2 border-s-2 border-brass/70" />
            <div className="absolute top-2.5 end-2.5 w-3.5 h-3.5 border-t-2 border-e-2 border-brass/70" />
            <div className="absolute bottom-2.5 start-2.5 w-3.5 h-3.5 border-b-2 border-s-2 border-brass/70" />
            <div className="absolute bottom-2.5 end-2.5 w-3.5 h-3.5 border-b-2 border-e-2 border-brass/70" />

            {/* Brand Monogram Icon */}
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-teal flex items-center justify-center text-ivory shadow-sm">
              <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
                <path d="M15 46V24l17 15 17-15v22" stroke="#F6F0E6" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M32 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#B88A4A" />
              </svg>
            </div>

            <p className="text-[11px] uppercase tracking-widest text-brass font-semibold mb-1">
              {isAr ? 'يسرّنا دعوتكم لحضور' : 'You are cordially invited'}
            </p>

            <h3 className="font-heading text-2xl text-teal font-medium my-1">
              {isAr ? 'نور وطارق' : 'Nour & Tarek'}
            </h3>

            <p className="text-xs text-ink/70 mb-3 font-sans">
              {isAr ? 'السبت، ٢٤ أكتوبر ٢٠٢٦ • قاعة اللؤلؤة' : 'Saturday, Oct 24, 2026 • The Grand Ballroom'}
            </p>

            {/* Simulated Countdown */}
            <div className="flex justify-center gap-2 text-center my-3 py-2 border-y border-sand-border/60">
              <div className="px-2">
                <span className="block font-heading text-sm font-semibold text-teal">14</span>
                <span className="text-[9px] text-ink/60 uppercase">{isAr ? 'يوم' : 'Days'}</span>
              </div>
              <span className="text-sand-border self-center">•</span>
              <div className="px-2">
                <span className="block font-heading text-sm font-semibold text-teal">08</span>
                <span className="text-[9px] text-ink/60 uppercase">{isAr ? 'ساعة' : 'Hours'}</span>
              </div>
              <span className="text-sand-border self-center">•</span>
              <div className="px-2">
                <span className="block font-heading text-sm font-semibold text-teal">32</span>
                <span className="text-[9px] text-ink/60 uppercase">{isAr ? 'دقيقة' : 'Mins'}</span>
              </div>
            </div>

            {/* Interactive RSVP Action Button */}
            <div className="mt-3">
              <button
                type="button"
                className="w-full bg-teal text-ivory text-xs font-medium py-2.5 px-4 rounded-full shadow-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 cursor-default"
              >
                <span>{isAr ? 'تأكيد الحضور (RSVP)' : 'Confirm Attendance (RSVP)'}</span>
                <span className="text-brass">✦</span>
              </button>
            </div>
          </div>

          {/* Envelope Wax Seal / Clasp Graphic */}
          <div className="relative -mt-3 z-20 flex items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-brass text-ivory shadow-lg flex items-center justify-center border-2 border-ivory/80">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" />
              </svg>
            </div>
          </div>

        </div>

        {/* Device Bottom Line indicator */}
        <div className="w-24 h-1 bg-ivory/20 rounded-full mx-auto mt-3" />
      </div>

      {/* Floating Badge Bottom-Right */}
      <div className="absolute -bottom-3 -end-2 sm:-end-4 z-20 bg-sand-card/95 backdrop-blur-md border border-sand-border text-teal px-3.5 py-1.5 rounded-full shadow-md text-xs font-medium flex items-center gap-1.5">
        <span className="text-clay font-bold">✓</span>
        <span>{isAr ? 'تأكيدات فورية في لوحتك' : 'Instant RSVP Tracking'}</span>
      </div>
    </div>
  );
}
