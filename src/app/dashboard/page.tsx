// NexosAI Dashboard - Post-login with Mode Toggle

export default function DashboardPage() {
 return (
 <main className="min-h-screen bg-[#030303] text-white p-8">
 <div className="max-w-6xl mx-auto">
 <div className="flex justify-between items-center mb-8">
 <div>
 <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
 <p className="text-gray-400">Welcome back! Control your AI Bridge.</p>
 </div>
 <div className="flex gap-3">
 <a href="/download" className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm hover:bg-white/20 transition">⬇ Installer</a>
 <a href="/api/auth/signout" className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/30 transition">Sign Out</a>
 </div>
 </div>

 {/* Mode Toggle */}
 <div className="bg-white/5 border border-[#6c63ff]/30 rounded-xl p-6 mb-8">
 <h2 className="text-lg font-semibold mb-4">⚙️ Operation Mode</h2>
 <div className="flex gap-3">
 <button className="px-6 py-3 bg-[#6c63ff] text-white rounded-lg font-semibold">
 ☁️ Cloud (Broker)
 </button>
 <button className="px-6 py-3 bg-white/10 border border-white/20 text-gray-300 rounded-lg hover:bg-white/20 transition">
 🔄 Hybrid (Gateway + Broker)
 </button>
 <button className="px-6 py-3 bg-white/10 border border-white/20 text-gray-300 rounded-lg hover:bg-white/20 transition">
 ⚡ Direct (Admin)
 </button>
 </div>
 <p className="text-xs text-gray-500 mt-3">
 Cloud: All messages go through Railway for full logging and control.<br/>
 Hybrid: Gateway polls Railway for best performance with logging.<br/>
 Direct: Instant delivery without logging (debug only).
 </p>
 </div>
 
 {/* Stats */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
 <div className="bg-white/5 border border-white/10 rounded-xl p-4">
 <p className="text-gray-400 text-sm">Chat Messages</p>
 <p className="text-2xl font-bold text-[#6c63ff]">1,135</p>
 </div>
 <div className="bg-white/5 border border-white/10 rounded-xl p-4">
 <p className="text-gray-400 text-sm">Active Chats</p>
 <p className="text-2xl font-bold text-[#00ff88]">6</p>
 </div>
 <div className="bg-white/5 border border-white/10 rounded-xl p-4">
 <p className="text-gray-400 text-sm">Commands Run</p>
 <p className="text-2xl font-bold text-[#6c63ff]">4,791</p>
 </div>
 <div className="bg-white/5 border border-white/10 rounded-xl p-4">
 <p className="text-gray-400 text-sm">Operation Mode</p>
 <p className="text-2xl font-bold text-[#00ff88]">Cloud</p>
 </div>
 </div>

 {/* Quick Actions */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-white/5 border border-white/10 rounded-xl p-6">
 <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
 <div className="space-y-2">
 <button className="w-full text-left px-4 py-2 bg-[#6c63ff]/20 hover:bg-[#6c63ff]/30 rounded-lg text-sm transition">🔍 View Message Log</button>
 <button className="w-full text-left px-4 py-2 bg-[#6c63ff]/20 hover:bg-[#6c63ff]/30 rounded-lg text-sm transition">📊 Queue Statistics</button>
 <button className="w-full text-left px-4 py-2 bg-[#6c63ff]/20 hover:bg-[#6c63ff]/30 rounded-lg text-sm transition">🧹 Cleanup Stale Messages</button>
 </div>
 </div>
 <div className="bg-white/5 border border-white/10 rounded-xl p-6">
 <h2 className="text-lg font-semibold mb-4">System Status</h2>
 <div className="space-y-3 text-sm">
 <div className="flex justify-between"><span className="text-gray-400">Gateway</span><span className="text-[#00ff88]">● Online</span></div>
 <div className="flex justify-between"><span className="text-gray-400">Railway API</span><span className="text-[#00ff88]">● Online</span></div>
 <div className="flex justify-between"><span className="text-gray-400">Database</span><span className="text-[#00ff88]">● Connected</span></div>
 <div className="flex justify-between"><span className="text-gray-400">Extension</span><span className="text-[#00ff88]">● Active</span></div>
 <div className="flex justify-between"><span className="text-gray-400">Message Log</span><span className="text-[#6c63ff]">● Recording</span></div>
 </div>
 </div>
 </div>
 </div>
 </main>
 );
}
