# Wireframes UX, Roadmap F0–F2 e Backlog Priorizado (NexosAI Executive — Revisão v1.1 Ordem 060)

- **Status**: PROPOSTA DE PRODUTO & ENGENHARIA REVISADA (Fase F0 — Design & Co-Design Documental; **Aguardando Decisão D1 antes de qualquer código/migration de F1A**)
- **Ordens de Referência**: `HU-HUB-ORDER059-NEXOSAI-EXECUTIVE-CODESIGN-20261104`, `HU-HUB-ORDER060-EXECUTIVE-ADR-HARDENING-20261104`

---

## 1. Wireframe Estrutural: Cockpit Executivo (`/executive`)

```text
+--------------------------------------------------------------------------------------------------+
| ⚡ NEXOSAI EXECUTIVE — GERENTE GERAL PROATIVO          [🔔 Digest: 3/8 hoje] [⏸️ Pausar até 16h] |
| Tenant: HelpUS LLC (TZ Proposto: America/Fortaleza)    [🔒 Vault Pessoal: ADIADO F1B] [+ Captura] |
+--------------------------------------------------------------------------------------------------+
| 🎙️ CAPTURA RÁPIDA (Atrito Zero — Somente Negócios/Apps no MVP F1A):                             |
| [ "Evoluir módulo de jogos no app Books sexta e cobrar cliente X..." ]          [Classificar]    |
| -> Regra Invariante: Exige Dono (ownerId) + Próxima Ação + Prazo (dueAt) ou Condição (trigger)   |
+--------------------------------------------------------------------------------------------------+
| ABAS DE NAVEGAÇÃO:                                                                               |
| [ 🎯 Meu Dia (3) ] [ ⚖️ Aguardando Decisão (2) ] [ 🤖 Agentes & Outbox (1) ]                    |
| [ 🤝 Clientes s/ Retorno (2) ] [ 🛠️ Projetos s/ Evolução (3) ] [ 💡 Ideias (5) ] [ 🔒 Pessoal* ]|
+--------------------------------------------------------------------------------------------------+

=== SEÇÃO 1: 🎯 MEU DIA (TOP 3–5 PRIORIDADES EXPLICÁVEIS — DEFAULT PROPOSTO 08:00) ================

+--------------------------------------------------------------------------------------------------+
| [SCORE: 94/100] [🛠️ EXISTING_APP: nexosai] [Estado: WAITING_EXTERNAL / WAITING_HUMAN]           |
| Título: Homologar DNS Cloudflare (staging.nexoai) e concluir Login Google E2E                    |
| 📌 Por que agora?: Impacto=100, Urgência=95, Desbloqueio=100 (Desbloqueia B3/B4 de Staging).     |
| 🔗 Evidência: Issue #22 (Ordem 058) • Sem avanço há: 6h • Dono: Master SuperAdmin                |
| 👉 Próxima Ação: Cadastrar CNAME staging.nexoai -> 4780e4c6526343dd.vercel-dns-017.com           |
|                                                                                                  |
| [ ✅ Já Cadastrei (Disparar Verificação) ]   [ ✏️ Ajustar ]   [ ⏰ Adiar c/ Data (Snooze) ]       |
+--------------------------------------------------------------------------------------------------+
| [SCORE: 88/100] [🤝 CLIENT_FOLLOWUP] [Estado: WAITING_HUMAN] [⚠️ APPROVAL_REQUIRED — Rev #2]    |
| Título: Responder Cotação Atacado / Follow-up comercial pendente > 26h                           |
| 📌 Por que agora?: SLA comercial (24h) ultrapassado (Urgência=90, Custo Esquecimento=85).        |
| 🔗 Evidência: Thread #19a4f [UNTRUSTED_DATA] • Dono: Master SuperAdmin • Expira em: 45 min       |
| 🔍 Diff da Revisão #2 (Editado pelo Executivo):                                                  |
|    - prazoEntrega: "7 dias úteis"  -->  + prazoEntrega: "5 dias úteis"                           |
| 🔐 Hash Canônico Atualizado (RFC 8785 SHA-256): `e4d909c2...7b81` (Consume-Once + CSRF Guard)    |
|                                                                                                  |
| [ ✅ Confirmar Hash Rev #2 & Enfileirar Outbox ] [ ✏️ Nova Edição (Gera Rev #3) ] [ ⏰ Adiar ]    |
+--------------------------------------------------------------------------------------------------+
| [SCORE: 79/100] [🛠️ EXISTING_APP: fit] [Estado: READY] [⚠️ APPROVAL_REQUIRED — Rev #1]          |
| Título: Evolução Semanal: HelpUSA/fit está há 6 dias sem novos commits de evolução               |
| 📌 Por que agora?: Custo de esquecimento=75/100; 2 melhorias do backlog prontas para execução.   |
| 🔗 Evidência: GitHub HelpUSA/fit (HEAD main) • Dono: Master SuperAdmin                           |
| 🔐 Hash Canônico da Ordem (SHA-256): `3a7f12b0...9c04`                                           |
|                                                                                                  |
| [ 🚀 Aprovar Hash Rev #1 & Despachar Bridge V2 ] [ ✏️ Editar Escopo (Gera Rev #2) ] [ ⏰ Adiar ] |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Detalhamento das Visões de Governança e Segurança na UI

1. **Fluxo Visual de Edição em 2 Etapas (`ADJUSTED_AND_APPROVED`)**:
   - Quando o executivo clica em **`[ ✏️ Editar Escopo ]`**, o formulário abre o JSON/texto da ação.
   - Ao clicar em **`Salvar Alteração (Etapa 1)`**, o sistema **não executa** a ação: ele cria a `Revisão #2`, exibe o bloco **`🔍 Diff da Revisão #2`** comparando o antes/depois e apresenta o novo **`🔐 Hash Canônico Atualizado`**.
   - Somente quando o executivo clica em **`[ ✅ Confirmar Hash Rev #2 & Enfileirar Outbox ]` (Etapa 2)** a ordem é gravada atomicamente com seu `OutboxEvent`.
