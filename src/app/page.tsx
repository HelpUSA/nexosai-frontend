// NexosAI Premium Landing Page - Animated particles, glassmorphism, Google login

import Link from "next/link";

export default function LandingPage() {
 return (
 <main className="relative h-screen w-screen overflow-hidden bg-[#030303] font-sans">
 {/* Animated Particles Background */}
 <div className="absolute inset-0">
 {/* Floating orbs */}
 <div className="absolute top-1/4 -left-20 w-72 h-72 bg-[#6c63ff] rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-float-slow" />
 <div className="absolute top-1/3 right-0 w-96 h-96 bg-[#00ff88] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-float-slower" />
 <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-[#6c63ff] rounded-full mix-blend-screen filter blur-[100px] opacity-25 animate-float" />
 
 {/* Grid lines */}
 <div className="absolute inset-0 opacity-[0.03]" style={{
 backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
 backgroundSize: '80px 80px'
 }} />
 
 {/* Dots pattern */}
 <div className="absolute inset-0 opacity-10" style={{
 backgroundImage: 'radial-gradient(circle, #6c63ff 1px, transparent 1px)',
 backgroundSize: '40px 40px'
 }} />
 </div>

 {/* Navbar */}
 <nav className="relative z-20 flex justify-between items-center px-8 py-6">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c63ff] to-[#00ff88]" />
 <span className="text-white font-semibold text-lg">NexosAI</span>
 </div>
 <a
 href="/api/auth/signin"
 className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-all"
 >
 Sign In
 </a>
 </nav>

 {/* Hero Content */}
 <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100vh-120px)] text-center px-6">
 {/* Badge */}
 <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-sm text-gray-300">
 <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
 AI Bridge Platform
 </div>

 {/* Main Title */}
 <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight leading-none">
 Your AI,<br />
 <span className="bg-gradient-to-r from-[#6c63ff] via-[#a78bfa] to-[#00ff88] bg-clip-text text-transparent">
 Locally Orchestrated
 </span>
 </h1>
 
 {/* Description */}
 <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
 Connect ChatGPT and DeepSeek to your local machine. Automate workflows, manage AI agents, and orchestrate multi-chat operations — all from a single dashboard.
 </p>

 {/* CTA Buttons */}
 <div className="flex gap-4">
 <a
 href="/api/auth/signin"
 className="group flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:shadow-[#6c63ff]/30 hover:scale-105"
 >
 <svg className="w-5 h-5" viewBox="0 0 24 24">
 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
 </svg>
 Continue with Google
 </a>
 <Link
 href="/download"
 className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-all"
 >
 Download for Windows
 </Link>
 </div>

 {/* Features Grid */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl">
 <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-left hover:border-[#6c63ff]/30 transition-all">
 <div className="w-10 h-10 bg-[#6c63ff]/20 rounded-lg flex items-center justify-center mb-3">
 <span className="text-xl">🔗</span>
 </div>
 <h3 className="text-white font-semibold mb-2">Multi-Chat Relay</h3>
 <p className="text-gray-400 text-sm">Send messages between ChatGPT and DeepSeek tabs seamlessly.</p>
 </div>
 <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-left hover:border-[#6c63ff]/30 transition-all">
 <div className="w-10 h-10 bg-[#00ff88]/20 rounded-lg flex items-center justify-center mb-3">
 <span className="text-xl">☁️</span>
 </div>
 <h3 className="text-white font-semibold mb-2">Cloud Actions</h3>
 <p className="text-gray-400 text-sm">Git ops, code analysis, database queries — all via Railway.</p>
 </div>
 <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-left hover:border-[#6c63ff]/30 transition-all">
 <div className="w-10 h-10 bg-[#6c63ff]/20 rounded-lg flex items-center justify-center mb-3">
 <span className="text-xl">🖥️</span>
 </div>
 <h3 className="text-white font-semibold mb-2">Local Execution</h3>
 <p className="text-gray-400 text-sm">Run scripts locally with full filesystem access. Secure and private.</p>
 </div>
 </div>
 </div>

 {/* Bottom Gradient Bar */}
 <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6c63ff] via-[#00ff88] to-[#6c63ff]" />
 </main>
 );
}
