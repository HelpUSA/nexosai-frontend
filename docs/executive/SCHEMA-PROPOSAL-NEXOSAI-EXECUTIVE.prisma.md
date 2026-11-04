# Proposta de Schema Prisma: NexosAI Executive (Control Plane Durável)

- **Status**: PROPOSTA DOCUMENTAL (Fase F0 — **Nenhuma migration executada em banco real ou no PR #31**)
- **Compatibilidade**: Estende de forma 100% aditiva os modelos existentes em [`prisma/schema.prisma`](../../prisma/schema.prisma) (`User`, `Organization`, `OrganizationMembership`, `Agent`, `Node`, `AuditLog`).

---

## 1. Máquina de Estados Oficial (`WorkItemState`)

```mermaid
stateDiagram-v2
    [*] --> INBOX
    INBOX --> TRIAGED: Normalização & Score Calculado
    TRIAGED --> PLANNED: Dono, Prazo ou Condição Definidos
    PLANNED --> READY: Pré-requisitos Satisfeitos
    READY --> IN_PROGRESS: Ordem Despachada / Iniciada
    IN_PROGRESS --> WAITING_HUMAN: Exige Decisão / MFA / Revisão
    IN_PROGRESS --> WAITING_EXTERNAL: Aguarda Terceiro / DNS / Cliente
    WAITING_HUMAN --> IN_PROGRESS: DecisionRequest Aprovada
    WAITING_EXTERNAL --> IN_PROGRESS: Sinal Externo Recebido
    IN_PROGRESS --> VERIFICATION: Evidência Submetida pelo Agente/Conector
    VERIFICATION --> DONE: Evidência Verificada (Hash + Check OK)
    VERIFICATION --> IN_PROGRESS: Verificação Reprovada (Reabertura)
    INBOX --> CANCELLED: Descartado Explicitamente
    TRIAGED --> CANCELLED: Descartado Explicitamente
    PLANNED --> CANCELLED: Cancelado pelo Executivo
    WAITING_HUMAN --> CANCELLED: Rejeitado Definitivamente
```

> [!IMPORTANT]
> **Regra Invariante de Governança**: O recebimento de um `ACK` do agente executor (`ExecutionOrder.state = ACKED`) **nunca** transiciona o `WorkItem` para `DONE`. A transição para `DONE` exige obrigatoriamente um registro válido na tabela `Evidence` com `verificationStatus = VERIFIED` ou uma decisão humana explícita de encerramento auditada em `ActivityEvent`.

---

## 2. Definição Proposta em Sintaxe Prisma (`schema.prisma` Extension Proposal)

```prisma
// ============================================================================
// ENUMS DO MÓDULO NEXOSAI EXECUTIVE
// ============================================================================

enum ExecutiveDomain {
  EXISTING_APP      // Evolução, bugs, PRs e deploys de aplicações existentes
  NEW_IDEA          // Incubadora de novas ideias e produtos
  CLIENT_FOLLOWUP   // Acompanhamento pós-venda, suporte VIP e entregas
  SALES_PIPELINE    // Propostas, leads, cotações e fechamento comercial
  INFRA_SECURITY    // DNS, TLS, bancos de dados, auditorias e compliance
  PERSONAL          // Assuntos particulares do executivo (protegidos por PERSONAL_VAULT)
}

enum DataSensitivity {
  ORG_SHARED        // Visível conforme RBAC da Organization (OWNER, ADMIN, OPERATOR, VIEWER)
  EXECUTIVE_ONLY    // Visível apenas para OWNER e ADMIN da Organization
  PERSONAL_VAULT    // Estritamente visível APENAS quando WorkItem.ownerId == session.user.id
}

enum SourceProvider {
  GITHUB
  VERCEL
  GMAIL_OPTIN
  GOOGLE_CALENDAR_OPTIN
  MANUAL_CAPTURE
  AI_BRIDGE_LOCAL
  CUSTOM_WEBHOOK
}

enum ConnectionStatus {
  DISCONNECTED
  ACTIVE
  WATCH_EXPIRING
  ERROR_REAUTH_REQUIRED
  PAUSED
}

enum WorkItemState {
  INBOX
  TRIAGED
  PLANNED
  READY
  IN_PROGRESS
  WAITING_HUMAN
  WAITING_EXTERNAL
  VERIFICATION
  DONE
  CANCELLED
}

enum ActionRiskTier {
  AUTO_READ          // Leitura e indexação sem efeitos colaterais
  AUTO_SAFE          // Criação de rascunhos locais, cálculo de score e agrupamento interno
  APPROVAL_REQUIRED  // Enviar e-mail, alterar DNS/deploy, criar cobrança, despachar AI-Bridge
  PROHIBITED         // Ações destrutivas não autorizadas, bypass de segurança ou vazamento cross-tenant
}

enum DecisionState {
  PENDING
  APPROVED
  ADJUSTED_AND_APPROVED
  REJECTED
  EXPIRED
}

enum ExecutionOrderState {
  QUEUED
  DISPATCHED
  ACKED
  RUNNING
  EVIDENCE_SUBMITTED
  VERIFIED_SUCCESS
  FAILED_RETRYABLE
  DEAD_LETTER
  CANCELLED
}

enum NudgeChannel {
  WEB_COCKPIT
  EMAIL_DIGEST
  WHATSAPP_OPTIN
  TELEGRAM_OPTIN
}

enum NudgeDeliveryStatus {
  SCHEDULED
  SENT
  ACKNOWLEDGED
  SNOOZED
  SUPPRESSED_QUIET_HOURS
  SUPPRESSED_COOLDOWN
  FAILED
}

enum VerificationStatus {
  PENDING_CHECK
  VERIFIED
  REJECTED_INVALID
}

// ============================================================================
// ENTIDADES TENANT-SCOPED DO CONTROL PLANE (8 ENTIDADES NÚCLEO)
// ============================================================================

// 1. ExecutiveWorkspace: Configuração de fuso, janelas de silêncio e versão de política por Tenant
model ExecutiveWorkspace {
  id                      String       @id @default(cuid())
  organizationId          String       @unique
  timezone                String       @default("America/Fortaleza")
  morningBriefingTime     String       @default("08:00") // HH:mm no timezone configurado
  middayUnblockTime       String       @default("13:00")
  weeklyReviewDay         Int          @default(1)       // 1 = Segunda-feira
  quietHoursStart         String       @default("22:00")
  quietHoursEnd           String       @default("07:00")
  maxDailyNudges          Int          @default(8)
  notificationPreferences Json         // Preferências de canais e digest
  policyVersion           String       @default("v1.0.0")
  featureFlagEnabled      Boolean      @default(false)   // OFF por padrão (segurança de rollout)
  createdAt               DateTime     @default(now())
  updatedAt               DateTime     @updatedAt

  organization            Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

// 2. SourceConnection: Conectores por Tenant (ZERO segredos OAuth salvos no banco)
model SourceConnection {
  id              String           @id @default(cuid())
  organizationId  String
  ownerUserId     String           // Usuário que consentiu a fonte
  provider        SourceProvider
  accountLabel    String           // Ex: "HelpUSA GitHub", "helpus.ecommerce@gmail.com"
  oauthScopes     String[]         // Escopos explicitamente concedidos
  secretReference String           // Ponteiro opaco para Secret Manager / Vault externo (NUNCA o token em si)
  status          ConnectionStatus @default(DISCONNECTED)
  syncCursor      String?          // Ex: Gmail historyId, GitHub cursor, último commit SHA
  watchExpiresAt  DateTime?        // Controle de renovação (ex: Gmail Push < 7 dias)
  lastSyncAt      DateTime?
  lastError       String?          @db.Text
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  organization    Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  signals         Signal[]

  @@unique([organizationId, provider, accountLabel])
  @@index([organizationId, status])
  @@index([watchExpiresAt])
}

// 3. Signal: Eventos brutos normalizados, sanitizados e deduplicados
model Signal {
  id              String          @id @default(cuid())
  organizationId  String
  sourceId        String
  ownerUserId     String?         // Obrigatório se sensitivity == PERSONAL_VAULT
  externalId      String          // ID na origem (PR ID, Message-ID, Deployment ID)
  eventVersion    String          @default("1")
  occurredAt      DateTime
  receivedAt      DateTime        @default(now())
  type            String          // Ex: "github.pr.stale", "project.no_commit_days", "email.vip_unanswered"
  evidenceRef     String          // URI/permalink verificável da evidência na fonte
  summaryRedacted String          @db.Text // Resumo sanitizado sem PII sensível ou payloads executáveis
  sensitivity     DataSensitivity @default(ORG_SHARED)
  confidence      Float           @default(1.0) // 0.0 a 1.0
  fingerprint     String          // SHA-256 determinístico para deduplicação idempotente
  rawMetadataJson Json?           // Metadados seguros estritamente tipados

  organization    Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  source          SourceConnection @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  workItems       WorkItem[]

  @@unique([organizationId, fingerprint])
  @@index([organizationId, occurredAt(sort: Desc)])
  @@index([organizationId, sensitivity, ownerUserId])
}

// 4. WorkItem: Unidade central de trabalho, acompanhamento e evolução
model WorkItem {
  id                String          @id @default(cuid())
  organizationId    String
  domain            ExecutiveDomain
  projectSlug       String?         // Ex: "nexosai", "autista", "fit", "books", "rodrigocosta", "fba"
  title             String
  ownerId           String          // Sempre exige um responsável explícito
  sourceSignalId    String?
  nextAction        String          @db.Text // Próximo passo concreto e acionável
  triggerCondition  String?         // Condição de disparo caso não tenha data fixa
  dueAt             DateTime?
  priorityScore     Float           @default(0) // 0.0 a 100.0
  scoreBreakdown    Json            // { impact, urgency, forgettingCost, unblocking, confidence, penalty, reason }
  state             WorkItemState   @default(INBOX)
  riskTier          ActionRiskTier  @default(AUTO_SAFE)
  lastProgressAt    DateTime        @default(now())
  snoozedUntil      DateTime?
  blockedById       String?
  sensitivity       DataSensitivity @default(ORG_SHARED)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  organization      Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  owner             User              @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  sourceSignal      Signal?           @relation(fields: [sourceSignalId], references: [id], onDelete: SetNull)
  blockedBy         WorkItem?         @relation("WorkItemDependency", fields: [blockedById], references: [id], onDelete: SetNull)
  blocking          WorkItem[]        @relation("WorkItemDependency")
  decisionRequests  DecisionRequest[]
  executionOrders   ExecutionOrder[]
  nudges            Nudge[]
  evidences         Evidence[]
  activityEvents    ActivityEvent[]

  @@index([organizationId, state, priorityScore(sort: Desc)])
  @@index([organizationId, domain, state])
  @@index([organizationId, ownerId, sensitivity])
  @@index([organizationId, dueAt])
  @@index([organizationId, lastProgressAt])
}

// 5. DecisionRequest: Solicitação formal de aprovação contextual (Human-in-the-Loop)
model DecisionRequest {
  id                 String         @id @default(cuid())
  organizationId     String
  workItemId         String
  riskTier           ActionRiskTier
  proposedActionType String         // Ex: "DISPATCH_AI_BRIDGE_ORDER", "SEND_CLIENT_EMAIL", "UPDATE_DNS"
  actionPayloadJson  Json           // Payload completo visível para inspeção humana
  actionPayloadHash  String         // SHA-256 canônico do actionPayloadJson (vincula aprovação ao conteúdo exato)
  rationale          String         @db.Text
  approverId         String?
  state              DecisionState  @default(PENDING)
  expiresAt          DateTime       // Aprovações pendentes expiram automaticamente
  decidedAt          DateTime?
  decisionNote       String?        @db.Text
  createdAt          DateTime       @default(now())

  organization       Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  workItem           WorkItem       @relation(fields: [workItemId], references: [id], onDelete: Cascade)
  approver           User?          @relation(fields: [approverId], references: [id], onDelete: SetNull)
  executionOrders    ExecutionOrder[]

  @@index([organizationId, state, expiresAt])
  @@index([workItemId])
}

// 6. ExecutionOrder: Ordem durável despachada para o Execution Plane (AI-Bridge / Runners)
model ExecutionOrder {
  id                String              @id @default(cuid())
  organizationId    String
  workItemId        String
  decisionRequestId String?             // Obrigatório para ordens APPROVAL_REQUIRED
  agentId           String?             // Referência ao Agent (Antigravity, ChatGPT, etc.)
  correlationId     String              @unique
  idempotencyKey    String              // Garante execução única mesmo sob retries
  commandPayload    Json
  payloadSignature  String              // HMAC-SHA256 / Ed25519 para autenticação mútua na Bridge V2
  state             ExecutionOrderState @default(QUEUED)
  leaseOwner        String?             // Worker ID que detém o lease atual
  leaseExpiresAt    DateTime?
  retries           Int                 @default(0)
  maxRetries        Int                 @default(3)
  nextRetryAt       DateTime?
  lastError         String?             @db.Text
  evidenceId        String?             @unique
  dispatchedAt      DateTime?
  ackedAt           DateTime?
  completedAt       DateTime?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  organization      Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  workItem          WorkItem            @relation(fields: [workItemId], references: [id], onDelete: Cascade)
  decisionRequest   DecisionRequest?    @relation(fields: [decisionRequestId], references: [id], onDelete: Restrict)
  agent             Agent?              @relation(fields: [agentId], references: [id], onDelete: SetNull)
  evidence          Evidence?           @relation(fields: [evidenceId], references: [id], onDelete: SetNull)

  @@unique([organizationId, idempotencyKey])
  @@index([organizationId, state, nextRetryAt])
  @@index([leaseExpiresAt])
}

// 7. CadencePolicy & Nudge: Regras de cobrança proativa e controle antifadiga
model CadencePolicy {
  id             String          @id @default(cuid())
  organizationId String
  name           String          // Ex: "Morning Executive Briefing", "Stale App Watchdog (5d)"
  domain         ExecutiveDomain?
  cronExpression String          // Ex: "0 8 * * *"
  windowMinutes  Int             @default(60)
  cooldownHours  Int             @default(24) // Tempo mínimo antes de repetir cobrança sobre o mesmo item
  maxItemsPerRun Int             @default(5)
  channel        NudgeChannel    @default(WEB_COCKPIT)
  isActive       Boolean         @default(true)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  organization   Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  nudges         Nudge[]

  @@index([organizationId, isActive])
}

model Nudge {
  id             String              @id @default(cuid())
  organizationId String
  workItemId     String
  policyId       String?
  recipientId    String
  channel        NudgeChannel
  dedupeKey      String              // Evita spam duplicado na mesma janela
  messageSummary String              @db.Text
  deliveryStatus NudgeDeliveryStatus @default(SCHEDULED)
  scheduledFor   DateTime
  deliveredAt    DateTime?
  snoozedUntil   DateTime?
  createdAt      DateTime            @default(now())

  organization   Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  workItem       WorkItem            @relation(fields: [workItemId], references: [id], onDelete: Cascade)
  policy         CadencePolicy?      @relation(fields: [policyId], references: [id], onDelete: SetNull)

  @@unique([organizationId, dedupeKey])
  @@index([organizationId, recipientId, deliveryStatus, scheduledFor])
}

// 8. Evidence & ActivityEvent: Provas verificáveis e trilha de auditoria append-only
model Evidence {
  id                 String             @id @default(cuid())
  organizationId     String
  workItemId         String
  origin             String             // Ex: "antigravity-runner", "github-ci", "vercel-api"
  artifactUri        String             // Link para PR, commit, teste ou relatório
  sha256Hash         String             // Hash criptográfico do conteúdo/laudo
  summary            String             @db.Text
  verificationStatus VerificationStatus @default(PENDING_CHECK)
  verifiedByUserId   String?
  observedAt         DateTime           @default(now())
  verifiedAt         DateTime?

  organization       Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  workItem           WorkItem           @relation(fields: [workItemId], references: [id], onDelete: Cascade)
  executionOrder     ExecutionOrder?

  @@index([organizationId, workItemId, verificationStatus])
}

model ActivityEvent {
  id             String       @id @default(cuid())
  organizationId String
  workItemId     String
  actorUserId    String?
  actorAgentId   String?
  eventType      String       // Ex: "STATE_TRANSITION", "SCORE_UPDATED", "DECISION_APPROVED", "SNOOZED"
  previousState  String?
  newState       String?
  metadataJson   Json?
  eventHash      String       // Hash encadeado para integridade append-only
  occurredAt     DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  workItem       WorkItem     @relation(fields: [workItemId], references: [id], onDelete: Cascade)

  @@index([organizationId, workItemId, occurredAt(sort: Desc)])
}
```
