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
| **US-02** | **F1A** | **Integridade Relacional Multi-Tenant (Composite FKs & Adversarial Tests)** | Schema aplica `@@unique([id, organizationId])` e FKs compostas em `Signal`, `WorkItem`, `DecisionRequest`, `ExecutionOrder`, `Nudge` e `Evidence`. Tentativas de criar ou atualizar (`UPDATE`) referências apontando para IDs de outra `Organization` falham no banco e na API. | Suite adversarial `executive-cross-tenant-fk.integration.test.mjs` testando inserção e update cruzados via API, Worker e Prisma direto. |
| **US-03** | **F1A** | **Captura Rápida Determinística & Bloqueio de `PERSONAL_VAULT` no F1A** | Rejeita `WorkItem` sem `ownerId`, `nextAction` e (`dueAt` OU `triggerCondition`). Rejeita com `HTTP 403 PERSONAL_VAULT_DISABLED_IN_F1A` qualquer tentativa de submeter itens com `domain == PERSONAL` ou `sensitivity == PERSONAL_VAULT` enquanto `personalVaultEnabled == false`. | Teste de contrato provando rejeição de itens órfãos e bloqueio estrito de dados pessoais no MVP F1A. |
| **US-04** | **F1A** | **Motor de Score Explicável (`0–100`) & Fallback Sem LLM** | Calcula `priorityScore` determinístico (30% I, 25% U, 20% F, 15% B, 10% C - penalidades + overrides) e gera `scoreBreakdown`. Se o LLM de resumo estiver indisponível ou com quota esgotada, o motor opera 100% com regras determinísticas. | Teste unitário `executive-priority-score.test.mjs` validando pesos, penalidades e operação offline sem LLM. |
| **US-05** | **F1A** | **Ingestão Read-Only GitHub/Vercel & Deduplicação Idempotente** | Normaliza eventos de repositórios e deploys gerando `fingerprint` SHA-256 único por `(organizationId, fingerprint)`. Replays de webhook não duplicam `Signal` nem `WorkItem`. | Teste de idempotência submetendo eventos duplicados e concorrentes e verificando unicidade. |
| **US-06** | **F1A** | **Motor de Cadência, Timezone IANA/DST, Rate Limit e Pausa** | Avalia janelas no timezone configurado (`America/Fortaleza` default proposto), trata transições de horário de verão (spring-forward / fall-back) sem duplicar nem pular rituais, e aplica `quietHours`, `cooldownHours`, `maxDailyNudges` e `pausedUntil`. | Teste determinístico com relógio injetado simulando dias normais, mudanças de DST, rate limit estourado e pausa ativa. |
| **US-07** | **F1B** | **Aprovação Contextual em 2 Etapas (`DecisionRequest` + RFC 8785 Hash)** | Edição de payload cria nova revisão (`revisionNumber + 1`), calcula SHA-256 sobre JSON canônico RFC 8785 e retorna diff. Aprovação exige CSRF válido, RBAC (`OWNER`/`ADMIN`), `expiresAt > now`, `consumedAt == null` e match exato do novo hash. | Teste adversarial tentando: (a) aprovar hash antigo após edição, (b) reutilizar decisão já consumida (`consume-once`), (c) aprovar decisão expirada ou de outro tenant. |
| **US-08** | **F1B** | **Transactional Outbox (`OutboxEvent`), Lease, Backoff e `ACK != DONE`** | Aprovação grava `DecisionRequest` + `ExecutionOrder` + `OutboxEvent` na mesma transação ACID. Worker usa `FOR UPDATE SKIP LOCKED`, backoff exponencial + jitter e `DEAD_LETTER`. Receber `ACK` mantém `WorkItem` em `IN_PROGRESS` até `Evidence` (`VERIFIED`). | Teste de falha simulada no meio da transação e teste de reentrega `at-least-once` comprovando deduplicação por `idempotencyKey`. |
| **US-09** | **F1B** | **Conector Gmail Opt-In, Fallback `historyId 404` e Defesa Anti-Prompt-Injection** | Renova `users.watch` a cada 5 dias; se `users.history.list` retornar `HTTP 404`, executa reconciliação por janela de tempo sem perder sinais. Empacota texto em `<untrusted_data>` e roda LLM com `tools: []`. | Teste simulando `HTTP 404` do Gmail API e corpus de e-mails com Prompt Injection semântico comprovando zero criação de ordem não autorizada. |
| **US-10** | **F1C/F2** | **Criptografia de Envelope para `PERSONAL_VAULT` & Gate Dogfooding 30 Dias** | Implementa AEAD AES-256-GCM por usuário antes de permitir ativação de `personalVaultEnabled`, auditoria LGPD/DSAR e painel de métricas de 30 dias de dogfooding. | Testes criptográficos de confidencialidade (DBA/dump vê apenas ciphertext autenticado) e validação de métricas de aceite. |

