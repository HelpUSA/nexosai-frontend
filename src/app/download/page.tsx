// NexosAI Download Page - Direct EXE download with SmartScreen instructions

export default function DownloadPage() {
 return (
 <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] flex items-center justify-center p-6 font-sans">
 <div className="bg-[#1a1a2e] p-8 rounded-lg border border-[#6c63ff] text-center max-w-lg">
 <div className="text-5xl mb-4">💻</div>
 <h1 className="text-2xl font-bold text-[#6c63ff] mb-2">NexosAI for Windows</h1>
 <p className="text-sm text-gray-400 mb-6">AI Bridge - Local AI Orchestration Platform</p>
 
 <a
 href="/NexosAI_Setup.exe"
 download
 className="inline-block px-8 py-4 bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00cc6a] transition text-lg mb-6"
 >
 ⬇ Download for Windows
 </a>
 
 <p className="text-xs text-gray-500 mb-4">Version 1.0 • ~2 MB • Windows 10/11</p>
 
 {/* SmartScreen Instructions */}
 <div className="bg-[#0a0a0a] border border-yellow-600 rounded-lg p-4 mb-4 text-left">
 <h3 className="text-yellow-400 text-sm font-bold mb-2">⚠️ Windows SmartScreen Alert</h3>
 <p className="text-xs text-gray-400 mb-2">Windows may show a security warning because NexosAI is a new application. This is normal.</p>
 <ol className="text-xs text-gray-300 list-decimal pl-4 space-y-1">
 <li>When the warning appears, click <span className="text-yellow-400 font-semibold">More info</span></li>
 <li>Then click <span className="text-yellow-400 font-semibold">Run anyway</span></li>
 <li>Follow the installation wizard</li>
 <li>NexosAI will run silently in the background</li>
 </ol>
 </div>

 {/* Requirements */}
 <div className="bg-[#0a0a0a] border border-[#2a2a4e] rounded-lg p-4 mb-4 text-left">
 <h3 className="text-[#6c63ff] text-sm font-bold mb-2">📋 Requirements</h3>
 <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
 <li>Windows 10 or 11</li>
 <li>Python 3.11 or later</li>
 <li>Git</li>
 <li>Node.js 20 or later</li>
 <li>Google Chrome</li>
 </ul>
 </div>

 {/* What gets installed */}
 <div className="bg-[#0a0a0a] border border-[#2a2a4e] rounded-lg p-4 mb-4 text-left">
 <h3 className="text-[#6c63ff] text-sm font-bold mb-2">📦 What gets installed</h3>
 <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
 <li>NexosAI Supervisor (runs in background)</li>
 <li>Python environment with dependencies</li>
 <li>Chrome Extension (load unpacked)</li>
 <li>Desktop shortcut</li>
 </ul>
 </div>

 <a href="/" className="text-xs text-[#6c63ff] mt-4 inline-block hover:underline">
 ← Back to Dashboard
 </a>
 </div>
 </main>
 );
}
