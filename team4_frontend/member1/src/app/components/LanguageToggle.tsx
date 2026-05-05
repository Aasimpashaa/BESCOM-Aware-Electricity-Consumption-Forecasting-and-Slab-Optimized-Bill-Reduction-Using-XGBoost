import { useLang } from '../context/LanguageContext';

export function LanguageToggle() {
  const { language, toggleLang } = useLang();
  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm"
      title={language === 'en' ? 'Switch to Kannada' : 'Switch to English'}
    >
      <span className="text-base">{language === 'en' ? '🇮🇳' : '🇬🇧'}</span>
      <span className="font-semibold">
        {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
      </span>
    </button>
  );
}
