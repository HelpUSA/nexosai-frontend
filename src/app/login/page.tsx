export default function LoginPage() {
 return (
 <>
 <section className='hero'>
 <span className='badge'>Login</span>
 <h1>Entrar com Google</h1>
 <p>
 O login Google sera conectado ao NextAuth/Auth.js na proxima etapa. O primeiro usuario admin
 sera definido por NEXOSAI_BOOTSTRAP_ADMIN_EMAIL=helpus.ecommerce@gmail.com .
 </p>
 <div className='actions'>
 <a className='button' href='/dashboard'>Entrar no modo preview</a>
 <a className='buttonSecondary' href='/admin'>Ver configuracao admin</a>
 </div>
 </section>

 <section className='gridTwo'>
 <article className='card'>
 <h2>Auth MVP</h2>
 <ul className='list'>
 <li>Provider: Google.</li>
 <li>Bootstrap admin por variavel de ambiente.</li>
 <li>Sessoes protegendo dashboard, admin, downloads e nodes.</li>
 </ul>
 </article>
 <article className='card'>
 <h2>Proximos passos</h2>
 <ul className='list'>
 <li>Conectar NextAuth/Auth.js.</li>
 <li>Criar Prisma Adapter apos estabilizar schema e Railway Postgres.</li>
 <li>Aplicar roles ADMIN, OWNER, OPERATOR e VIEWER.</li>
 </ul>
 </article>
 </section>
 </>
 );
}
