export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'Arial, sans-serif', lineHeight: 1.6, color: '#333' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Last updated: May 30, 2026</p>

      <p>NexoAI ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our browser extension and related services.</p>

      <h2 style={{ fontSize: 22, marginTop: 32 }}>Information We Collect</h2>
      <ul>
        <li><strong>Chat Messages:</strong> Text content from ChatGPT and DeepSeek chat tabs to enable cross-chat communication and command execution.</li>
        <li><strong>Chat Metadata:</strong> Chat titles and URLs to identify and organize conversations.</li>
        <li><strong>Command Results:</strong> Output from commands executed through our service.</li>
      </ul>

      <h2 style={{ fontSize: 22, marginTop: 32 }}>Data Storage & Security</h2>
      <p>All data is stored securely on Railway PostgreSQL servers with encryption. We do not sell, trade, or share your data with third parties.</p>

      <h2 style={{ fontSize: 22, marginTop: 32 }}>Permissions</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: 10, borderBottom: '1px solid #ddd', textAlign: 'left' }}>Permission</th>
            <th style={{ padding: 10, borderBottom: '1px solid #ddd', textAlign: 'left' }}>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={{ padding: 10, borderBottom: '1px solid #eee' }}><strong>tabs</strong></td><td style={{ padding: 10, borderBottom: '1px solid #eee' }}>Identify open chat tabs for message routing</td></tr>
          <tr><td style={{ padding: 10, borderBottom: '1px solid #eee' }}><strong>storage</strong></td><td style={{ padding: 10, borderBottom: '1px solid #eee' }}>Cache configuration locally</td></tr>
          <tr><td style={{ padding: 10, borderBottom: '1px solid #eee' }}><strong>alarms</strong></td><td style={{ padding: 10, borderBottom: '1px solid #eee' }}>Schedule periodic tasks</td></tr>
          <tr><td style={{ padding: 10 }}><strong>Host Access</strong></td><td style={{ padding: 10 }}>Limited to chatgpt.com and chat.deepseek.com</td></tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: 22, marginTop: 32 }}>Contact Us</h2>
      <p><strong>Email:</strong> admin@helpusbr.com</p>
      <p><strong>Website:</strong> nexoai.helpusbr.com</p>

      <hr style={{ marginTop: 48 }} />
      <p style={{ color: '#999', fontSize: 14 }}>NexoAI is a product of HelpUS LLC. All rights reserved.</p>
    </div>
  );
}