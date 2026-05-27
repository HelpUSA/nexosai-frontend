// Public Status Page - Simple & Robust

export default function StatusPage() {
 return (
 <main className="min-h-screen bg-[#030303] text-white p-8">
 <div className="max-w-4xl mx-auto">
 <div className="text-center mb-12">
 <h1 className="text-4xl font-bold">
 Nexos<span className="text-[#6c63ff]">AI</span> Status
 </h1>
 <p className="text-gray-400 mt-2">Live System Architecture & Message Flow</p>
 </div>

 {/* Architecture Diagram - SVG */}
 <div className="bg-[#0a0a0a] border border-[#1a1a2e] rounded-xl p-8 mb-8">
 <h2 className="text-lg font-semibold mb-6 text-center">🏗️ Message Flow Architecture</h2>
 
 <div className="relative h-96">
 <svg viewBox="0 0 800 350" className="w-full h-full">
 <defs>
 <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
 <polygon points="0 0, 8 3, 0 6" fill="#6c63ff" />
 </marker>
 <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
 <stop offset="0%" stopColor="#6c63ff" stopOpacity="0" />
 <stop offset="50%" stopColor="#6c63ff" stopOpacity="1" />
 <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
 </linearGradient>
 <filter id="glowFilter">
 <feGaussianBlur stdDeviation="3" result="blur" />
 <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
 </filter>
 </defs>

 {/* Connections */}
 <line x1="100" y1="80" x2="350" y2="175" stroke="#1a1a2e" strokeWidth="2" />
 <line x1="100" y1="200" x2="350" y2="175" stroke="#1a1a2e" strokeWidth="2" />
 <line x1="350" y1="175" x2="650" y2="80" stroke="#1a1a2e" strokeWidth="2" />
 <line x1="350" y1="175" x2="650" y2="270" stroke="#1a1a2e" strokeWidth="2" />

 {/* Animated flow dots */}
 <circle r="4" fill="#6c63ff" filter="url(#glowFilter)">
 <animateMotion dur="3s" repeatCount="indefinite" path="M100,80 L350,175 L650,80" />
 </circle>
 <circle r="4" fill="#00ff88" filter="url(#glowFilter)">
 <animateMotion dur="3.5s" repeatCount="indefinite" begin="0.5s" path="M100,200 L350,175 L650,270" />
 </circle>
 <circle r="4" fill="#ff6b6b" filter="url(#glowFilter)">
 <animateMotion dur="2.5s" repeatCount="indefinite" begin="1s" path="M350,175 L650,80" />
 </circle>
 <circle r="4" fill="#ffd93d" filter="url(#glowFilter)">
 <animateMotion dur="2s" repeatCount="indefinite" begin="1.5s" path="M350,175 L650,270" />
 </circle>

 {/* Nodes */}
 {/* Chats (top left) */}
 <circle cx="100" cy="80" r="30" fill="#0a0a0a" stroke="#6c63ff" strokeWidth="2" />
 <text x="100" y="84" textAnchor="middle" fill="#6c63ff" fontSize="10" fontWeight="bold">Chats</text>
 
 {/* Extension (bottom left) */}
 <circle cx="100" cy="200" r="25" fill="#0a0a0a" stroke="#00ff88" strokeWidth="2" />
 <text x="100" y="204" textAnchor="middle" fill="#00ff88" fontSize="9" fontWeight="bold">Extensão</text>

 {/* Broker (center) */}
 <circle cx="350" cy="175" r="40" fill="#0a0a0a" stroke="#ff6b6b" strokeWidth="3" />
 <text x="350" y="170" textAnchor="middle" fill="#ff6b6b" fontSize="12" fontWeight="bold">Broker</text>
 <text x="350" y="186" textAnchor="middle" fill="#ff6b6b" fontSize="8">Railway</text>

 {/* Gateway (top right) */}
 <circle cx="650" cy="80" r="30" fill="#0a0a0a" stroke="#ffd93d" strokeWidth="2" />
 <text x="650" y="84" textAnchor="middle" fill="#ffd93d" fontSize="10" fontWeight="bold">Gateway</text>

 {/* Chat B (bottom right) */}
 <circle cx="650" cy="270" r="30" fill="#0a0a0a" stroke="#6c63ff" strokeWidth="2" />
 <text x="650" y="274" textAnchor="middle" fill="#6c63ff" fontSize="10" fontWeight="bold">Chat B</text>

 {/* Database icon bottom */}
 <rect x="320" y="300" width="60" height="25" rx="4" fill="#0a0a0a" stroke="#6c63ff" strokeWidth="1" opacity="0.6" />
 <text x="350" y="317" textAnchor="middle" fill="#6c63ff" fontSize="8">Banco</text>
 </svg>
 </div>
 </div>

 {/* Status Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
 {[
 { label: 'Gateway', status: 'Online', color: '#00ff88' },
 { label: 'Railway API', status: 'Online', color: '#00ff88' },
 { label: 'Database', status: 'Connected', color: '#00ff88' },
 { label: 'Worker', status: 'Running', color: '#00ff88' },
 ].map(s => (
 <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
 <div className="flex justify-center mb-2">
 <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color, animation: 'pulse 2s infinite' }} />
 </div>
 <div className="text-sm text-gray-300">{s.label}</div>
 <div className="text-xs" style={{ color: s.color }}>{s.status}</div>
 </div>
 ))}
 </div>

 <div className="text-center">
 <a href="/download" className="inline-block px-6 py-3 bg-[#6c63ff] text-white rounded-lg font-semibold hover:bg-[#5a52d5] transition">
 ⬇ Download Windows Installer
 </a>
 </div>
 </div>
 </main>
 );
}
