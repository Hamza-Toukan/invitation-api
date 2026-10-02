import { useLang } from '../i18n/LanguageContext';

interface Props {
  className?: string;
}

export function LangSwitch({ className = '' }: Props) {
  const { lang, setLang } = useLang();
  return (
    <div className={`lang-switch ${className}`.trim()} role="group" aria-label="Language">
      <button
        type="button"
        className={`lang-switch__opt ${lang === 'en' ? 'is-active' : ''}`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        className={`lang-switch__opt ${lang === 'ar' ? 'is-active' : ''}`}
        onClick={() => setLang('ar')}
        aria-pressed={lang === 'ar'}
      >
        AR
      </button>
    </div>
  );
}
