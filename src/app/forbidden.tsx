export default function Forbidden() {
  return (
    <section className='hero' style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <span className='badge' style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca', width: 'fit-content' }}>
        403 Access Denied
      </span>
      <h1 style={{ marginTop: 16 }}>403 - Forbidden</h1>
      <p style={{ maxWidth: 600 }}>
        You do not have administrative authorization or an ACTIVE privileged membership in this organization.
      </p>
    </section>
  );
}