---

## 4. Registro de Riscos Operacionais e de Arquitetura

| ID | Risco Identificado | Severidade | Mitigação Documentada |
| :--- | :--- | :---: | :--- |
| **R-01** | Associação cruzada de chaves estrangeiras entre tenants por bug de worker ou payload manipulado. | **ALTA** | Mitigado estruturalmente no banco via chaves compostas `(id, organizationId)` em todas as relações + RLS no PostgreSQL (H-01). |
| **R-02** | Exposição de assuntos particulares do executivo em backups, logs ou acessos administrativos de banco. | **ALTA** | Ingestão pessoal **adiada** no MVP F1A; exigência obrigatória de Envelope Encryption AEAD AES-256-GCM antes de habilitar `personalVaultEnabled` na Fase F1B/F2 (H-02). |
| **R-03** | Perda de ordens aprovadas ou duplicação de execução durante quedas de rede entre Control Plane e AI-Bridge. | **ALTA** | Adoção da tabela formal `OutboxEvent` na mesma transação ACID + semântica `at-least-once` com deduplicação obrigatória por `idempotencyKey` no receptor (H-03). |
| **R-04** | Aprovação de payload alterado sem confirmação do novo hash (TOCTOU em edição de rascunho). | **ALTA** | Protocolo em 2 etapas: edição gera `revisionNumber + 1` e novo hash canônico RFC 8785; aprovação exige confirmação explícita do novo hash e marca `consumedAt` (H-04). |
| **R-05** | E-mail ou issue externa contendo instruções adversárias em linguagem natural (Prompt Injection Semântico). | **ALTA** | Tratamento de todo input como `UNTRUSTED_DATA`, zero tool-calling no LLM e obrigatoriedade de `DecisionRequest` humana para qualquer ação `APPROVAL_REQUIRED` (H-05). |
| **R-06** | Expiração de `historyId` no Gmail (`HTTP 404`) ou limite de compute/storage do Neon Free / Vercel Cron. | **MÉDIA** | Fallback automático de reconciliação temporal no Gmail; lotes curtos (`LIMIT 20`) no Cron; monitoramento de franquia do Neon (H-06). |

---

## 5. Pontos que Exigem Decisão Executiva do Master SuperAdmin

1. **Decisão D1 (Aprovação do ADR-001 v1.1 e Autorização para Iniciar F1A)**:
   - Aprovar este desenho revisado (com FKs compostas, `OutboxEvent` transacional, aprovação em 2 etapas e adiamento do `PERSONAL_VAULT` no MVP F1A) para que possamos abrir a branch de implementação da **Fase F1A** (mantendo `featureFlagEnabled = false` por padrão e PR #31 intocado).
2. **Decisão D2 (Confirmação ou Ajuste das Cadências Propostas)**:
   - Confirmar se os defaults propostos (`08:00` Briefing Matinal, `13:00` Radar de Desbloqueio, Segunda `08:30` Varredura Semanal e `22:00–07:00` Quiet Hours no fuso `America/Fortaleza`) devem ser mantidos como configuração inicial.
3. **Pendência Independente (Ordem 058 — DNS Cloudflare)**:
   - Segue em `WAITING_FOR_CLOUDFLARE_ZONE_ADMIN_RECORD` (`CNAME staging.nexoai -> 4780e4c6526343dd.vercel-dns-017.com`, `DNS only`), sem bloquear a revisão documental ou os testes locais/CI futuros da Fase F1A.
