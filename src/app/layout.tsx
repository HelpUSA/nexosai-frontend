import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexosAI Cloud — Central de Comando de IA',
  description: 'NexosAI Cloud Mesh: Orquestração segura de agentes autônomos de IA e nós de execução local.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='pt-BR'>
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
                  🖥️ Nós (Nodes)
                </a>
                <a href='/agents'>
                  🤖 Agentes de IA
                </a>
                <a href='/projects'>
                  📁 Projetos
                </a>
                <a href='/conversations'>
                  💬 Conversas & Relays
                </a>
                <a href='/downloads'>
                  📥 Downloads
                </a>
                <a href='/audit'>
                  🛡️ Auditoria & Logs
                </a>
                <a href='/admin'>
                  ⚙️ Administração
                </a>
              </nav>
            </div>

            <div className='sidebarNote'>
              <strong>HelpUS LLC — Gulf Shores, AL</strong><br />
              Admin Bootstrap: helpus.ecommerce@gmail.com
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

              {/* Native Language Switcher (PT | EN | ES) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className='hub-lang-switcher'>
                  <a href='?lang=pt' className='hub-lang-btn active'>PT</a>
                  <a href='?lang=en' className='hub-lang-btn'>EN</a>
                  <a href='?lang=es' className='hub-lang-btn'>ES</a>
                </div>

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
