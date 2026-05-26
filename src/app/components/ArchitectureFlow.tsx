'use client';

import { useEffect, useState, useRef } from 'react';

type FlowParticle = {
 id: string;
 from: string;
 to: string;
 progress: number;
 color: string;
 speed: number;
};

type LogEntry = {
 id: number;
 command_id: string;
 event_type: string;
 source_chat_id: string;
 target_chat_id: string;
 adapter: string;
 created_at: string;
};

export default function ArchitectureFlow() {
 const [messages, setMessages] = useState<LogEntry[]>([]);
 const [activeChats, setActiveChats] = useState<string[]>([]);
 const [particles, setParticles] = useState<FlowParticle[]>([]);
 const [stats, setStats] = useState({ total: 0, queued: 0, delivered: 0, failed: 0 });
 const canvasRef = useRef<HTMLCanvasElement>(null);

 // Fetch real data
 useEffect(() => {
 const fetchData = async () => {
 try {
 const res = await fetch('https://watcher-api-production-56ad.up.railway.app/db-query', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 sql: "SELECT id, command_id, event_type, source_chat_id, target_chat_id, adapter, created_at FROM ops.message_log ORDER BY id DESC LIMIT 30"
 })
 });
 const data = await res.json();
 if (data.db_query?.rows) {
 setMessages(data.db_query.rows);
 const chats = Array.from(new Set(data.db_query.rows.flatMap((m: any) => [m.source_chat_id, m.target_chat_id]).filter(Boolean)));
 setActiveChats(chats.slice(0, 6));

 // Calculate stats
 const rows = data.db_query.rows;
 setStats({
 total: rows.length,
 queued: rows.filter((r: any) => r.event_type === 'queued').length,
 delivered: rows.filter((r: any) => r.event_type === 'delivered' || r.event_type === 'acked').length,
 failed: rows.filter((r: any) => r.event_type === 'failed').length,
 });
 }
 } catch (e) {}
 };
 fetchData();
 const interval = setInterval(fetchData, 3000);
 return () => clearInterval(interval);
 }, []);

 // Generate flowing particles
 useEffect(() => {
 if (activeChats.length === 0) return;
 
 const paths = [
 { from: 'chat', to: 'broker', color: '#6c63ff' },
 { from: 'broker', to: 'gateway', color: '#00ff88' },
 { from: 'broker', to: 'chatb', color: '#ff6b6b' },
 { from: 'gateway', to: 'chatb', color: '#ffd93d' },
 ];

 const newParticles: FlowParticle[] = [];
 paths.forEach((path, i) => {
 for (let j = 0; j < 3; j++) {
 newParticles.push({
 id: `${path.from}-${path.to}-${j}`,
 from: path.from,
 to: path.to,
 progress: Math.random() * 100,
 color: path.color,
 speed: 0.3 + Math.random() * 0.7,
 });
 }
 });
 setParticles(newParticles);

 const interval = setInterval(() => {
 setParticles(prev => prev.map(p => ({
 ...p,
 progress: (p.progress + p.speed) % 100,
 })));
 }, 50);
 return () => clearInterval(interval);
 }, [activeChats]);

 // Canvas animation
 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext('2d');
 if (!ctx) return;

 const resize = () => {
 canvas.width = canvas.offsetWidth * 2;
 canvas.height = canvas.offsetHeight * 2;
 ctx.scale(2, 2);
 };
 resize();
 window.addEventListener('resize', resize);

 const nodes: Record<string, { x: number; y: number; r: number; color: string; label: string }> = {
 chat: { x: 15, y: 15, r: 20, color: '#6c63ff', label: 'Chats' },
 extension: { x: 15, y: 40, r: 16, color: '#00ff88', label: 'Extensão' },
 broker: { x: 50, y: 50, r: 28, color: '#ff6b6b', label: 'Broker' },
 gateway: { x: 80, y: 20, r: 20, color: '#ffd93d', label: 'Gateway' },
 chatb: { x: 80, y: 75, r: 20, color: '#6c63ff', label: 'Chat B' },
 };

 let frame = 0;
 const animate = () => {
 ctx.clearRect(0, 0, canvas.width, canvas.height);
 
 // Draw connection lines with glow
 const connections = [
 ['chat', 'broker'], ['extension', 'broker'],
 ['broker', 'gateway'], ['broker', 'chatb'],
 ['gateway', 'chatb']
 ];
 
 connections.forEach(([from, to]) => {
 const fn = nodes[from];
 const tn = nodes[to];
 if (!fn || !tn) return;
 
 ctx.beginPath();
 ctx.moveTo(String(fn.x) + '%', String(fn.y) + '%');
 ctx.lineTo(String(tn.x) + '%', String(tn.y) + '%');
 ctx.strokeStyle = '#1a1a2e';
 ctx.lineWidth = 1;
 ctx.stroke();
 
 // Glow line
 ctx.beginPath();
 ctx.moveTo(String(fn.x) + '%', String(fn.y) + '%');
 ctx.lineTo(String(tn.x) + '%', String(tn.y) + '%');
 ctx.strokeStyle = `${fn.color}15`;
 ctx.lineWidth = 3;
 ctx.stroke();
 });

 // Draw animated particles
 particles.forEach(p => {
 const fn = nodes[p.from];
 const tn = nodes[p.to];
 if (!fn || !tn) return;
 
 const x = fn.x + (tn.x - fn.x) * (p.progress / 100);
 const y = fn.y + (tn.y - fn.y) * (p.progress / 100);
 const alpha = 0.4 + 0.6 * Math.sin((p.progress / 100) * Math.PI);
 
 ctx.beginPath();
 ctx.arc(String(x) + '%', String(y) + '%', 2.5, 0, Math.PI * 2);
 ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
 ctx.fill();
 
 // Trail
 ctx.beginPath();
 ctx.arc(String(x) + '%', String(y) + '%', 6, 0, Math.PI * 2);
 ctx.fillStyle = p.color + '10';
 ctx.fill();
 });

 // Draw nodes
 Object.values(nodes).forEach(node => {
 // Outer glow
 const gradient = ctx.createRadialGradient(String(node.x) + '%', String(node.y) + '%', node.r * 0.5, String(node.x) + '%', String(node.y) + '%', node.r * 1.5);
 gradient.addColorStop(0, node.color + '30');
 gradient.addColorStop(1, 'transparent');
 ctx.beginPath();
 ctx.arc(String(node.x) + '%', String(node.y) + '%', node.r * 1.5, 0, Math.PI * 2);
 ctx.fillStyle = gradient;
 ctx.fill();

 // Node circle
 ctx.beginPath();
 ctx.arc(String(node.x) + '%', String(node.y) + '%', node.r, 0, Math.PI * 2);
 ctx.fillStyle = '#0a0a0a';
 ctx.fill();
 ctx.strokeStyle = node.color;
 ctx.lineWidth = 1.5;
 ctx.stroke();

 // Pulse animation
 const pulse = 1 + 0.05 * Math.sin(frame * 0.05);
 ctx.beginPath();
 ctx.arc(String(node.x) + '%', String(node.y) + '%', node.r * pulse, 0, Math.PI * 2);
 ctx.strokeStyle = node.color + '40';
 ctx.lineWidth = 1;
 ctx.stroke();

 // Label
 ctx.fillStyle = '#e0e0e0';
 ctx.font = '8px monospace';
 ctx.textAlign = 'center';
 ctx.fillText(node.label, String(node.x) + '%', (node.y + node.r + 10) + '%');
 });

 frame++;
 requestAnimationFrame(animate);
 };
 animate();

 return () => window.removeEventListener('resize', resize);
 }, [particles]);

 return (
 <div className="bg-[#0a0a0a] border border-[#1a1a2e] rounded-xl p-6 mb-8">
 <div className="flex justify-between items-center mb-4">
 <h2 className="text-lg font-semibold text-white">🏗️ Live Architecture Flow</h2>
 <div className="flex gap-4">
 {[
 { label: 'Total', value: stats.total, color: '#6c63ff' },
 { label: 'Queued', value: stats.queued, color: '#ffd93d' },
 { label: 'Delivered', value: stats.delivered, color: '#00ff88' },
 { label: 'Failed', value: stats.failed, color: '#ff6b6b' },
 ].map(s => (
 <div key={s.label} className="text-center">
 <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
 <div className="text-[10px] text-gray-500">{s.label}</div>
 </div>
 ))}
 </div>
 </div>
 
 <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
 {/* Flow Canvas */}
 <div className="lg:col-span-3 relative h-72 bg-[#050508] rounded-lg border border-[#1a1a2e] overflow-hidden">
 <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
 
 {/* Active chat indicators */}
 <div className="absolute top-2 left-3">
 {activeChats.slice(0, 4).map((chat, i) => (
 <div key={i} className="flex items-center gap-1 text-[9px] text-gray-500 mb-0.5">
 <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
 {chat.slice(0, 14)}...
 </div>
 ))}
 </div>
 </div>

 {/* Live Log */}
 <div className="lg:col-span-2 bg-[#050508] rounded-lg border border-[#1a1a2e] p-3 h-72 overflow-hidden">
 <h3 className="text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">Live Message Log</h3>
 <div className="space-y-1.5 overflow-y-auto h-[calc(100%-20px)]">
 {messages.length === 0 && (
 <p className="text-[10px] text-gray-600 italic">Awaiting messages...</p>
 )}
 {messages.slice(0, 12).map((msg, i) => (
 <div key={i} className="border-b border-[#111] pb-1 animate-fadeIn" style={{ animationDelay: `${i * 50}ms` }}>
 <div className="flex justify-between items-center">
 <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
 msg.event_type === 'queued' ? 'bg-yellow-500/20 text-yellow-400' :
 msg.event_type === 'claimed' ? 'bg-blue-500/20 text-blue-400' :
 msg.event_type === 'delivered' || msg.event_type === 'acked' ? 'bg-green-500/20 text-green-400' :
 'bg-gray-500/20 text-gray-400'
 }`}>
 {msg.event_type?.toUpperCase()}
 </span>
 <span className="text-[8px] text-gray-600">
 {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ''}
 </span>
 </div>
 <p className="text-[9px] text-gray-500 truncate mt-0.5">
 {msg.command_id?.slice(0, 35)}...
 </p>
 <p className="text-[8px] text-gray-600">
 → {msg.target_chat_id?.slice(0, 14)}...
 </p>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}
