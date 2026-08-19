const stats = [
 { label: 'Nodes modelados', value: '2 tipos', note: 'Light Node e Full Node' },
 { label: 'Relay cloud', value: 'Inbox/Outbox', note: 'Mensagens entre chats e dispositivos' },
 { label: 'Execucao local', value: 'Full Node', note: 'AI Bridge permanece local por seguranca' },
];

export default function DashboardPage() {
 return (
 <>
 <section className='hero'>
 <span className='badge'>Dashboard</span>
 <h1>Operacao distribuida, sem computador unico.</h1>
 <p>
 O NexosAI Cloud coordena usuarios, nodes, projetos, conversas, leases e instaladores.
 Cada computador pode entrar como Light Node apenas com extensao ou Full Node com AI Bridge local.
 </p>
 </section>

 <section className='grid'>
 {stats.map((item) => (
 <article className='card' key={item.label}>
 <div className='stat'>{item.value}</div>
 <h3>{item.label}</h3>
 <p className='muted'>{item.note}</p>
 </article>
 ))}
 </section>

 <section className='gridTwo' style={{ marginTop: 18 }}>
 <article className='card'>
 <h2>Cloud responsibilities</h2>
 <ul className='list'>
 <li>Google login e bootstrap admin.</li>
 <li>Registro de nodes e heartbeats.</li>
 <li>Role leases para evitar split brain.</li>
 <li>Inbox/outbox para mensagens entre chats.</li>
 <li>Downloads e tokens de instalacao.</li>
 </ul>
 </article>
 <article className='card'>
 <h2>Local responsibilities</h2>
 <ul className='list'>
 <li>Gateway local em 127.0.0.1:8765.</li>
 <li>Control Center: status, report e port-guard.</li>
 <li>Terminal, Git, arquivos e validacoes locais.</li>
 <li>Extensao para descoberta e relay de chats.</li>
 <li>Execucao segura sem comandos remotos arbitrarios.</li>
 </ul>
 </article>
 </section>
 </>
 );
}
