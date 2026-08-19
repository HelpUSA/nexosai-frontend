'use client';

import { useState } from 'react';
import { LanguagePopdown } from './LanguagePopdown';

export function Navbar({ lang = 'en' }: { lang?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: `/?lang=${lang}`, label: lang === 'pt' ? 'Início' : lang === 'es' ? 'Inicio' : 'Home', icon: '🏠' },
    { href: `/dashboard?lang=${lang}`, label: 'Dashboard', icon: '⚡' },
    { href: `/nodes?lang=${lang}`, label: 'Nodes Mesh', icon: '🖥️' },
    { href: `/agents?lang=${lang}`, label: 'AI Agents', icon: '🤖' },
    { href: `/projects?lang=${lang}`, label: 'Projects', icon: '📁' },
    { href: `/conversations?lang=${lang}`, label: 'Relays & Chats', icon: '💬' },
    { href: `/downloads?lang=${lang}`, label: 'Downloads', icon: '📥' },
    { href: `/audit?lang=${lang}`, label: 'Audit Logs', icon: '🛡️' },
    { href: `/admin?lang=${lang}`, label: 'Admin', icon: '⚙️' },
  ];

  return (
    <header className='top-navbar'>
      <div className='navbar-container'>
        
        {/* Brand Header with HelpUS Logo */}
        <a href={`/?lang=${lang}`} className='navbar-brand'>
          <img
            src='/helpus_logo.png'
            alt='HelpUS Logo'
            style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-dark)', lineHeight: '1.1' }}>
              NexosAI <span style={{ color: 'var(--primary)' }}>Cloud Mesh</span>
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700' }}>
              HelpUS LLC • AL 36542
            </span>
          </div>
        </a>

        {/* Desktop Horizontal Navigation Links */}
        <nav className='desktop-nav'>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className='nav-link'>
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </a>
          ))}
        </nav>

        {/* Right Action Items & Mobile Menu Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LanguagePopdown currentLang={lang} />

          <a
            href='https://helpusbr.com'
            target='_blank'
            rel='noopener noreferrer'
            className='buttonSecondary desktop-only'
            style={{ fontSize: '0.78rem', padding: '6px 14px', borderRadius: '10px' }}
          >
            HelpUS Site ↗
          </a>

          {/* Mobile Hamburger Button (Três Tracinhos ☰) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='mobile-hamburger-btn'
            aria-label='Toggle Mobile Navigation'
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className='mobile-nav-drawer'>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className='mobile-nav-link'
                onClick={() => setMobileMenuOpen(false)}
              >
                <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                <span>{link.label}</span>
              </a>
            ))}
          </nav>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a
              href='https://helpusbr.com'
              target='_blank'
              rel='noopener noreferrer'
              className='button'
              style={{ textAlign: 'center', justifyContent: 'center' }}
            >
              HelpUS Portal ↗
            </a>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              © 2026 HelpUS LLC • Gulf Shores, AL
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
