export default function HomePage() {
 return (
 <section className='hero'>
 <span className='badge'>Cloud Mesh MVP</span>
 <h1>NexosAI Cloud Command Center</h1>
 <p>
 Central de identidade, distribuicao, observabilidade e roteamento para varios nodes NexosAI.
 A nuvem coordena. A extensao conecta chats. O AI Bridge local executa somente quando necessario.
 </p>
 <div className='actions'>
 <a className='button' href='/dashboard'>Open dashboard</a>
 <a className='buttonSecondary' href='/downloads'>Install a node</a>
 </div>
 </section>
 );
}
