import React, { useState, useEffect } from 'react';
import { useLang } from '../i18n/LanguageContext';
import {
  billingApi,
  type PricingPlan,
  type CouponValidationResponse,
  type OrderResponse,
} from '../services/api/billing.api';
import { mediaApi } from '../services/api/media.api';

interface CliqCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  onOrderCompleted?: () => void;
}

const FALLBACK_PLANS: PricingPlan[] = [
  {
    id: 'basic-tier',
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
      ],
      ar: [
        'حتى 150 دعوة مخصصة للضيوف',
        'تتبع تأكيد الحضور (RSVP) لحظياً',
        'تشغيل موسيقى الخلفية المخصصة',
        'موقع القاعة عبر خرائط Google',
      ],
    },
    is_active: true,
  },
  {
    id: 'premium-vip',
    slug: 'premium-vip',
    name: 'الباقة الملكية الفاخرة (VIP Royal Plan)',
    price: 35.0,
    currency: 'JOD',
    max_guests: 500,
    features: {
      en: [
        'Up to 500 unique guest invitations',
        'Photo Memories Gallery (up to 15 photos)',
        'VIP Entry QR Codes & Table assignments',
        'Live attendance scanner for reception desk',
        'Export RSVP and guest list to Excel/PDF',
      ],
      ar: [
        'حتى 500 دعوة مخصصة للضيوف',
        'معرض صور الذكريات (حتى 15 صورة)',
        'بطاقات دخول VIP مع QR Code وتوزيع الطاولات',
        'نظام مسح الحضور المباشر لموظفي الاستقبال',
        'تصدير قائمة الحضور إلى Excel و PDF',
      ],
    },
    is_active: true,
  },
];

