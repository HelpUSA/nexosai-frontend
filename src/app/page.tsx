// NexosAI Dashboard - Connected to Railway watcher-api
// Version: 0.1.0-dashboard

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://watcher-api-production-56ad.up.railway.app";

async function getStatus() {
 try {
 const res = await fetch(`${API_BASE}/health`, { next: { revalidate: 30 } });
 return await res.json();
 } catch {
 return { ok: false, service: "offline" };
 }
}

async function getDocs() {
 try {
 const res = await fetch(`${API_BASE}/db-query`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 sql: "SELECT heading_text, content_md FROM memory.document_sections ORDER BY order_index LIMIT 6",
 }),
 next: { revalidate: 60 },
 });
 const data = await res.json();
 return data.db_query?.rows || [];
 } catch {
 return [];
 }
}

async function getGitLog() {
 try {
 const res = await fetch(`${API_BASE}/git-op`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ operation: "log", args: ["5"] }),
 next: { revalidate: 60 },
 });
 const data = await res.json();
 return data.git_op?.result || [];
 } catch {
 return [];
 }
}

export default async function Dashboard() {
 const status = await getStatus();
 const docs = await getDocs();
 const gitLog = await getGitLog();

 return (
 <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] p-6 font-mono">
 {/* Header */}
 <header className="flex justify-between items-center mb-8 border-b border-[#1a1a2e] pb-4">
 <div>
 <h1 className="text-2xl font-bold text-[#6c63ff]">NexosAI</h1>
 <p className="text-sm text-gray-500">Dashboard v0.1.0</p>
 </div>
 <div className="flex items-center gap-4">
 <span className={`px-3 py-1 rounded text-sm ${status.ok ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
 {status.ok ? '🟢 Online' : '🔴 Offline'}
 </span>
 </div>
 </header>

 {/* Status Cards */}
 <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
 <div className="bg-[#1a1a2e] p-4 rounded-lg border border-[#2a2a4e]">
 <h3 className="text-sm text-gray-400 mb-2">Watcher API</h3>
 <p className="text-lg">{status.service || "N/A"}</p>
 <p className="text-xs text-gray-500">{status.version || ""}</p>
 </div>
 <div className="bg-[#1a1a2e] p-4 rounded-lg border border-[#2a2a4e]">
 <h3 className="text-sm text-gray-400 mb-2">Database</h3>
 <p className="text-lg">{status.database?.database || "N/A"}</p>
 <p className="text-xs text-gray-500">{status.database?.now || ""}</p>
 </div>
 <div className="bg-[#1a1a2e] p-4 rounded-lg border border-[#2a2a4e]">
 <h3 className="text-sm text-gray-400 mb-2">Cloud Actions</h3>
 <p className="text-lg">4 ativas</p>
 <p className="text-xs text-gray-500">git-op | db-query | codex | file-ops</p>
 </div>
 </section>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Documentation */}
 <section className="bg-[#1a1a2e] p-4 rounded-lg border border-[#2a2a4e]">
 <h2 className="text-lg font-bold text-[#6c63ff] mb-4">📚 Documentação</h2>
 {docs.length > 0 ? (
 <ul className="space-y-3">
 {docs.map((doc: any, i: number) => (
 <li key={i} className="border-b border-[#2a2a4e] pb-2">
 <h4 className="text-sm font-semibold text-[#00ff88]">{doc.heading_text}</h4>
 <p className="text-xs text-gray-400 mt-1">{doc.content_md?.slice(0, 120)}...</p>
 </li>
 ))}
 </ul>
 ) : (
 <p className="text-sm text-gray-500">Carregando documentação...</p>
 )}
 </section>

 {/* Git Log */}
 <section className="bg-[#1a1a2e] p-4 rounded-lg border border-[#2a2a4e]">
 <h2 className="text-lg font-bold text-[#6c63ff] mb-4">🔧 Git Log</h2>
 {Array.isArray(gitLog) && gitLog.length > 0 ? (
 <ul className="space-y-2">
 {gitLog.slice(0, 5).map((log: string, i: number) => (
 <li key={i} className="text-xs text-gray-400 border-b border-[#2a2a4e] pb-1">
 {log}
 </li>
 ))}
 </ul>
 ) : (
 <p className="text-sm text-gray-500">Carregando git log...</p>
 )}
 </section>
 </div>

 {/* Footer */}
 <footer className="mt-8 pt-4 border-t border-[#1a1a2e] text-xs text-gray-600 text-center">
 NexosAI • {API_BASE} • {new Date().getFullYear()}
 </footer>
 </main>
 );
}
