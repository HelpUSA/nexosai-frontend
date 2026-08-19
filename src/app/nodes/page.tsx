const nodes = [
 {
 name: 'Notebook principal',
 type: 'Full Node',
 status: 'online-ready',
 detail: 'Extensao + AI Bridge local + Control Center + gateway 8765',
 },
 {
 name: 'Browser relay futuro',
 type: 'Light Node',
 status: 'planned',
 detail: 'Extensao apenas para relay entre chats e presenca',
 },
 {
 name: 'PC backup',
 type: 'Full Node',
 status: 'standby',
 detail: 'Instalacao recuperavel para continuidade operacional',
 },
];

export default function NodesPage() {
 return (
 <>
 <section className='hero'>
 <span className='badge'>Nodes</span>
 <h1>Varios computadores, uma malha.</h1>
 <p>
 Cada node pode operar como relay leve via extensao ou como executor completo com AI Bridge local.
 A nuvem registra status, heartbeat, capacidade e ultimo contato.
 </p>
 </section>

 <section className='grid'>
 {nodes.map((node) => (
 <article className='card' key={node.name}>
 <span className='badge'>{node.type}</span>
 <h2>{node.name}</h2>
 <div className='kv'>
 <div><span>Status</span><strong>{node.status}</strong></div>
 <div><span>Capability</span><strong>{node.type}</strong></div>
 </div>
 <p className='muted'>{node.detail}</p>
 </article>
 ))}
 </section>

 <section className='card' style={{ marginTop: 18 }}>
 <h2>Node contract MVP</h2>
 <ul className='list'>
 <li>Light Node: descobre chats, envia heartbeat e entrega mensagens via inbox/outbox.</li>
 <li>Full Node: faz tudo do Light Node e tambem executa operacoes locais seguras.</li>
 <li>Nenhum computador antigo e tratado como servidor unico permanente.</li>
 <li>Nodes offline podem voltar sem bloquear a operacao de outros nodes.</li>
 </ul>
 </section>
 </>
 );
}
