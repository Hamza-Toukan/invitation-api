import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../i18n/LanguageContext';
import { AdminLayout } from './AdminLayout';
import { adminApi } from '../../services/api/admin.api';
import type { ClientOverview } from '../../services/types';

export function AdminClientsPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientOverview[]>([]);

  useEffect(() => {
    adminApi.getClients().then((data) => {
      if (Array.isArray(data)) setClients(data);
    });
  }, []);

  const totalGuests = clients.reduce((acc, c) => acc + c.totalGuests, 0);
  const totalConfirmed = clients.reduce((acc, c) => acc + c.confirmedGuests, 0);

  return (
    <AdminLayout
      title={t.admin.clientsTitle}
      subtitle={t.admin.clientsSubtitle}
    >
      {/* Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem',
      }}>
        {[
          { label: t.admin.totalClients, val: clients.length, color: 'var(--cocoa)' },
          { label: t.admin.publishedEvents, val: clients.filter(c => c.status === 'PUBLISHED').length, color: 'var(--rose-gold-deep)' },
          { label: t.admin.totalGuestsAcross, val: totalGuests, color: '#4f7d5b' },
          { label: t.dashboard.confirmed, val: totalConfirmed, color: 'var(--rose-gold)' },
        ].map((card, i) => (
          <div key={i} style={{
            background: 'var(--ivory)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-xs)',
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--taupe)', fontWeight: 600 }}>
              {card.label}
            </span>
            <span style={{
              display: 'block',
              fontSize: '2rem',
              fontFamily: 'var(--font-serif-en)',
              fontWeight: 700,
              color: card.color,
              marginTop: '0.4rem',
            }}>
              {card.val}
            </span>
          </div>
        ))}
      </div>

      {/* Clients Table */}
      <div style={{
        background: 'var(--ivory)',
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        overflowX: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'start', fontSize: '0.92rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-fine)', color: 'var(--taupe)' }}>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{t.admin.colClientName}</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{t.admin.colEventTitle}</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{t.admin.colEventDate}</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{t.admin.colTemplate}</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{t.admin.colRsvpProgress}</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{t.admin.colStatus}</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{t.admin.colManage}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => {
              const progress = c.totalGuests ? Math.round((c.confirmedGuests / c.totalGuests) * 100) : 0;
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-fine)' }}>
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--cocoa)', display: 'block' }}>
                      {c.name}
                    </span>
                    <span dir="ltr" style={{ fontSize: '0.8rem', color: 'var(--taupe)', fontFamily: 'monospace' }}>
                      {c.phoneNumber}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', fontWeight: 500, color: 'var(--cocoa)' }}>
                    {c.eventTitle}
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', color: 'var(--taupe)', fontSize: '0.85rem' }}>
                    {new Date(c.eventDate).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    <span style={{
                      background: 'var(--rose-tint)',
                      color: 'var(--rose-gold-deep)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}>
                      {c.templateName}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <div style={{
                        width: '70px',
                        height: '6px',
                        background: 'rgba(184,115,90,0.15)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: '#4f7d5b',
                          borderRadius: '3px',
                        }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--taupe)' }}>
                        {c.confirmedGuests}/{c.totalGuests}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.65rem',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: c.status === 'PUBLISHED' ? 'rgba(79, 125, 91, 0.15)' : 'rgba(169, 117, 47, 0.15)',
                      color: c.status === 'PUBLISHED' ? '#4f7d5b' : '#a9752f',
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-soft)',
                        borderRadius: 'var(--radius-pill)',
                        padding: '0.3rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--rose-gold-deep)',
                        cursor: 'pointer',
                      }}
                    >
                      {t.admin.viewDashboard}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
