// Public Status Page - Live Architecture Flow (no login required)

import ArchitectureFlow from "@/app/components/ArchitectureFlow";

export default function StatusPage() {
 return (
 <main className="min-h-screen bg-[#030303] text-white p-8">
 <div className="max-w-6xl mx-auto">
 <div className="flex justify-between items-center mb-8">
 <div>
 <h1 className="text-3xl font-bold">
 Nexos<span className="text-[#6c63ff]">AI</span> Status
 </h1>
 <p className="text-gray-400 mt-1">Live system architecture and message flow</p>
 </div>
 <div className="flex gap-3">
 <a href="/" className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm hover:bg-white/20 transition">← Home</a>
 <a href="/download" className="px-4 py-2 bg-[#6c63ff] text-white rounded-lg text-sm hover:bg-[#5a52d5] transition">⬇ Download</a>
 </div>
 </div>

 {/* Live Architecture Flow */}
 <ArchitectureFlow />

 {/* System Status */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
 <div className="bg-white/5 border border-white/10 rounded-xl p-4">
 <div className="flex items-center gap-2 mb-2">
 <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
 <span className="text-sm text-gray-300">Gateway</span>
 </div>
 <p className="text-xs text-gray-500">127.0.0.1:8765</p>
 </div>
 <div className="bg-white/5 border border-white/10 rounded-xl p-4">
 <div className="flex items-center gap-2 mb-2">
 <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
 <span className="text-sm text-gray-300">Railway API</span>
 </div>
 <p className="text-xs text-gray-500">watcher-api-production</p>
 </div>
 <div className="bg-white/5 border border-white/10 rounded-xl p-4">
 <div className="flex items-center gap-2 mb-2">
 <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
 <span className="text-sm text-gray-300">Database</span>
 </div>
 <p className="text-xs text-gray-500">ops.message_log active</p>
 </div>
 </div>
 </div>
 </main>
 );
}
