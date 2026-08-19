const conversations = [
 { title: 'manager ai_bridge', role: 'manager', node: 'Notebook principal', status: 'lease-active' },
 { title: 'watcher5', role: 'ops', node: 'Notebook principal', status: 'observed' },
 { title: 'watcher6', role: 'executor', node: 'Notebook principal', status: 'active' },
 { title: 'future relay chat', role: 'standby', node: 'Browser relay futuro', status: 'planned' },
];

export default function ConversationsPage() {
 return (
 <>
 <section className='hero'>
 <span className='badge'>Conversations</span>
 <h1>Chats roteados por papel, nao por computador.</h1>
 <p>
 A extensao pode transformar cada chat em um endpoint de relay. A nuvem decide para qual chat ativo
 enviar mensagens com base em projeto, role lease, node e disponibilidade.
 </p>
 </section>

 <section className='grid'>
 {conversations.map((chat) => (
 <article className='card' key={chat.title}>
 <span className='badge'>{chat.role}</span>
 <h2>{chat.title}</h2>
 <div className='kv'>
 <div><span>Node</span><strong>{chat.node}</strong></div>
 <div><span>Status</span><strong>{chat.status}</strong></div>
 </div>
 </article>
 ))}
 </section>

 <section className='card' style={{ marginTop: 18 }}>
 <h2>Relay flow</h2>
 <code className='code'>Chat A -&gt; Extension A -&gt; NexosAI Cloud inbox/outbox -&gt; Extension B -&gt; Chat B</code>
 <p className='muted'>Esse fluxo permite comunicacao entre chats em dispositivos diferentes sem expor portas locais publicamente.</p>
 </section>
 </>
 );
}
