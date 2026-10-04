import { useState, useEffect } from 'react';
import { useLang } from '../../i18n/LanguageContext';
import { AdminLayout } from './AdminLayout';
import { mockEventsService } from '../../services/mockEventsService';
import type { Guest } from '../../services/types';

export function AdminGuestsPage() {
  const { t } = useLang();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    mockEventsService.getGuests().then(setGuests);
  }, []);

  const filtered = guests.filter(
    g =>
      !search.trim() ||
      g.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      (g.phone_number && g.phone_number.includes(search))
  );

  return (
    <AdminLayout
      title={t.admin.nav.guests}
      subtitle="Overview of guests and check-in statuses across events"
    >
      <div style={{
        background: 'var(--ivory)',
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Search */}
        <div style={{ marginBottom: '1.25rem', maxWidth: '380px' }}>
          <input
            type="text"
            placeholder={t.dashboard.searchGuests}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-soft)',
              background: 'var(--ivory-pale)',
              color: 'var(--cocoa)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'start', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-fine)', color: 'var(--taupe)' }}>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{t.dashboard.colGuest}</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{t.dashboard.colPhone}</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{t.dashboard.colCompanions}</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{t.dashboard.colStatus}</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{t.dashboard.colCheckedIn}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--border-fine)' }}>
                  <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600, color: 'var(--cocoa)' }}>
                    {g.guest_name}
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
                      {g.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '0.8rem',
                      color: g.checked_in ? '#4f7d5b' : 'var(--taupe)',
                      fontWeight: 600,
                    }}>
                      {g.checked_in ? '✓ Checked In' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
