// NexosAI Dashboard - Post-login page

export default function DashboardPage() {
 return (
 <main className="min-h-screen bg-[#030303] text-white p-8">
 <div className="max-w-6xl mx-auto">
 <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
 <p className="text-gray-400 mb-8">Welcome back! Your AI Bridge is running.</p>
 
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
 <p className="text-gray-400 text-sm">Cloud Actions</p>
 <p className="text-2xl font-bold text-[#00ff88]">4 active</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-white/5 border border-white/10 rounded-xl p-6">
 <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
 <div className="space-y-2">
 <a href="/download" className="block px-4 py-2 bg-[#6c63ff]/20 hover:bg-[#6c63ff]/30 rounded-lg text-sm transition">⬇ Download Windows Installer</a>
 <a href="/api/auth/signout" className="block px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition">🚪 Sign Out</a>
 </div>
 </div>
 <div className="bg-white/5 border border-white/10 rounded-xl p-6">
 <h2 className="text-lg font-semibold mb-4">System Status</h2>
 <div className="space-y-3 text-sm">
 <div className="flex justify-between"><span className="text-gray-400">Gateway</span><span className="text-[#00ff88]">● Online</span></div>
 <div className="flex justify-between"><span className="text-gray-400">Railway API</span><span className="text-[#00ff88]">● Online</span></div>
 <div className="flex justify-between"><span className="text-gray-400">Database</span><span className="text-[#00ff88]">● Connected</span></div>
 <div className="flex justify-between"><span className="text-gray-400">Extension</span><span className="text-[#00ff88]">● Active</span></div>
 </div>
 </div>
 </div>
 </div>
 </main>
 );
}
