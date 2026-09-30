import { Injectable } from '@nestjs/common';
import { SupportedLanguage, TranslationDictionary } from './i18n.types';

@Injectable()
export class I18nService {
  private readonly translations: TranslationDictionary = {
    'otp.sent': {
      ar: 'تم إرسال رمز التحقق بنجاح إلى هاتفك.',
      en: 'Verification code sent successfully to your phone.',
    },
    'otp.verified': {
      ar: 'تم التحقق من الرمز بنجاح.',
      en: 'Verification code verified successfully.',
    },
    'otp.invalid': {
      ar: 'رمز التحقق غير صحيح.',
      en: 'Invalid verification code.',
    },
    'otp.expired': {
      ar: 'انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد.',
      en: 'Verification code has expired. Please request a new code.',
    },
    'otp.cooldown': {
      ar: 'يرجى الانتظار قبل طلب رمز تحقق جديد.',
      en: 'Please wait before requesting a new verification code.',
    },
    'media.presigned_created': {
      ar: 'تم إنشاء رابط الرفع المؤقت بنجاح.',
      en: 'Presigned upload URL generated successfully.',
    },
    'media.file_too_large': {
      ar: 'حجم الملف يتجاوز الحد المسموح به.',
      en: 'File size exceeds maximum permitted limit.',
    },
    'media.invalid_type': {
      ar: 'نوع الملف غير مدعوم.',
      en: 'Unsupported file MIME type.',
    },
    'event.created': {
      ar: 'تم إنشاء مسودة الدعوة بنجاح.',
      en: 'Event invitation draft created successfully.',
    },
    'event.updated': {
      ar: 'تم تحديث بيانات الدعوة بنجاح.',
      en: 'Event invitation updated successfully.',
    },
    'event.not_found': {
      ar: 'الدعوة المطلوبة غير موجودة.',
      en: 'Event invitation not found.',
    },
    'event.forbidden': {
      ar: 'ليس لديك صلاحية للوصول إلى هذه الدعوة.',
      en: 'You do not have permission to access this event.',
    },
    'gallery.added': {
      ar: 'تمت إضافة الصورة إلى ألبوم الدعوة بنجاح.',
      en: 'Image added to event gallery successfully.',
    },
    'gallery.deleted': {
      ar: 'تم حذف الصورة من ألبوم الدعوة بنجاح.',
      en: 'Image removed from event gallery successfully.',
    },
  };

  /**
   * Translates key into the target language with optional parameter interpolation.
   */
  t(
    key: string,
    lang: SupportedLanguage = 'ar',
    params?: Record<string, string | number>,
  ): string {
    const entry = this.translations[key];
    let message = entry ? entry[lang] ?? entry.ar : key;

    if (params) {
      for (const [paramKey, paramVal] of Object.entries(params)) {
        message = message.replace(
          new RegExp(`{${paramKey}}`, 'g'),
          String(paramVal),
        );
      }
    }

    return message;
  }
}
