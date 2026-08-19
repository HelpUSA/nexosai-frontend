import type { Metadata } from 'next';
import './globals.css';
import { LanguagePopdown } from './components/LanguagePopdown';

export const metadata: Metadata = {
  title: 'NexosAI Cloud — AI Agent Command Center',
  description: 'NexosAI Cloud Mesh: Secure orchestration for autonomous AI agents and local execution nodes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <div className='shell'>
          
          {/* Sidebar Navigation */}
          <aside className='sidebar'>
            <div>
              <a href='/dashboard' className='brand'>
                <div className='brandMark'>N</div>
                <div>
                  <strong>NexosAI</strong>
                  <span>Cloud Mesh</span>
                </div>
              </a>

              <nav>
                <a href='/dashboard' className='active'>
                  ⚡ Dashboard
                </a>
                <a href='/nodes'>
                  🖥️ Nodes
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
                  📥 Downloads
                </a>
                <a href='/audit'>
                  🛡️ Audit Logs
                </a>
                <a href='/admin'>
                  ⚙️ Admin
                </a>
              </nav>
            </div>

            <div className='sidebarNote'>
              <strong>HelpUS LLC — Gulf Shores, AL</strong><br />
              Bootstrap Admin: helpus.ecommerce@gmail.com
            </div>
          </aside>

          {/* Main Workspace Area */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            
            {/* Top Header Navbar */}
            <header className='topHeader'>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '8px' }}>
                  NexosAI Cloud Mesh
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  HelpUS Technology Platform
                </span>
              </div>

              {/* Language Switcher Popdown Menu (Default: EN 🇺🇸) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <LanguagePopdown currentLang="en" />

                <a href='https://helpusbr.com' target='_blank' rel='noopener noreferrer' className='buttonSecondary' style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                  HelpUS Site ↗
                </a>
              </div>
            </header>

            <main className='main'>{children}</main>
          </div>

        </div>
      </body>
    </html>
  );
}