2. **Aba `🔒 Pessoal*` (Desativada no MVP F1A)**:
   - Exibe aviso transparente: *"O Cofre Pessoal (`PERSONAL_VAULT`) está desativado no MVP F1A por diretriz de segurança até a implementação e auditoria da criptografia de envelope (AEAD AES-256-GCM por usuário). Nenhum dado particular é coletado nesta fase."*

---

## 3. Backlog Priorizado e Revisado (10 User Stories com Testes Adversariais e CI)

> [!IMPORTANT]
> Todos os testes unitários e de integração abaixo são projetados para rodar localmente e no GitHub Actions CI contra banco PostgreSQL efêmero de teste, **sem depender da resolução do DNS público `staging.nexoai.helpusbr.com` (Ordem 058)**. Nenhuma story de código será iniciada antes da **Decisão Executiva D1**.

| ID | Fase | User Story | Critérios de Aceite (DoD) | Verificação Automática (CI Gate) |
| :--- | :---: | :--- | :--- | :--- |
| **US-01** | **F1A** | **Gate Quádruplo de Feature Flag (UI, API, Cron, Worker)** | Quando `NEXOSAI_EXECUTIVE_ENABLED != 'true'` ou `ExecutiveWorkspace.featureFlagEnabled == false`, bloqueia com fail-closed: (1) páginas `/executive`, (2) APIs `/api/orgs/[orgId]/executive/*`, (3) rotas `/api/cron/executive/*` e (4) consumo pelo worker de fila. | Suite `executive-feature-flag-gate.test.mjs` testando negação nas 4 superfícies simultaneamente. |
| **US-02** | **F1A** | **Integridade Relacional Multi-Tenant (Composite FKs + FORCE RLS desde F1A)** | Schema aplica `@@unique([id, organizationId])`, FKs compostas em todas as tabelas e políticas PostgreSQL `ENABLE` + `FORCE ROW LEVEL SECURITY` já na Fase F1A. Tentativas de criar, ler ou atualizar (`UPDATE`) referências apontando para IDs de outra `Organization` falham tanto na camada de aplicação (`N1-B`) quanto no SGBD. | Suite adversarial real em PostgreSQL efêmero (`executive-cross-tenant-fk-rls.integration.test.mjs`) testando inserção, leitura e update cruzados via API, Worker e Prisma direto. |
| **US-03** | **F1A** | **Captura Rápida Determinística & Bloqueio de `PERSONAL_VAULT` no F1A** | Rejeita `WorkItem` sem `ownerId`, `nextAction` e (`dueAt` OU `triggerCondition`). Rejeita com `HTTP 403 PERSONAL_VAULT_DISABLED_IN_F1A` qualquer tentativa de submeter itens com `domain == PERSONAL` ou `sensitivity == PERSONAL_VAULT` enquanto `personalVaultEnabled == false`. | Teste de contrato provando rejeição de itens órfãos e bloqueio estrito de dados pessoais no MVP F1A. |
| **US-04** | **F1A** | **Motor de Score Explicável (`0–100`) & Fallback Sem LLM** | Calcula `priorityScore` determinístico (30% I, 25% U, 20% F, 15% B, 10% C - penalidades + overrides) e gera `scoreBreakdown`. Se o LLM de resumo estiver indisponível ou com quota esgotada, o motor opera 100% com regras determinísticas. | Teste unitário `executive-priority-score.test.mjs` validando pesos, penalidades e operação offline sem LLM. |
| **US-05** | **F1A** | **Ingestão Read-Only GitHub/Vercel & Deduplicação Idempotente** | Normaliza eventos de repositórios e deploys gerando `fingerprint` SHA-256 único por `(organizationId, fingerprint)`. Replays de webhook não duplicam `Signal` nem `WorkItem`. | Teste de idempotência submetendo eventos duplicados e concorrentes e verificando unicidade. |
| **US-06** | **F1A** | **Motor de Cadência, Timezone IANA/DST, Rate Limit e Pausa** | Avalia janelas no timezone configurado (`America/Fortaleza` default proposto), trata transições de horário de verão (spring-forward / fall-back) sem duplicar nem pular rituais, e aplica `quietHours`, `cooldownHours`, `maxDailyNudges` e `pausedUntil`. | Teste determinístico com relógio injetado simulando dias normais, mudanças de DST, rate limit estourado e pausa ativa. |
| **US-07** | **F1B** | **Aprovação Contextual em 2 Etapas (`DecisionRequest` + RFC 8785 Hash)** | Edição de payload cria nova revisão (`revisionNumber + 1`), calcula SHA-256 sobre JSON canônico RFC 8785 e retorna diff. Aprovação exige CSRF válido, RBAC (`OWNER`/`ADMIN`), `expiresAt > now`, `consumedAt == null` e match exato do novo hash. | Teste adversarial tentando: (a) aprovar hash antigo após edição, (b) reutilizar decisão já consumida (`consume-once`), (c) aprovar decisão expirada ou de outro tenant. |
| **US-08** | **F1B** | **Transactional Outbox (`OutboxEvent`), Lease, Backoff e `ACK != DONE`** | Aprovação grava `DecisionRequest` + `ExecutionOrder` + `OutboxEvent` na mesma transação ACID. Worker usa `FOR UPDATE SKIP LOCKED`, backoff exponencial + jitter e `DEAD_LETTER`. Receber `ACK` mantém `WorkItem` em `IN_PROGRESS` até `Evidence` (`VERIFIED`). | Teste de falha simulada no meio da transação e teste de reentrega `at-least-once` comprovando deduplicação por `idempotencyKey`. |
| **US-09** | **F1B** | **Conector Gmail Opt-In, Gap Detection (`historyId 404`) e Defesa Anti-Prompt-Injection** | Renova `users.watch` a cada 5 dias. Se `users.history.list` retornar `HTTP 404`, **não promete replay absoluto sem perdas**: registra lacuna explícita (`HISTORY_GAP_DETECTED` em `ActivityEvent`/`AuditLog` com intervalo `[lastSyncAt, now]`), executa recuperação de melhor esforço por janela temporal configurável, atualiza cursor e exibe alerta de lacuna na UI. Empacota texto em `<untrusted_data>` e roda LLM com `tools: []`. | Teste simulando `HTTP 404` do Gmail API (validando emissão de `HISTORY_GAP_DETECTED`, alerta de UI e atualização de cursor) e corpus de e-mails com Prompt Injection semântico comprovando zero criação de ordem não autorizada. |
| **US-10** | **F1C/F2** | **Criptografia de Envelope para `PERSONAL_VAULT` & Gate Dogfooding 30 Dias** | Implementa AEAD AES-256-GCM por usuário antes de permitir ativação de `personalVaultEnabled`, auditoria LGPD/DSAR e painel de métricas de 30 dias de dogfooding. | Testes criptográficos de confidencialidade (DBA/dump vê apenas ciphertext autenticado) e validação de métricas de aceite. |

