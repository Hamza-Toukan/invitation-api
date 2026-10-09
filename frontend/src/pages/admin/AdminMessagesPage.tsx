import { useState, useEffect } from 'react';
import { useLang } from '../../i18n/LanguageContext';
import { AdminLayout } from './AdminLayout';
import { eventsService } from '../../services/eventsService';
import type { GuestWish } from '../../services/types';

export function AdminMessagesPage() {
  const { t } = useLang();
  const [wishes, setWishes] = useState<GuestWish[]>([]);

  useEffect(() => {
    eventsService.getWishes().then(setWishes);
  }, []);

  const handleToggle = async (wishId: string) => {
    const updated = await eventsService.toggleWishApproval(wishId);
    setWishes(prev => prev.map(w => (w.id === updated.id ? updated : w)));
  };

  return (
    <AdminLayout
      title={t.admin.nav.messages}
      subtitle="Moderation and review of guest congratulations wishes"
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.25rem',
      }}>
        {wishes.map(w => (
          <div key={w.id} style={{
            background: 'var(--ivory)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--cocoa)', fontSize: '0.95rem' }}>
                  {w.author_name}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 600,
                  background: w.is_approved ? 'rgba(79, 125, 91, 0.15)' : 'rgba(169, 117, 47, 0.15)',
                  color: w.is_approved ? '#4f7d5b' : '#a9752f',
                }}>
                  {w.is_approved ? 'Approved' : 'Pending Review'}
                </span>
              </div>
              <p style={{ color: 'var(--taupe)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
                "{w.message}"
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-fine)', paddingTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => handleToggle(w.id)}
                style={{
                  border: '1px solid var(--border-soft)',
                  background: w.is_approved ? 'none' : '#4f7d5b',
                  color: w.is_approved ? 'var(--taupe)' : 'var(--ivory)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {w.is_approved ? 'Hide Message' : 'Approve Message'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
