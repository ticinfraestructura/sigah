import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600',
          'text-gray-700 dark:text-gray-200',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500'
        )}
        aria-label="Seleccionar idioma"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4" />
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:inline text-sm font-medium">
          {currentLanguage.name}
        </span>
        <ChevronDown className={clsx(
          'w-4 h-4 transition-transform duration-200',
          isOpen && 'rotate-180'
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              'absolute right-0 mt-2 w-48 z-50',
              'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
              'border border-gray-200 dark:border-gray-700',
              'overflow-hidden'
            )}
            role="listbox"
          >
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'transition-colors duration-150',
                  language.code === i18n.language && 'bg-primary-50 dark:bg-primary-900/20'
                )}
                role="option"
                aria-selected={language.code === i18n.language}
              >
                <span className="text-xl">{language.flag}</span>
                <span className="flex-1 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                  {language.name}
                </span>
                {language.code === i18n.language && (
                  <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LanguageSelector;
