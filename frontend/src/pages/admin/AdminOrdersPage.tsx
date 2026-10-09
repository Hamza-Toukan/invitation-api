import React, { useState, useEffect } from 'react';
import { useLang } from '../../i18n/LanguageContext';
import { AdminLayout } from './AdminLayout';
import {
  adminApi,
  type AdminOrder,
  type AdminDashboardAnalytics,
} from '../../services/api/admin.api';

export function AdminOrdersPage() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const aT = t.admin;

  // Data states
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [analytics, setAnalytics] = useState<AdminDashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED'>('PENDING');

  // Action states
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  // Rejection modal
  const [rejectingOrder, setRejectingOrder] = useState<AdminOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Lightbox modal for receipt screenshot
  const [lightboxOrder, setLightboxOrder] = useState<AdminOrder | null>(null);

  // Load orders and analytics
  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, ordersRes] = await Promise.all([
        adminApi.getDashboardAnalytics().catch(() => null),
        adminApi.getPendingVerifications({ limit: 100 }),
      ]);

      if (analyticsRes) setAnalytics(analyticsRes);
      if (ordersRes?.data) setOrders(ordersRes.data);
    } catch (err: any) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Approve Order
  const handleApprove = async (order: AdminOrder) => {
    if (!window.confirm(aT.confirmApprove)) return;

    setProcessingOrderId(order.id);
    setActionFeedback(null);

    try {
      await adminApi.verifyOrder(order.id, { approved: true });
      setActionFeedback({ message: aT.approvedSuccess });

      // Optimistic update
      setOrders(prev =>
        prev.map(o => (o.id === order.id ? { ...o, status: 'COMPLETED' } : o))
      );

      if (lightboxOrder?.id === order.id) {
        setLightboxOrder(null);
      }

      // Refresh KPIs
      adminApi.getDashboardAnalytics().then(setAnalytics).catch(() => {});
    } catch (err: any) {
      setActionFeedback({
        message: err?.message || 'Failed to approve order.',
        isError: true,
      });
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Handle Reject Order Submit
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingOrder) return;

    setProcessingOrderId(rejectingOrder.id);
    setActionFeedback(null);

    try {
      await adminApi.verifyOrder(rejectingOrder.id, {
        approved: false,
        rejectionReason: rejectionReason.trim() || undefined,
      });

      setActionFeedback({ message: aT.rejectedSuccess });

      // Optimistic update
      setOrders(prev =>
        prev.map(o =>
          o.id === rejectingOrder.id
            ? {
                ...o,
                status: 'FAILED',
                manualVerification: o.manualVerification
                  ? { ...o.manualVerification, admin_notes: rejectionReason }
                  : null,
              }
            : o
        )
      );

      setRejectingOrder(null);
      setRejectionReason('');
      if (lightboxOrder?.id === rejectingOrder.id) {
        setLightboxOrder(null);
      }

      // Refresh KPIs
      adminApi.getDashboardAnalytics().then(setAnalytics).catch(() => {});
    } catch (err: any) {
      setActionFeedback({
        message: err?.message || 'Failed to reject order.',
        isError: true,
      });
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && o.status === 'PENDING') ||
      (statusFilter === 'COMPLETED' && (o.status === 'COMPLETED' || o.status === 'VERIFIED')) ||
      (statusFilter === 'FAILED' && (o.status === 'FAILED' || o.status === 'REJECTED'));

    const searchLower = search.trim().toLowerCase();
    const matchesSearch =
      !searchLower ||
      (o.hostName && o.hostName.toLowerCase().includes(searchLower)) ||
      (o.hostPhone && o.hostPhone.includes(searchLower)) ||
      (o.eventTitle && o.eventTitle.toLowerCase().includes(searchLower)) ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(searchLower)) ||
      (o.cliqReference && o.cliqReference.toLowerCase().includes(searchLower));

    return matchesStatus && matchesSearch;
  });

  return (
    <AdminLayout title={aT.ordersTitle} subtitle={aT.ordersSubtitle}>
      {/* Platform Analytics & KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            background: 'var(--ivory)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--taupe)', fontWeight: 600 }}>
            💰 {aT.totalRevenue}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: '2rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'var(--teal)',
              marginTop: '0.4rem',
            }}
          >
            {analytics?.revenue.totalJod ?? 0} {analytics?.revenue.currency ?? 'JOD'}
          </span>
        </div>

        <div
          style={{
            background: 'var(--ivory)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--taupe)', fontWeight: 600 }}>
            ⏳ {aT.pendingVerifications}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: '2rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'var(--brass)',
              marginTop: '0.4rem',
            }}
          >
            {analytics?.verifications.pendingCliqOrders ?? orders.filter(o => o.status === 'PENDING').length}
          </span>
        </div>

        <div
          style={{
            background: 'var(--ivory)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--taupe)', fontWeight: 600 }}>
            🎉 {aT.publishedEvents}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: '2rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: '#166534',
              marginTop: '0.4rem',
            }}
          >
            {analytics?.events.published ?? 0}
          </span>
        </div>

        <div
          style={{
            background: 'var(--ivory)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--taupe)', fontWeight: 600 }}>
            👥 {aT.totalGuestsAcross}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: '2rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'var(--clay)',
              marginTop: '0.4rem',
            }}
          >
            {analytics?.guests.total ?? 0}
            {analytics?.guests.rsvpConfirmationRate && (
              <span style={{ fontSize: '0.9rem', color: 'var(--taupe)', marginInlineStart: '0.5rem' }}>
                ({analytics.guests.rsvpConfirmationRate})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            background: actionFeedback.isError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(18, 54, 58, 0.12)',
            color: actionFeedback.isError ? '#991b1b' : 'var(--teal)',
            border: `1px solid ${actionFeedback.isError ? '#f87171' : 'var(--border-subtle)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{actionFeedback.message}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div
        style={{
          background: 'var(--ivory)',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Filters and Search Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'PENDING', label: aT.filterPending },
              { id: 'ALL', label: aT.filterAll },
              { id: 'COMPLETED', label: aT.filterCompleted },
              { id: 'FAILED', label: aT.filterRejected },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-pill)',
                  border: statusFilter === tab.id ? 'none' : '1px solid var(--border-soft)',
                  background: statusFilter === tab.id ? 'var(--teal)' : 'var(--ivory-pale)',
                  color: statusFilter === tab.id ? 'var(--ivory)' : 'var(--cocoa)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ minWidth: '260px' }}>
            <input
              type="text"
              placeholder={t.dashboard.searchGuests}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-soft)',
                background: 'var(--ivory-pale)',
                color: 'var(--cocoa)',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--taupe)' }}>
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-soft)', borderTopColor: 'var(--brass)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>Loading verification queue…</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--taupe)' }}>
            <p style={{ margin: 0 }}>{aT.noOrdersFound}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'start', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-fine)', color: 'var(--taupe)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{aT.colOrderNum}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{aT.colHost}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{aT.colEvent}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{aT.colAmount}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{aT.colCliqDetails}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{aT.colReceipt}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{aT.colStatus}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{aT.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => {
                  const isPending = ord.status === 'PENDING';
                  const isApproved = ord.status === 'COMPLETED' || ord.status === 'VERIFIED';
                  const isProcessing = processingOrderId === ord.id;

                  return (
                    <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-fine)', verticalAlign: 'middle' }}>
                      {/* Order Number & Date */}
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--cocoa)', display: 'block' }}>
                          {ord.orderNumber}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--taupe)' }}>
                          {new Date(ord.createdAt).toLocaleDateString(isAr ? 'ar-JO' : 'en-US')}
                        </span>
                      </td>

                      {/* Host Name & Phone */}
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--teal)', display: 'block' }}>
                          {ord.hostName}
                        </span>
                        {ord.hostPhone && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--taupe)', direction: 'ltr', display: 'inline-block' }}>
                            {ord.hostPhone}
                          </span>
                        )}
                      </td>

                      {/* Event Title */}
                      <td style={{ padding: '0.85rem 0.5rem', maxWidth: '180px' }}>
                        <span style={{ fontWeight: 500, color: 'var(--cocoa)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ord.eventTitle}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--taupe)' }}>
                          {ord.event?.status || 'DRAFT'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '0.95rem' }}>
                          {ord.amount} {ord.currency}
                        </span>
                      </td>

                      {/* CliQ Details */}
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span style={{ fontWeight: 500, color: 'var(--cocoa)', display: 'block' }}>
                          {ord.manualVerification?.sender_name || ord.manualVerification?.senderName || '—'}
                        </span>
                        {ord.cliqReference && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--taupe)', fontFamily: 'monospace' }}>
                            {ord.cliqReference}
                          </span>
                        )}
                      </td>

                      {/* Receipt Screenshot Thumbnail */}
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        {ord.receiptImageUrl ? (
                          <div
                            onClick={() => setLightboxOrder(ord)}
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden',
                              border: '1px solid var(--border-soft)',
                              cursor: 'pointer',
                              boxShadow: 'var(--shadow-xs)',
                              display: 'inline-block',
                            }}
                            title={aT.viewFullReceipt}
                          >
                            <img
                              src={ord.receiptImageUrl}
                              alt="CliQ Receipt"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <span style={{ color: 'var(--taupe)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.65rem',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: isPending
                              ? 'rgba(184, 138, 74, 0.15)'
                              : isApproved
                              ? 'rgba(34, 197, 94, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                            color: isPending ? 'var(--brass)' : isApproved ? '#166534' : '#991b1b',
                          }}
                        >
                          {isPending
                            ? `⏳ ${aT.filterPending}`
                            : isApproved
                            ? `✓ ${aT.filterCompleted}`
                            : `✕ ${aT.filterRejected}`}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                        {isPending ? (
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => handleApprove(ord)}
                              disabled={isProcessing}
                              style={{
                                padding: '0.4rem 0.85rem',
                                borderRadius: 'var(--radius-pill)',
                                background: 'var(--teal)',
                                color: 'var(--ivory)',
                                border: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing ? 0.6 : 1,
                              }}
                            >
                              ✓ {aT.approveAndActivate}
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingOrder(ord)}
                              disabled={isProcessing}
                              style={{
                                padding: '0.4rem 0.85rem',
                                borderRadius: 'var(--radius-pill)',
                                background: 'transparent',
                                color: 'var(--clay)',
                                border: '1px solid var(--clay)',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                              }}
                            >
                              ✕ {aT.rejectPayment}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
                            {ord.manualVerification?.admin_notes || '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RECEIPT LIGHTBOX MODAL                                                    */}
      {/* ========================================================================= */}
      {lightboxOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(18, 54, 58, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setLightboxOrder(null)}
        >
          <div
            style={{
              background: 'var(--ivory)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--teal)', margin: 0, fontWeight: 700 }}>
                  {aT.colReceipt} • {lightboxOrder.orderNumber}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
                  {lightboxOrder.hostName} ({lightboxOrder.amount} {lightboxOrder.currency})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxOrder(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: 'var(--taupe)',
                }}
              >
                ✕
              </button>
            </div>

            {/* Lightbox Image Preview */}
            <div
              style={{
                padding: '1.5rem',
                overflowY: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#0a1d1f',
              }}
            >
              <img
                src={lightboxOrder.receiptImageUrl}
                alt="Full receipt screenshot"
                style={{
                  maxWidth: '100%',
                  maxHeight: '55vh',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
              />
            </div>

            {/* Lightbox Footer & Action Buttons */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--cocoa)' }}>
                <span>Sender: <strong>{lightboxOrder.manualVerification?.sender_name || lightboxOrder.hostName}</strong></span>
                {lightboxOrder.cliqReference && (
                  <span style={{ marginInlineStart: '1rem' }}>Ref: <code>{lightboxOrder.cliqReference}</code></span>
                )}
              </div>

              {lightboxOrder.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleApprove(lightboxOrder)}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--teal)',
                      color: 'var(--ivory)',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ✓ {aT.approveAndActivate}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingOrder(lightboxOrder);
                      setLightboxOrder(null);
                    }}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: 'var(--radius-pill)',
                      background: 'transparent',
                      color: 'var(--clay)',
                      border: '1px solid var(--clay)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ✕ {aT.rejectPayment}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECTION REASON MODAL                                                    */}
      {/* ========================================================================= */}
      {rejectingOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(18, 54, 58, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--ivory)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', color: 'var(--cocoa)', margin: '0 0 0.5rem' }}>
              {aT.rejectPayment}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', marginBottom: '1.25rem' }}>
              {aT.rejectionReasonPrompt}
            </p>

            <form onSubmit={handleRejectSubmit}>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={aT.rejectionReasonPlaceholder}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-soft)',
                  background: 'var(--ivory-pale)',
                  color: 'var(--cocoa)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  resize: 'none',
                  marginBottom: '1.25rem',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setRejectingOrder(null);
                    setRejectionReason('');
                  }}
                  style={{
                    padding: '0.5rem 1.2rem',
                    borderRadius: 'var(--radius-pill)',
                    background: 'none',
                    border: '1px solid var(--border-soft)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {t.dashboard.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!rejectionReason.trim() || processingOrderId === rejectingOrder.id}
                  style={{
                    padding: '0.5rem 1.4rem',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--clay)',
                    color: 'var(--ivory)',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {processingOrderId === rejectingOrder.id ? aT.rejecting : aT.rejectPayment}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
