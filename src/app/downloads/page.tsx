export default function DownloadsPage() {
 return (
 <>
 <section className='hero'>
 <span className='badge'>Downloads</span>
 <h1>Instale a NexosAI em qualquer computador.</h1>
 <p>
 Esta tela sera o ponto de distribuicao do pacote local. O usuario autenticado podera gerar token,
 baixar o instalador e escolher a pasta destino durante a instalacao local.
 </p>
 <div className='actions'>
 <a className='button' href='/downloads'>Gerar token de instalacao</a>
 <a className='buttonSecondary' href='/nodes'>Ver nodes</a>
 </div>
 </section>

 <section className='gridTwo'>
 <article className='card'>
 <h2>Comando planejado</h2>
 <code className='code'>powershell.exe -NoProfile -ExecutionPolicy Bypass -File install-nexosai.ps1</code>
 <p className='muted'>O instalador local perguntara a pasta destino, por exemplo D:\dev\autocode\ai-bridge ou C:\NexosAI\AI-Bridge.</p>
 </article>
 <article className='card'>
 <h2>O que a nuvem guarda</h2>
 <ul className='list'>
 <li>Token de instalacao e usuario que gerou.</li>
 <li>Versao do pacote e changelog.</li>
 <li>Registro do node apos primeira inicializacao.</li>
 <li>Resumo de health e ultimo heartbeat.</li>
 </ul>
 </article>
 </section>

 <section className='card' style={{ marginTop: 18 }}>
 <h2>Seguranca do instalador</h2>
 <ul className='list'>
 <li>Tokens devem expirar e poder ser revogados pelo admin.</li>
 <li>Credenciais locais nao devem ser enviadas para a nuvem.</li>
 <li>A instalacao Full Node registra capacidades, mas execucao permanece local.</li>
 </ul>
 </section>
 </>
 );
}
