// NexosAI Download Page - Direct EXE download

export default function DownloadPage() {
 return (
 <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] flex items-center justify-center p-6 font-mono">
 <div className="bg-[#1a1a2e] p-8 rounded-lg border border-[#6c63ff] text-center max-w-md">
 <div className="text-5xl mb-4">💻</div>
 <h1 className="text-2xl font-bold text-[#6c63ff] mb-2">NexosAI for Windows</h1>
 <p className="text-sm text-gray-400 mb-6">Your download will start automatically.</p>
 
 <a
 href="/NexosAI_Setup.exe"
 download
 className="inline-block px-8 py-4 bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00cc6a] transition text-lg mb-4"
 >
 ⬇ Download Now
 </a>
 
 <p className="text-xs text-gray-500 mt-4">
 Version 1.0 • ~2 MB • Windows 10/11
 </p>
 <p className="text-xs text-gray-600 mt-2">
 Requirements: Python 3.11+ • Git • Node.js 20+ • Chrome
 </p>
 
 <a href="/" className="text-xs text-[#6c63ff] mt-4 inline-block hover:underline">
 ← Back to Dashboard
 </a>
 </div>
 </main>
 );
}
