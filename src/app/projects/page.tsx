const projects = [
 { key: 'ai_bridge', name: 'AI Bridge', status: 'active', roles: 'manager, watcher5, watcher6' },
 { key: 'energisa', name: 'Energisa', status: 'active', roles: 'manager, executor' },
 { key: 'cvss', name: 'CVSS', status: 'active', roles: 'manager, reviewer' },
];

export default function ProjectsPage() {
 return (
 <>
 <section className='hero'>
 <span className='badge'>Projects</span>
 <h1>Projetos coordenados pela nuvem.</h1>
 <p>
 Cada projeto tera roles, leases, chats ativos, nodes autorizados, tarefas e historico operacional.
 O papel ativo nao fica preso a um chat ou computador permanente.
 </p>
 </section>

 <section className='grid'>
 {projects.map((project) => (
 <article className='card' key={project.key}>
 <span className='badge'>{project.key}</span>
 <h2>{project.name}</h2>
 <div className='kv'>
 <div><span>Status</span><strong>{project.status}</strong></div>
 <div><span>Roles</span><strong>{project.roles}</strong></div>
 </div>
 </article>
 ))}
 </section>

 <section className='card' style={{ marginTop: 18 }}>
 <h2>Project contract MVP</h2>
 <ul className='list'>
 <li>Projetos agrupam conversas, nodes, tarefas, artefatos e auditoria.</li>
 <li>Role leases definem quem pode agir como manager, watcher ou executor ativo.</li>
 <li>Chats substitutos podem assumir apos handoff, expiracao de lease ou decisao admin.</li>
 </ul>
 </section>
 </>
 );
}
