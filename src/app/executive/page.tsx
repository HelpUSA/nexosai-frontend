import { getServerSession } from 'next-auth/next';
import { redirect, forbidden } from 'next/navigation';
import { makeAuthOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import {
  authorizeExecutiveAccess,
  withExecutiveTenantContext,
} from '@/lib/executive/executive-gate.mjs';
import {
  APPROVED_D3_CADENCE_DEFAULTS,
  buildMeuDiaAndRadarSnapshot,
  type StalePortfolioRadarItem,
} from '@/lib/executive/cadence-scheduler.mjs';
import type { ExecutiveWorkItemRecord } from '@/lib/executive/priority-engine.mjs';

export const dynamic = 'force-dynamic';

export default async function ExecutiveMeuDiaPage({
  searchParams,
}: {
  searchParams:
    | Promise<{ organizationId?: string }>
    | { organizationId?: string };
}) {
  let session = null;
  try {
    session = await getServerSession(makeAuthOptions());
  } catch {
    session = null;
  }
  if (!session?.user?.email) redirect('/login');

  const params = await searchParams;
  const authz = await authorizeExecutiveAccess({
    email: session.user.email,
    organizationId: params?.organizationId,
    db,
  });
  if (!authz.ok) forbidden();

  const snapshot = await withExecutiveTenantContext(
    db,
    authz.organizationId!,
    async (tx) => {
      return buildMeuDiaAndRadarSnapshot(tx, {
        organizationId: authz.organizationId!,
      });
    }
  );

  return (
    <>
      <section className="hero">
        <span className="badge">NEXOSAI EXECUTIVE — F1A PILOT (READ-ONLY + MANUAL TRIAGE)</span>
        <h1>Meu Dia &amp; Radar Executivo ({authz.organization?.name})</h1>
        <p>
          Cadência oficial aprovada (D3): Fuso{' '}
          <strong>{APPROVED_D3_CADENCE_DEFAULTS.timezone}</strong> | Briefing{' '}
          <strong>{APPROVED_D3_CADENCE_DEFAULTS.morningBriefingTime}</strong> | Radar{' '}
          <strong>{APPROVED_D3_CADENCE_DEFAULTS.afternoonRadarTime}</strong> | Revisão Semanal{' '}
          <strong>Segunda {APPROVED_D3_CADENCE_DEFAULTS.weeklyReviewTime}</strong> | Silêncio{' '}
          <strong>
            {APPROVED_D3_CADENCE_DEFAULTS.quietHoursStart}–
            {APPROVED_D3_CADENCE_DEFAULTS.quietHoursEnd}
          </strong>
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <span className="badge">MÉTRICAS DO TENANT</span>
          <h2>Visão Geral do Portfólio</h2>
          <div className="kv">
            <div>
              <span>Projetos / Negócios</span>
              <strong>{snapshot.metrics.totalPortfolioItems}</strong>
            </div>
            <div>
              <span>Sem Movimento (Stale)</span>
              <strong>{snapshot.metrics.stalePortfolioCount}</strong>
            </div>
            <div>
              <span>WorkItems Abertos</span>
              <strong>{snapshot.metrics.openWorkItemsCount}</strong>
            </div>
            <div>
              <span>Alertas Críticos (P0)</span>
              <strong>{snapshot.metrics.criticalWorkItemsCount}</strong>
            </div>
          </div>
        </article>

        <article className="card">
          <span className="badge">GOVERNANÇA F1A</span>
          <h2>Controles Ativos de Isolamento</h2>
          <div className="kv">
            <div>
              <span>PostgreSQL RLS</span>
              <strong>ENABLE + FORCE RLS</strong>
            </div>
            <div>
              <span>Conectores F1A</span>
              <strong>MANUAL / GITHUB RO / VERCEL RO</strong>
            </div>
            <div>
              <span>Personal Vault / Gmail</span>
              <strong>BLOCKED (FAIL-CLOSED)</strong>
            </div>
            <div>
              <span>Jobs em Background</span>
              <strong>DISABLED BY DEFAULT</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="grid">
        <article className="card">
          <span className="badge">MEU DIA — TOP PRIORIDADES</span>
          <h2>Fila Priorizada Determinística</h2>
          {snapshot.topPriorities.length === 0 ? (
            <p className="muted">Nenhuma atividade prioritária pendente neste tenant.</p>
          ) : (
            <ul>
              {snapshot.topPriorities.map((item: ExecutiveWorkItemRecord) => (
                <li key={item.id}>
                  <strong>
                    [{item.priorityBand} • {item.priorityScore}] {item.title}
                  </strong>{' '}
                  — <span className="muted">{item.priorityReason}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card">
          <span className="badge">RADAR 13:00 — PROJETOS SEM MOVIMENTO</span>
          <h2>Portfólio Estagnado</h2>
          {snapshot.stalePortfolioRadar.length === 0 ? (
            <p className="muted">Todos os projetos ativos tiveram movimentação recente.</p>
          ) : (
            <ul>
              {snapshot.stalePortfolioRadar.map((p: StalePortfolioRadarItem) => (
                <li key={p.id}>
                  <strong>{p.name}</strong> ({p.slug}) —{' '}
                  <span className="muted">
                    {p.daysIdle} dias sem atividade (limite: {p.staleAfterDays}d)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </>
  );
}
