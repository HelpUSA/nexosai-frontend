const adminItems = [
 { label: 'Bootstrap admin', value: 'helpus.ecommerce@gmail.com ' },
 { label: 'Auth provider', value: 'Google login' },
 { label: 'Database target', value: 'Railway PostgreSQL' },
 { label: 'Deploy target', value: 'Vercel' },
];

export default function AdminPage() {
 return (
 <>
 <section className='hero'>
 <span className='badge'>Admin</span>
 <h1>Controle global sem amarrar a operacao a um unico servidor.</h1>
 <p>
 O admin gerencia usuarios, organizacoes, tokens, nodes, roles e auditoria. O bootstrap admin deve ser
 definido por variavel de ambiente para evitar hardcode permanente.
 </p>
 </section>

 <section className='gridTwo'>
 <article className='card'>
 <h2>Configuracao inicial</h2>
 <div className='kv'>
 {adminItems.map((item) => (
 <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>
 ))}
 </div>
 </article>
 <article className='card'>
 <h2>Permissoes planejadas</h2>
 <ul className='list'>
 <li>ADMIN: acesso global, usuarios, tokens e auditoria.</li>
 <li>OWNER: gestao de projetos e nodes autorizados.</li>
 <li>OPERATOR: operacao assistida e leitura operacional.</li>
 <li>VIEWER: leitura de paineis e reports.</li>
 </ul>
 </article>
 </section>

 <section className='card' style={{ marginTop: 18 }}>
 <h2>Safety defaults</h2>
 <ul className='list'>
 <li>Sem execucao remota arbitraria no MVP.</li>
 <li>Tokens de instalacao revogaveis e com expiracao.</li>
 <li>Auditoria para login, token, node, role lease e mensagem roteada.</li>
 </ul>
 </section>
 </>
 );
}
