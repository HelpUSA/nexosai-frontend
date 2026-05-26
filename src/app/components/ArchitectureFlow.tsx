'use client';

import { useEffect, useState } from 'react';

export default function ArchitectureFlow() {
 const [messages, setMessages] = useState<any[]>([]);
 const [activeChats, setActiveChats] = useState<string[]>([]);
 const [flowItems, setFlowItems] = useState<any[]>([]);

 // Fetch real data from Railway
 useEffect(() => {
 const fetchData = async () => {
 try {
 const res = await fetch('https://watcher-api-production-56ad.up.railway.app/db-query', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 sql: "SELECT id, command_id, event_type, source_chat_id, target_chat_id, adapter, created_at FROM ops.message_log ORDER BY id DESC LIMIT 20"
 })
 });
 const data = await res.json();
 if (data.db_query?.rows) {
 setMessages(data.db_query.rows);
 const chats = [...new Set(data.db_query.rows.flatMap((m: any) => [m.source_chat_id, m.target_chat_id]).filter(Boolean))];
 setActiveChats(chats.slice(0, 6));
 }
 } catch (e) {}
 };
 fetchData();
 const interval = setInterval(fetchData, 5000);
 return () => clearInterval(interval);
 }, []);

 // Generate animated flow items
 useEffect(() => {
 if (activeChats.length === 0) return;
 const items: any[] = [];
 activeChats.forEach((chatId, i) => {
 const shortId = chatId.slice(0, 8);
 items.push({
 id: `flow-${i}`,
 chatId: shortId,
 progress: 0,
 delay: i * 1500,
 });
 });
 setFlowItems(items);

 const interval = setInterval(() => {
 setFlowItems(prev => prev.map(item => ({
 ...item,
 progress: (item.progress + 0.5) % 100,
 })));
 }, 50);
 return () => clearInterval(interval);
 }, [activeChats]);

 const nodes = [
 { id: 'chats', label: 'Chats', x: 40, y: 20, color: '#6c63ff' },
 { id: 'extension', label: 'Extensão', x: 40, y: 45, color: '#00ff88' },
 { id: 'broker', label: 'Railway Broker', x: 40, y: 70, color: '#ff6b6b' },
 { id: 'gateway', label: 'Gateway Local', x: 75, y: 20, color: '#ffd93d' },
 { id: 'chatb', label: 'Chat B', x: 75, y: 70, color: '#6c63ff' },
 ];

 return (
 <div className="bg-[#0a0a0a] border border-[#1a1a2e] rounded-xl p-6 mb-8">
 <h2 className="text-lg font-semibold text-white mb-4">🏗️ Live Architecture Flow</h2>
 
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Flow Diagram */}
 <div className="lg:col-span-2 relative h-80 bg-[#050508] rounded-lg border border-[#1a1a2e] overflow-hidden">
 {/* SVG Background */}
 <svg className="absolute inset-0 w-full h-full">
 <defs>
 <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
 <polygon points="0 0, 6 2, 0 4" fill="#6c63ff" />
 </marker>
 <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
 <stop offset="0%" stopColor="#6c63ff" stopOpacity="0" />
 <stop offset="50%" stopColor="#6c63ff" stopOpacity="1" />
 <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
 </linearGradient>
 </defs>

 {/* Connection lines */}
 <line x1="25%" y1="35%" x2="52%" y2="15%" stroke="#1a1a2e" strokeWidth="1" />
 <line x1="25%" y1="50%" x2="52%" y2="35%" stroke="#1a1a2e" strokeWidth="1" />
 <line x1="52%" y1="35%" x2="52%" y2="65%" stroke="#1a1a2e" strokeWidth="2" />
 <line x1="52%" y1="65%" x2="75%" y2="25%" stroke="#1a1a2e" strokeWidth="1" />
 <line x1="52%" y1="65%" x2="75%" y2="75%" stroke="#1a1a2e" strokeWidth="1" />

 {/* Node circles */}
 <circle cx="25%" cy="20%" r="18" fill="#6c63ff20" stroke="#6c63ff" strokeWidth="1" />
 <text x="25%" y="24%" textAnchor="middle" fill="#6c63ff" fontSize="8">Chats</text>

 <circle cx="25%" cy="45%" r="18" fill="#00ff8820" stroke="#00ff88" strokeWidth="1" />
 <text x="25%" y="49%" textAnchor="middle" fill="#00ff88" fontSize="7">Extensão</text>

 <circle cx="52%" cy="50%" r="22" fill="#ff6b6b20" stroke="#ff6b6b" strokeWidth="2" />
 <text x="52%" y="53%" textAnchor="middle" fill="#ff6b6b" fontSize="8">Broker</text>

 <circle cx="75%" cy="20%" r="18" fill="#ffd93d20" stroke="#ffd93d" strokeWidth="1" />
 <text x="75%" y="24%" textAnchor="middle" fill="#ffd93d" fontSize="7">Gateway</text>

 <circle cx="75%" cy="75%" r="18" fill="#6c63ff20" stroke="#6c63ff" strokeWidth="1" />
 <text x="75%" y="79%" textAnchor="middle" fill="#6c63ff" fontSize="7">Chat B</text>

 {/* Animated flow particles */}
 {flowItems.map((item, i) => {
 const x = 25 + (item.progress / 100) * 50;
 const y = 45 - (item.progress / 100) * 25;
 return (
 <circle key={item.id} cx={`${x}%`} cy={`${y}%`} r="3" fill="#6c63ff" opacity={0.8}>
 <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite" />
 </circle>
 );
 })}
 </svg>

 {/* Chat labels */}
 <div className="absolute top-2 left-4">
 {activeChats.slice(0, 3).map((chat, i) => (
 <div key={i} className="text-[8px] text-gray-500 mb-0.5">
 💬 {chat.slice(0, 12)}...
 </div>
 ))}
 </div>
 </div>

 {/* Live Log Panel */}
 <div className="bg-[#050508] rounded-lg border border-[#1a1a2e] p-4 h-80 overflow-y-auto">
 <h3 className="text-sm font-semibold text-gray-400 mb-3">📋 Live Message Log</h3>
 <div className="space-y-2">
 {messages.length === 0 && (
 <p className="text-xs text-gray-600">Waiting for messages...</p>
 )}
 {messages.slice(0, 10).map((msg, i) => (
 <div key={i} className="border-b border-[#1a1a2e] pb-1.5">
 <div className="flex justify-between items-center">
 <span className={`text-[10px] font-semibold ${
 msg.event_type === 'queued' ? 'text-yellow-400' :
 msg.event_type === 'claimed' ? 'text-blue-400' :
 msg.event_type === 'delivered' ? 'text-green-400' :
 'text-gray-400'
 }`}>
 {msg.event_type?.toUpperCase()}
 </span>
 <span className="text-[9px] text-gray-600">
 {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ''}
 </span>
 </div>
 <p className="text-[10px] text-gray-500 truncate">
 {msg.command_id?.slice(0, 40)}...
 </p>
 <p className="text-[9px] text-gray-600">
 {msg.source_chat_id?.slice(0, 12)} → {msg.target_chat_id?.slice(0, 12)}
 </p>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}