---

## 4. Registro de Riscos Operacionais e de Arquitetura

| ID | Risco Identificado | Severidade | Mitigação Documentada |
| :--- | :--- | :---: | :--- |
| **R-01** | Associação cruzada de chaves estrangeiras entre tenants por bug de worker ou payload manipulado. | **ALTA** | Mitigado em 3 camadas desde a Fase F1A: Guard `N1-B` + chaves compostas `(id, organizationId)` + PostgreSQL `ENABLE/FORCE ROW LEVEL SECURITY` (H-01 / R-61.1). |
| **R-02** | Exposição de assuntos particulares do executivo em backups, logs ou acessos administrativos de banco. | **ALTA** | Ingestão pessoal **adiada** no MVP F1A; exigência obrigatória de Envelope Encryption AEAD AES-256-GCM antes de habilitar `personalVaultEnabled` na Fase F1B/F2 (H-02). |
| **R-03** | Perda de ordens aprovadas ou duplicação de execução durante quedas de rede entre Control Plane e AI-Bridge. | **ALTA** | Adoção da tabela formal `OutboxEvent` na mesma transação ACID + semântica `at-least-once` com deduplicação obrigatória por `idempotencyKey` no receptor (H-03). |
| **R-04** | Aprovação de payload alterado sem confirmação do novo hash (TOCTOU em edição de rascunho). | **ALTA** | Protocolo em 2 etapas: edição gera `revisionNumber + 1` e novo hash canônico RFC 8785; aprovação exige confirmação explícita do novo hash e marca `consumedAt` (H-04). |
| **R-05** | E-mail ou issue externa contendo instruções adversárias em linguagem natural (Prompt Injection Semântico). | **ALTA** | Tratamento de todo input como `UNTRUSTED_DATA`, zero tool-calling no LLM e obrigatoriedade de `DecisionRequest` humana para qualquer ação `APPROVAL_REQUIRED` (H-05). |
| **R-06** | Expiração de `historyId` no Gmail (`HTTP 404`) com perda irrecuperável de mensagens deletadas na janela offline, ou limite de compute/storage do Neon Free / Vercel Cron. | **MÉDIA** | Detecção explícita de lacuna (`HISTORY_GAP_DETECTED`), registro auditável do intervalo perdido, busca de melhor esforço em janela configurável e alerta visual na UI (R-61.2); lotes curtos (`LIMIT 20`) no Cron. |

