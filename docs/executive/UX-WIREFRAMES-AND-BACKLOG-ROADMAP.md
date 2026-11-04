# Wireframes UX, Roadmap F0–F2 e Backlog Priorizado (NexosAI Executive)

- **Status**: PROPOSTA DE PRODUTO & ENGENHARIA (Fase F0 — Design & Co-Design Documental)
- **Ordem de Referência**: `HU-HUB-ORDER059-NEXOSAI-EXECUTIVE-CODESIGN-20261104`

---

## 1. Wireframe Estrutural: Cockpit Executivo (`/executive`)

```text
+--------------------------------------------------------------------------------------------------+
| ⚡ NEXOSAI EXECUTIVE — GERENTE GERAL PROATIVO          [🔔 Digest: Ativo (3/8)] [⏸️ Pausar 2h]  |
| Tenant: HelpUS LLC (America/Fortaleza)                 [🔒 Vault Pessoal: ON]   [+ Captura Rápida]|
+--------------------------------------------------------------------------------------------------+
| 🎙️ CAPTURA RÁPIDA (Atrito Zero):                                                                |
| [ "Lembrar de evoluir módulo de jogos no app Books sexta e cobrar cliente X..." ] [Classificar]  |
| -> Regra Invariante: Gera rascunho exigindo Dono + Prazo (dueAt) ou Condição (triggerCondition)  |
+--------------------------------------------------------------------------------------------------+
| ABAS DE NAVEGAÇÃO:                                                                               |
| [ 🎯 Meu Dia (4) ] [ ⚖️ Aguardando Decisão (2) ] [ 🤖 Agentes em Execução (1) ]                  |
| [ 🤝 Clientes s/ Retorno (2) ] [ 🛠️ Projetos s/ Evolução (3) ] [ 💡 Ideias (5) ] [ 🏠 Pessoal ] |
+--------------------------------------------------------------------------------------------------+

=== SEÇÃO 1: 🎯 MEU DIA (TOP 3–5 PRIORIDADES EXPLICÁVEIS — BRIEFING 08:00) =======================

+--------------------------------------------------------------------------------------------------+
| [SCORE: 94/100] [🛠️ EXISTING_APP: nexosai] [Estado: WAITING_HUMAN]                              |
| Título: Homologar DNS Cloudflare (staging.nexoai) e concluir Login Google E2E                    |
| 📌 Por que agora?: Desbloqueia 100% da homologação de Staging (B3/B4); aguarda ação no painel.   |
| 🔗 Evidência: Issue #22 (Ordem 058) • Última evolução: há 6 horas • Dono: Master SuperAdmin      |
| 👉 Próxima Ação: Cadastrar CNAME staging.nexoai -> 4780e4c6526343dd.vercel-dns-017.com           |
|                                                                                                  |
| [ ✅ Confirmar & Disparar Validação ]   [ ✏️ Ajustar Plano ]   [ ⏰ Adiar c/ Data (Snooze) ]     |
+--------------------------------------------------------------------------------------------------+
| [SCORE: 88/100] [🤝 CLIENT_FOLLOWUP] [Estado: WAITING_HUMAN] [⚠️ APPROVAL_REQUIRED]             |
| Título: Responder Cotação Atacado / Follow-up comercial pendente > 26h                           |
| 📌 Por que agora?: SLA de resposta comercial (24h) ultrapassado; alto impacto em receita.        |
| 🔗 Evidência: Thread Gmail #19a4f (Resumo sanitizado) • Dono: Master SuperAdmin                  |
| 👉 Próxima Ação: Revisar rascunho preparado pelo Gerente Geral e autorizar envio.                |
| 📄 Preview do Payload (SHA-256: 8f3a...91b2): "Olá, segue proposta atualizada conforme..."       |
|                                                                                                  |
| [ ✅ Aprovar Payload & Enviar ]         [ ✏️ Editar Rascunho ] [ ⏰ Adiar c/ Data (Snooze) ]     |
+--------------------------------------------------------------------------------------------------+
| [SCORE: 79/100] [🛠️ EXISTING_APP: fit] [Estado: READY] [⚠️ APPROVAL_REQUIRED]                   |
| Título: Evolução Semanal: HelpUSA/fit está há 6 dias sem novos commits de evolução               |
| 📌 Por que agora?: Custo de esquecimento (75/100); 2 melhorias do backlog prontas para execução. |
| 🔗 Evidência: GitHub HelpUSA/fit (HEAD main) • Dono: Master SuperAdmin                           |
| 👉 Próxima Ação: Despachar Ordem Técnica sugerida para Antigravity + ChatGPT via AI-Bridge V2.   |
|                                                                                                  |
| [ 🚀 Aprovar Ordem & Despachar Agentes ] [ ✏️ Ajustar Escopo ] [ ⏰ Adiar p/ Próxima Segunda ]   |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Demais Visões Especializadas do Cockpit

### 2.1. Aba `🤖 Agentes em Execução` (`ExecutionOrder` Tracking)
Exibe em tempo real o ciclo de vida separado entre `ACK` e `DONE`:
- **`[RUNNING]`** `HU-HUB-ORDER059` — Agente: `Antigravity` — Lease expira em: `14 min` — Estado: *Gerando artefatos ADR-001 e PR Draft*.
- **`[VERIFICATION]`** `HU-FIT-ORD049` — Agente: `Antigravity` — Evidência anexada (`SHA-256: a1b2...`) — Aguardando verificação automática/humana para transicionar a `DONE`.

### 2.2. Aba `🛠️ Projetos Sem Evolução` & `🤝 Clientes Sem Retorno` (Radar Anti-Esquecimento)
- Lista ordenada por **Dias sem Progresso (`now - lastProgressAt`)**:
  - Mostra cada aplicação do portfólio (`nexosai`, `autista`, `fit`, `books`, `rodrigocosta`, `helpus-fba`), data do último commit/deploy, PRs abertos e botão de 1 clique **"Gerar Ordem de Evolução"**.
  - Mostra clientes ou leads aguardando retorno com contador regressivo de SLA.

### 2.3. Aba `💡 Ideias a Revisitar` & `🏠 Vida Pessoal (Private Vault)`
- **Incubadora de Ideias**: Toda ideia capturada já nasce com uma ficha estruturada (Problema, Público, Sinergia com Apps atuais e Próximo Passo de Validação).
- **Vida Pessoal (`PERSONAL_VAULT`)**: Renderizada com badge de cadeado criptográfico; visível **exclusivamente** para o `ownerId` autenticado.

---

## 3. Backlog Priorizado de Engenharia (10 User Stories com Critérios de Aceite e CI)

| ID | Fase | User Story | Critérios de Aceite (DoD) | Verificação Automática (CI Gate) |
| :--- | :---: | :--- | :--- | :--- |
| **US-01** | **F1A** | **Feature Flag & Isolamento de Tenant (`ExecutiveWorkspace`)** | Rota `/executive` e APIs `/api/orgs/[orgId]/executive/*` retornam `404/403` se `featureFlagEnabled == false` ou se o usuário não pertencer à organização (`N1-B`). | Teste de integração `n1b-executive-tenant-guard.test.mjs` validando `401/403/404` cross-tenant. |
| **US-02** | **F1A** | **Isolamento Estrito do Cofre Pessoal (`PERSONAL_VAULT`)** | Registros `Signal` e `WorkItem` com `sensitivity = PERSONAL_VAULT` nunca são retornados para outros `ADMIN`/`OWNER` do mesmo tenant se `ownerId !== session.user.id`. | Teste unitário e de integração provando que um segundo `ADMIN` na mesma org recebe `0` itens `PERSONAL_VAULT` de outro usuário. |
| **US-03** | **F1A** | **Captura Rápida Determinística (`WorkItem` Invariants)** | Endpoint de captura rápida rejeita criação de `WorkItem` em estado `PLANNED/READY` sem `ownerId`, `nextAction` e (`dueAt` OU `triggerCondition`). | Suite de contrato validando rejeição `HTTP 400` para itens órfãos sem dono ou próxima ação. |
| **US-04** | **F1A** | **Motor de Score Explicável (`0–100`) & Testes Determinísticos** | Função pura `computeExecutivePriorityScore(item, context)` calcula score `0–100` (30% I, 25% U, 20% F, 15% B, 10% C - penalidades) e retorna `scoreBreakdown` auditável. | Teste unitário `executive-priority-score.test.mjs` cobrindo pesos, penalidades de incerteza e overrides de incidente. |
| **US-05** | **F1A** | **Conector Read-Only GitHub/Vercel & Deduplicação de `Signal`** | Ingestão gera `fingerprint` SHA-256 único por `(organizationId, fingerprint)`. Reenvio do mesmo webhook/evento é idempotente e não duplica `WorkItem`. | Teste de idempotência submetendo 5x o mesmo evento e comprovando `COUNT(Signal) == 1` e `COUNT(WorkItem) == 1`. |
| **US-06** | **F1A** | **Painel "Meu Dia", "Projetos s/ Evolução" e Rituais Anti-Fadiga** | Renderiza Top 3–5 prioridades às 08:00 e Radar de Desbloqueio às 13:00 (`America/Fortaleza`), respeitando `quietHours`, `cooldownHours` e `snoozedUntil`. | Teste do motor de cadência comprovando supressão durante `quietHours` e respeito ao `cooldown`. |
| **US-07** | **F1B** | **Fluxo `DecisionRequest` com Confirmação de Hash (`APPROVAL_REQUIRED`)** | Ações críticas exigem aprovação humana vinculada a `actionPayloadHash` e falham fechado (`409/422`) se o payload mudar ou se `expiresAt < now`. | Teste de segurança tentando aprovar `DecisionRequest` expirada ou com `actionPayloadHash` divergente (deve negar 100%). |
| **US-08** | **F1B** | **Despacho Durável `ExecutionOrder` & Máquina de Estados (`ACK != DONE`)** | Transição de `ExecutionOrder` para `ACKED` mantém `WorkItem` em `IN_PROGRESS`. Somente submissão de `Evidence` (`VERIFIED`) permite transição para `DONE`. | Teste de máquina de estados provando bloqueio de `IN_PROGRESS -> DONE` sem registro `Evidence` verificado. |
| **US-09** | **F1B** | **Conector Gmail/Calendar Opt-In com Sanitização Anti-Prompt-Injection** | E-mails opt-in passam por sanitizador estrito (`summaryRedacted`), renovação automática de watch `< 7 dias` e sandbox LLM sem tool-calling de escrita. | Teste de injeção adversária simulando e-mail com comando malicioso e provando zero geração de `ExecutionOrder` não aprovada. |
| **US-10** | **F1C/F2** | **Métricas de Dogfooding (30 Dias) & Onboarding Multi-Tenant SaaS** | Painel de telemetria mede taxa de falsos positivos, tempo médio de desbloqueio e aderência (>95% cards com evidência/dono/próxima ação) antes de liberar F2. | Validação de contrato de telemetria e auditoria append-only (`ActivityEvent`). |

---

## 4. Pontos que Exigem Decisão Executiva do Master SuperAdmin (Para Início da Fase F1A)

1. **Aprovação da Arquitetura F0 (ADR-001)**:
   - Concordância com a separação **Control Plane (PostgreSQL/Prisma)** + **Execution Plane (Connectors + AI-Bridge Local V2)** e uso de **Outbox Transacional no Postgres** para as Fases F1A–F1C (deixando Temporal.io apenas se a escala SaaS F2 exigir).
2. **Escopo Inicial do Piloto F1A (Read-Only + Captura Rápida)**:
   - Autorizar início da implementação da **Fase F1A** em branch isolada (com `featureFlagEnabled = false` por padrão), monitorando inicialmente o portfólio GitHub/Vercel (`nexosai`, `autista`, `fit`, `books`, `rodrigocosta`, `helpus-fba`) e a Captura Rápida de Ideias/Clientes/Pessoal, sem coletar e-mails privados até o opt-in explícito da Fase F1B.
3. **Horários dos 3 Rituais no Fuso `America/Fortaleza`**:
   - Confirmar se os horários padrão propostos (**08:00** Briefing Matinal, **13:00** Radar de Desbloqueio e **Segunda-feira 08:30** Varredura Anti-Esquecimento, com silêncio entre **22:00 e 07:00**) estão ideais para a sua rotina.
