export default function PrivacyPage() {
 return (
 <main style={{ maxWidth: 800, margin: '0 auto', padding: 40 }}>
 <h1>Privacy Policy for NexoAI</h1>
 <p><strong>Last updated: May 30, 2026</strong></p>

 <h2>Data Collection</h2>
 <p>NexoAI reads messages from ChatGPT and DeepSeek chat tabs to enable communication between chats and command execution. All data is processed locally or sent to our secure Railway server.</p>

 <h2>Data We Process</h2>
 <ul>
 <li>Chat messages (text content)</li>
 <li>Chat titles and URLs</li>
 <li>Command execution results</li>
 </ul>

 <h2>Data Storage</h2>
 <ul>
 <li>Data is stored securely on Railway PostgreSQL</li>
 <li>No data is sold or shared with third parties</li>
 </ul>

 <h2>Permissions</h2>
 <ul>
 <li><strong>tabs</strong>: To identify open chat tabs</li>
 <li><strong>storage</strong>: To cache configuration locally</li>
 <li><strong>alarms</strong>: To schedule periodic tasks</li>
 <li><strong>Host permissions</strong>: Limited to chatgpt.com and chat.deepseek.com</li>
 </ul>

 <h2>Contact</h2>
 <p>For questions, contact: helpus.ecommerce@gmail.com</p>
 </main>
 );
}