---

## 5. Checklist GO/NO-GO para o Futuro Lote de Implementação F1A (Ajuste Residual 4)

A implementação da **Fase F1A** permanece com status **`NOT_STARTED / AWAITING_D1`**. Quando (e somente quando) o Master SuperAdmin emitir a autorização **D1**, o trabalho seguirá obrigatoriamente este checklist em um **novo Draft PR separado** (sem tocar no PR #31 ou no PR #32):

- [ ] **Gate 0 (Autorização Executiva D1)**: Autorização explícita do Master SuperAdmin registrada. Zero linhas de código ou migrations criadas antes de D1.
- [ ] **Gate 1 (Isolamento de Branch e PR)**: Código criado em nova branch dedicada (`feat/nexosai-executive-f1a-pilot-...`) e novo Draft PR. PR #31 mantido intacto.
- [ ] **Gate 2 (Gate Quádruplo de Feature Flag OFF por Padrão)**: `NEXOSAI_EXECUTIVE_ENABLED=false` e `ExecutiveWorkspace.featureFlagEnabled=false` negando acesso em UI, API, Cron e Workers (`US-01`).
- [ ] **Gate 3 (Tripla Barreira Multi-Tenant em PostgreSQL Efêmero)**: Testes adversariais provando bloqueio cross-tenant via Application Guard `N1-B`, Composite FKs `(id, organizationId)` e PostgreSQL `FORCE ROW LEVEL SECURITY` (`US-02`).
- [ ] **Gate 4 (Bloqueio Estrito de `PERSONAL_VAULT` no F1A)**: Zero coleta de dados particulares ou e-mails privados no F1A; endpoint rejeita `PERSONAL_VAULT` com `HTTP 403` (`US-03`).
- [ ] **Gate 5 (Idempotência, Determinismo e Ausência de Segredos em Logs)**: Deduplicação por `fingerprint` testada sob concorrência (`US-05`), score funcionando sem LLM (`US-04`) e zero vazamento de tokens em logs/stdout.
- [ ] **Gate 6 (Independência de DNS Externo e Plano de Rollback)**: 100% da suíte `npm test` + testes de integração rodando localmente e no CI sem depender do DNS da Ordem 058. Rollback imediato em 1 segundo via desligamento da Feature Flag (`NEXOSAI_EXECUTIVE_ENABLED=false`) + script de reversão limpa das tabelas F1A.

---

## 6. Decisões Exclusivas do Master SuperAdmin (Sem Presunção de Aceite)

1. **Decisão D1 (Aceite do ADR-001 v1.2 e Autorização para Iniciar F1A em Novo Draft PR)**:
   - Status atual: **`PENDING_EXECUTIVE_DECISION`**.
2. **Decisão D2 (Cadências Propostas no Fuso `America/Fortaleza`)**:
   - Defaults propostos (`08:00` Briefing Matinal, `13:00` Radar de Desbloqueio, Segunda `08:30` Varredura Semanal e `22:00–07:00` Quiet Hours). Status atual: **`PROPOSED_DEFAULT_AWAITING_D2`**.
3. **Decisão / Ação D3 (Ordem 058 — DNS Cloudflare Staging)**:
   - Cadastro do registro `CNAME staging.nexoai -> 4780e4c6526343dd.vercel-dns-017.com` (`DNS only`) na zona `helpusbr.com`. Status atual: **`WAITING_FOR_CLOUDFLARE_ZONE_ADMIN_RECORD`**.
4. **Decisão D4 (Gate B1 — Termo de Aceite de Risco Residual `devDependencies`)**:
   - Minuta `TERM_B1_RISK_ACCEPTANCE_20261103.md`. Status atual: **`UNSIGNED_DRAFT`**.