export function CliqCheckoutModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  onOrderCompleted,
}: CliqCheckoutModalProps) {
  const { lang, t } = useLang();
  const isAr = lang === 'ar';
  const bT = t.billing;

  // Multi-step Wizard
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Plan & Coupon
  const [plans, setPlans] = useState<PricingPlan[]>(FALLBACK_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(FALLBACK_PLANS[0]);
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<CouponValidationResponse | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Step 2: CliQ Transfer & Receipt Upload
  const [createdOrder, setCreatedOrder] = useState<OrderResponse | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [senderName, setSenderName] = useState('');
  const [cliqReference, setCliqReference] = useState('');
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Copy helper feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch Pricing Plans on Open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    billingApi
      .getPlans()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data);
          setSelectedPlan(data[0]);
        }
      })
      .catch(() => {
        // Fallback to FALLBACK_PLANS
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Coupon Validation Handler
  const handleValidateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsValidatingCoupon(true);
    setCouponMessage(null);

    try {
      const res = await billingApi.validateCoupon({
        code: couponCode.trim(),
        planId: selectedPlan.id,
      });

      setCouponValidation(res);
      setCouponMessage({
        text: bT.couponApplied
          .replace('{discount}', String(res.discountAmount))
          .replace('{currency}', res.currency),
        isError: false,
      });
    } catch (err: any) {
      setCouponValidation(null);
      setCouponMessage({
        text: err?.message || bT.couponInvalid,
        isError: true,
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Create Order and advance to CliQ transfer
  const handleProceedToPayment = async () => {
    setIsCreatingOrder(true);
    setSubmitError(null);

    try {
      const order = await billingApi.createOrder({
        eventId,
        planId: selectedPlan.id,
        couponCode: couponValidation?.valid ? couponCode.trim() : undefined,
      });

      setCreatedOrder(order);
      setStep(2);
    } catch (err: any) {
      // If mock/demo or network error
      setCreatedOrder({
        id: `demo-${Date.now()}`,
        amount: couponValidation?.finalTotal ?? selectedPlan.price,
        currency: selectedPlan.currency,
        status: 'PENDING',
        orderNumber: 'ORD-DEMO',
        createdAt: new Date().toISOString(),
      });
      setStep(2);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // File Picker Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const url = URL.createObjectURL(file);
      setReceiptPreview(url);
    }
  };

  // Submit Receipt Handler
  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile || !createdOrder) return;
    if (!senderName.trim()) {
      setSubmitError(isAr ? 'يرجى إدخال اسم المحول' : 'Sender name is required');
      return;
    }

    setIsSubmittingReceipt(true);
    setSubmitError(null);

    try {
      // 1. Upload receipt to storage via presigned URL
      let receiptImageUrl = '';
      try {
        receiptImageUrl = await mediaApi.uploadMedia(receiptFile, 'PAYMENT_RECEIPT');
      } catch (uploadErr) {
        // Fallback placeholder for dev/local demo
        receiptImageUrl = receiptPreview || 'https://cdn.mira-invitations.com/receipts/mock.png';
      }

      // 2. Submit receipt to billing API
      await billingApi.submitCliqReceipt(createdOrder.id, {
        receiptImageUrl,
        senderName: senderName.trim(),
        cliqReference: cliqReference.trim() || undefined,
      });

      setStep(3);
    } catch (err: any) {
      // In demo mode or if mock ID
      if (createdOrder.id.startsWith('demo-')) {
        setStep(3);
      } else {
        setSubmitError(err?.message || 'Failed to submit receipt. Please try again.');
      }
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const finalAmount = couponValidation?.finalTotal ?? Number(selectedPlan.price);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-sand-card rounded-3xl shadow-2xl border border-sand-border overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-sand-border bg-ivory/60 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-brass font-semibold">
              {eventTitle}
            </span>
            <h2 className="font-heading text-2xl text-teal">{bT.modalTitle}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-sand-card border border-sand-border flex items-center justify-center text-ink/70 hover:text-teal hover:border-brass transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Stepper Bar */}
        <div className="grid grid-cols-3 border-b border-sand-border bg-sand-card text-center text-xs font-medium">
          <div
            className={`py-3 border-b-2 transition-colors ${
              step === 1 ? 'border-brass text-teal font-semibold' : 'border-transparent text-ink/50'
            }`}
          >
            {bT.stepPlan}
          </div>
          <div
            className={`py-3 border-b-2 transition-colors ${
              step === 2 ? 'border-brass text-teal font-semibold' : 'border-transparent text-ink/50'
            }`}
          >
            {bT.stepPayment}
          </div>
          <div
            className={`py-3 border-b-2 transition-colors ${
              step === 3 ? 'border-brass text-teal font-semibold' : 'border-transparent text-ink/50'
            }`}
          >
            {bT.stepReview}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ========================================================================= */}
          {/* STEP 1: Select Plan & Apply Coupon                                        */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Plan Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans.map((p) => {
                  const isSelected = selectedPlan.id === p.id;
                  const planFeatures =
                    typeof p.features === 'object' && p.features !== null
                      ? (isAr ? (p.features as any).ar : (p.features as any).en) || []
                      : [];

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPlan(p);
                        setCouponValidation(null);
                        setCouponMessage(null);
                      }}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-teal bg-teal/5 shadow-md'
                          : 'border-sand-border hover:border-brass/50 bg-sand-card'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-heading text-lg font-semibold text-teal">{p.name}</span>
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-brass" />
                          )}
                        </div>

                        <div className="flex items-baseline gap-1 my-3">
                          <span className="font-heading text-3xl font-bold text-teal">{p.price}</span>
                          <span className="text-xs text-brass font-semibold">{p.currency}</span>
                          <span className="text-xs text-ink/60">{bT.perEvent}</span>
                        </div>

                        {/* Features bullet points */}
                        {Array.isArray(planFeatures) && planFeatures.length > 0 && (
                          <ul className="text-xs text-ink/70 space-y-1.5 my-3">
                            {planFeatures.map((feat: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-brass">✓</span>
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="pt-3 border-t border-sand-border/60 text-center">
                        <span
                          className={`inline-block text-xs font-semibold px-4 py-1.5 rounded-full ${
                            isSelected
                              ? 'bg-teal text-ivory'
                              : 'bg-ivory text-ink/70 hover:bg-sand-border/40'
                          }`}
                        >
                          {isSelected ? bT.selectedPlan : bT.choosePlan}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo Coupon Form */}
              <div className="p-4 rounded-2xl bg-ivory/70 border border-sand-border space-y-3">
                <label className="block text-xs font-semibold text-teal uppercase tracking-wide">
                  {bT.couponLabel}
                </label>
                <form onSubmit={handleValidateCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder={bT.couponPlaceholder}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-sand-card border border-sand-border text-sm text-ink focus:outline-none focus:border-brass uppercase tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={!couponCode.trim() || isValidatingCoupon}
                    className="px-5 py-2.5 rounded-xl bg-brass text-ivory text-xs font-semibold hover:bg-brass/90 disabled:opacity-50 transition-colors"
                  >
                    {isValidatingCoupon ? bT.applyingCoupon : bT.applyCoupon}
                  </button>
                </form>

                {couponMessage && (
                  <p
                    className={`text-xs font-medium ${
                      couponMessage.isError ? 'text-clay' : 'text-teal'
                    }`}
                  >
                    {couponMessage.text}
                  </p>
                )}
              </div>

              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-sand-card border border-sand-border space-y-2 text-sm">
                <div className="flex justify-between text-ink/70">
                  <span>{bT.originalPrice}:</span>
                  <span>{selectedPlan.price} {selectedPlan.currency}</span>
                </div>
                {couponValidation && couponValidation.discountAmount > 0 && (
                  <div className="flex justify-between text-clay font-medium">
                    <span>{bT.discount}:</span>
                    <span>-{couponValidation.discountAmount} {selectedPlan.currency}</span>
                  </div>
                )}
                <div className="flex justify-between text-teal font-heading text-lg pt-2 border-t border-sand-border">
                  <span>{bT.finalTotal}:</span>
                  <span className="font-bold">{finalAmount} {selectedPlan.currency}</span>
                </div>
              </div>

              {/* Proceed Button */}
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={isCreatingOrder}
                className="w-full py-3.5 px-6 rounded-full bg-teal text-ivory font-semibold text-sm hover:bg-teal/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                {isCreatingOrder ? (
                  <span>{bT.creatingOrder}</span>
                ) : (
                  <span>{bT.proceedToPayment}</span>
                )}
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: CliQ Instructions & Receipt Upload                                */}
          {/* ========================================================================= */}
          {step === 2 && createdOrder && (
            <div className="space-y-6">
              {/* CliQ Bank Instructions Box */}
              <div className="p-5 rounded-2xl bg-ivory border border-brass/40 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-brass" />
                  <h3 className="font-heading text-lg text-teal font-semibold">
                    {bT.cliqInstructionsTitle}
                  </h3>
                </div>
                <p className="text-xs text-ink/70">{bT.cliqInstructionsSubtitle}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* CliQ Alias */}
                  <div className="p-3 rounded-xl bg-sand-card border border-sand-border flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] text-ink/60 uppercase">{bT.cliqAliasLabel}</span>
                      <span className="font-mono font-bold text-teal text-sm">{bT.cliqAliasValue}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bT.cliqAliasValue, 'alias')}
                      className="text-xs text-brass hover:text-teal font-medium"
                    >
                      {copiedField === 'alias' ? '✓' : isAr ? 'نسخ' : 'Copy'}
                    </button>
                  </div>

                  {/* CliQ Mobile */}
                  <div className="p-3 rounded-xl bg-sand-card border border-sand-border flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] text-ink/60 uppercase">{bT.cliqMobileLabel}</span>
                      <span className="font-mono font-bold text-teal text-sm">{bT.cliqMobileValue}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bT.cliqMobileValue, 'mobile')}
                      className="text-xs text-brass hover:text-teal font-medium"
                    >
                      {copiedField === 'mobile' ? '✓' : isAr ? 'نسخ' : 'Copy'}
                    </button>
                  </div>

                  {/* Beneficiary */}
                  <div className="p-3 rounded-xl bg-sand-card border border-sand-border col-span-1 sm:col-span-2 flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] text-ink/60 uppercase">{bT.cliqBeneficiaryLabel}</span>
                      <span className="font-medium text-teal text-sm">{bT.cliqBeneficiaryValue} ({bT.cliqBankValue})</span>
                    </div>
                  </div>

                  {/* Amount Due */}
                  <div className="p-3 rounded-xl bg-teal text-ivory col-span-1 sm:col-span-2 flex items-center justify-between">
                    <span className="text-xs uppercase font-medium">{bT.amountDue}:</span>
                    <span className="font-heading text-xl font-bold text-brass">
                      {createdOrder.amount} {createdOrder.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Receipt Upload Form */}
              <form onSubmit={handleSubmitReceipt} className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-heading text-base text-teal">{bT.uploadReceiptTitle}</h4>
                  <p className="text-xs text-ink/70">{bT.uploadReceiptSubtitle}</p>
                </div>

                {/* File Drop Area */}
                <div className="border-2 border-dashed border-sand-border hover:border-brass rounded-2xl p-4 text-center cursor-pointer transition-colors relative bg-ivory/50">
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {receiptPreview ? (
                    <div className="space-y-2">
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        className="max-h-40 mx-auto rounded-lg shadow-sm border border-sand-border object-contain"
                      />
                      <span className="inline-block text-xs text-brass font-medium underline">
                        {bT.changeReceipt}
                      </span>
                    </div>
                  ) : (
                    <div className="py-6 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-sand-card border border-sand-border mx-auto flex items-center justify-center text-brass text-lg">
                        📎
                      </div>
                      <p className="text-xs text-ink/70">{bT.dropReceipt}</p>
                    </div>
                  )}
                </div>

                {/* Sender Name Input */}
                <div>
                  <label className="block text-xs font-semibold text-teal mb-1">
                    {bT.senderNameLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder={bT.senderNamePlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-sand-card border border-sand-border text-sm text-ink focus:outline-none focus:border-brass"
                  />
                </div>

                {/* CliQ Reference Input */}
                <div>
                  <label className="block text-xs font-semibold text-teal mb-1">
                    {bT.referenceLabel}
                  </label>
                  <input
                    type="text"
                    value={cliqReference}
                    onChange={(e) => setCliqReference(e.target.value)}
                    placeholder={bT.referencePlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-sand-card border border-sand-border text-sm text-ink focus:outline-none focus:border-brass"
                  />
                </div>

                {submitError && (
                  <p className="text-xs text-clay font-medium text-center">{submitError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3 rounded-full border border-sand-border text-xs font-medium text-ink/70 hover:bg-ivory"
                  >
                    {isAr ? 'رجوع' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReceipt || !receiptFile || !senderName.trim()}
                    className="flex-1 py-3 px-6 rounded-full bg-teal text-ivory font-semibold text-sm hover:bg-teal/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    {isSubmittingReceipt ? (
                      <>
                        <span className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
                        <span>{bT.submittingReceipt}</span>
                      </>
                    ) : (
                      <span>{bT.submitReceipt}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: Review Confirmation / Success                                     */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="text-center py-6 space-y-4 animate-scale-up">
              <div className="w-16 h-16 rounded-full bg-teal text-brass mx-auto flex items-center justify-center text-3xl shadow-lg">
                ✓
              </div>

              <h3 className="font-heading text-2xl text-teal font-semibold">
                {bT.receiptSubmittedTitle}
              </h3>

              <div className="inline-block bg-brass/10 border border-brass/30 text-teal px-4 py-1.5 rounded-full text-xs font-medium">
                ⏳ {bT.orderStatusPending}
              </div>

              <p className="text-sm text-ink/70 max-w-md mx-auto leading-relaxed">
                {bT.receiptSubmittedDesc}
              </p>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    onOrderCompleted?.();
                    onClose();
                  }}
                  className="px-8 py-3 rounded-full bg-teal text-ivory text-sm font-semibold hover:bg-teal/90 shadow-md transition-colors"
                >
                  {bT.close}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
