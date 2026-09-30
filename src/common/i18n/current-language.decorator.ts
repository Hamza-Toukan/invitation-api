import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SupportedLanguage } from './i18n.types';

export const CurrentLanguage = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SupportedLanguage => {
    const request = ctx.switchToHttp().getRequest();
    const rawHeader =
      request.headers['accept-language'] ||
      request.headers['Accept-Language'] ||
      '';

    if (typeof rawHeader === 'string' && rawHeader.toLowerCase().startsWith('en')) {
      return 'en';
    }

    return 'ar';
  },
);
