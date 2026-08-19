'use client';

import { useState } from 'react';

interface LanguagePopdownProps {
  currentLang?: string;
}

export function LanguagePopdown({ currentLang = 'en' }: LanguagePopdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(currentLang);

  const getLabel = (code: string) => {
    switch (code) {
      case 'en': return '🇺🇸 English (EN)';
      case 'es': return '🇪🇸 Español (ES)';
      case 'pt': return '🇧🇷 Português (PT)';
      default: return '🇺🇸 English (EN)';
    }
  };

  const handleSelect = (code: string) => {
    setSelectedLang(code);
    setIsOpen(false);
    // Push query param
    const url = new URL(window.location.href);
    url.searchParams.set('lang', code);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="hub-lang-dropdown-wrapper">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hub-lang-trigger"
      >
        <span>🌐</span>
        <span>{getLabel(selectedLang)}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>▾</span>
      </button>

      {isOpen && (
        <div className="hub-lang-popdown" onClick={() => setIsOpen(false)}>
          <button
            onClick={() => handleSelect('en')}
            className={`hub-lang-option ${selectedLang === 'en' ? 'active' : ''}`}
          >
            <span>🇺🇸</span> <span>English</span>
          </button>
          <button
            onClick={() => handleSelect('es')}
            className={`hub-lang-option ${selectedLang === 'es' ? 'active' : ''}`}
          >
            <span>🇪🇸</span> <span>Español</span>
          </button>
          <button
            onClick={() => handleSelect('pt')}
            className={`hub-lang-option ${selectedLang === 'pt' ? 'active' : ''}`}
          >
            <span>🇧🇷</span> <span>Português</span>
          </button>
        </div>
      )}
    </div>
  );
}
