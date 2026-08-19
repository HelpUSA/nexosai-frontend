import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from './components/Navbar';

export const metadata: Metadata = {
  title: 'NexosAI Cloud — AI Agent Mesh & Orchestration Platform',
  description: 'NexosAI Cloud Mesh: Secure enterprise orchestration for autonomous AI agents, multi-LLM routing, and local execution nodes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>
          
          {/* Responsive Top Navigation Header */}
          <Navbar lang="en" />

          {/* Full-width Responsive Main Workspace Area */}
          <main className='app-container'>
            {children}
          </main>

          {/* Clean Enterprise Footer with Official HelpUS Logo */}
          <footer style={{ marginTop: 'auto', background: '#ffffff', borderTop: '1px solid var(--border-light)', padding: '32px 24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src='/helpus_logo.png'
                  alt='HelpUS Logo'
                  style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
                />
                <div>
                  <strong style={{ color: 'var(--text-dark)', fontSize: '0.95rem' }}>NexosAI Cloud Mesh</strong> by HelpUS LLC
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    © 2026 HelpUS LLC. 241 E 16th Ave Ste B4, Gulf Shores, AL 36542.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                <a href='/privacy' style={{ color: 'var(--primary)', textDecoration: 'none' }}>Privacy Policy</a>
                <a href='/status' style={{ color: 'var(--primary)', textDecoration: 'none' }}>System Status</a>
                <a href='https://helpusbr.com' target='_blank' rel='noopener noreferrer' style={{ color: 'var(--primary)', textDecoration: 'none' }}>HelpUS Portal ↗</a>
                <a href='mailto:contato@helpusbr.com' style={{ color: 'var(--primary)', textDecoration: 'none' }}>Contact Support</a>
              </div>

            </div>
          </footer>

        </div>
      </body>
    </html>
  );
}
