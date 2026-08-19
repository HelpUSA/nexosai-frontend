import type { Metadata } from 'next';
import './globals.css';
import { LanguagePopdown } from './components/LanguagePopdown';

export const metadata: Metadata = {
  title: 'NexosAI Cloud — AI Agent Mesh & Orchestration Platform',
  description: 'NexosAI Cloud Mesh: Secure enterprise orchestration for autonomous AI agents, multi-LLM routing, and local execution nodes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <div className='shell'>
          
          {/* Sidebar Navigation with Official HelpUS Logo */}
          <aside className='sidebar'>
            <div>
              <a href='/dashboard' className='brand'>
                <img
                  src='/helpus_logo.png'
                  alt='HelpUS Logo'
                  style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
                />
                <div>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--text-dark)' }}>NexosAI</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Cloud Mesh
                  </span>
                </div>
              </a>

              <nav>
                <a href='/' className='active'>
                  🏠 Home / Mesh Overview
                </a>
                <a href='/dashboard'>
                  ⚡ Dashboard
                </a>
                <a href='/nodes'>
                  🖥️ Nodes Mesh
                </a>
                <a href='/agents'>
                  🤖 AI Agents
                </a>
                <a href='/projects'>
                  📁 Projects
                </a>
                <a href='/conversations'>
                  💬 Conversations & Relays
                </a>
                <a href='/downloads'>
                  📥 Downloads & Setup
                </a>
                <a href='/audit'>
                  🛡️ Audit Logs
                </a>
                <a href='/admin'>
                  ⚙️ Admin Settings
                </a>
              </nav>
            </div>

            <div className='sidebarNote'>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <img src='/helpus_logo.png' alt='HelpUS' style={{ height: '24px', width: 'auto' }} />
                <strong style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>HelpUS LLC</strong>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Gulf Shores, AL 36542<br />
                helpus.ecommerce@gmail.com
              </span>
            </div>
          </aside>

          {/* Main Workspace Area */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            
            {/* Top Header Navbar */}
            <header className='topHeader'>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src='/helpus_logo.png'
                  alt='HelpUS Logo'
                  style={{ height: '36px', width: 'auto' }}
                />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                    NexosAI <span style={{ color: 'var(--primary)' }}>Cloud Mesh</span>
                  </span>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Alabama Launchpad Cycle 2 2026 • HelpUS LLC
                  </span>
                </div>
              </div>

              {/* Language Switcher Popdown Menu (Default: EN 🇺🇸) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <LanguagePopdown currentLang="en" />

                <a href='https://helpusbr.com' target='_blank' rel='noopener noreferrer' className='buttonSecondary' style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                  HelpUS Portal ↗
                </a>
              </div>
            </header>

            <main className='main'>{children}</main>

            {/* Clean Footer with Official HelpUS Logo */}
            <footer style={{ marginTop: 'auto', background: '#ffffff', borderTop: '1px solid var(--border-light)', padding: '24px 32px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src='/helpus_logo.png' alt='HelpUS Logo' style={{ height: '36px', width: 'auto' }} />
                  <div>
                    <strong style={{ color: 'var(--text-dark)' }}>NexosAI Cloud Mesh</strong> by HelpUS LLC
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>© 2026 HelpUS LLC. 241 E 16th Ave Ste B4, Gulf Shores, AL 36542.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
                  <a href='/privacy' style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Privacy Policy</a>
                  <a href='/status' style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>System Status</a>
                  <a href='mailto:contato@helpusbr.com' style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Contact Support</a>
                </div>
              </div>
            </footer>

          </div>

        </div>
      </body>
    </html>
  );
}
