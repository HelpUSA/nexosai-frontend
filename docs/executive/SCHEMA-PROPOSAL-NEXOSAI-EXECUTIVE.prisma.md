# Proposta de Schema Prisma: NexosAI Executive (Control Plane Durável — Revisão v1.1 Ordem 060)

- **Status**: PROPOSTA DOCUMENTAL (Fase F0 — **Nenhuma migration executada em banco real ou no PR #31**)
- **Ordem de Referência**: `HU-HUB-ORDER060-EXECUTIVE-ADR-HARDENING-20261104`
- **Compatibilidade**: Estende de forma aditiva os modelos existentes em [`prisma/schema.prisma`](../../prisma/schema.prisma) (`User`, `Organization`, `OrganizationMembership`, `Agent`, `Node`, `AuditLog`).

---

## 1. Garantias de Integridade Relacional Multi-Tenant (Hardening H-01)

Para impedir que qualquer worker, endpoint ou update malicioso associe registros de organizações diferentes (ex.: um `WorkItem` da `Org A` apontando para um `Signal`, `DecisionRequest` ou `blockedById` da `Org B`):
1. **Chave Única Composta nos Pais**: Todos os modelos pai tenant-scoped declaram `@@unique([id, organizationId])`.
2. **Foreign Keys Compostas nos Filhos**: Todas as relações internas usam `fields: [<fkId>, organizationId], references: [id, organizationId]`. O PostgreSQL bloqueia estruturalmente qualquer cruzamento de `organizationId` em `INSERT` ou `UPDATE`.
3. **Defesa Adicional (PostgreSQL RLS)**: Nas migrations da Fase F1B/F2, as tabelas receberão `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` com política `organizationId = current_setting('app.current_organization_id', true)`.

---

## 2. Máquina de Estados Oficial (`WorkItemState`)

```mermaid
stateDiagram-v2
    [*] --> INBOX
    INBOX --> TRIAGED: Normalização & Score Calculado
    TRIAGED --> PLANNED: Dono, Prazo ou Condição Definidos
    PLANNED --> READY: Pré-requisitos Satisfeitos
    READY --> IN_PROGRESS: Ordem Despachada via OutboxEvent
    IN_PROGRESS --> WAITING_HUMAN: Exige DecisionRequest / MFA / Revisão
    IN_PROGRESS --> WAITING_EXTERNAL: Aguarda Terceiro / DNS / Cliente
    WAITING_HUMAN --> IN_PROGRESS: DecisionRequest Aprovada (Hash Confirmado)
    WAITING_EXTERNAL --> IN_PROGRESS: Sinal Externo Recebido
    IN_PROGRESS --> VERIFICATION: Evidência Submetida pelo Agente/Conector
    VERIFICATION --> DONE: Evidência Verificada (Hash + Check OK)
    VERIFICATION --> IN_PROGRESS: Verificação Reprovada (Reabertura)
    INBOX --> CANCELLED: Descartado Explicitamente
    TRIAGED --> CANCELLED: Descartado Explicitamente
    PLANNED --> CANCELLED: Cancelado pelo Executivo
    WAITING_HUMAN --> CANCELLED: Rejeitado Definitivamente
```

---

## 3. Definição Proposta em Sintaxe Prisma Validável (`schema.prisma` Extension Proposal)

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
  PERSONAL          // ADIADO NO MVP F1A: Exige Envelope Encryption aprovada antes de habilitar
}

enum DataSensitivity {
  ORG_SHARED        // Visível conforme RBAC da Organization (OWNER, ADMIN, OPERATOR, VIEWER)
  EXECUTIVE_ONLY    // Visível apenas para OWNER e ADMIN da Organization
  PERSONAL_VAULT    // ADIADO NO MVP F1A: Exige ownerId == session.user.id + AEAD Envelope Encryption
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
  HISTORY_EXPIRED_RECONCILING
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
  SUPERSEDED_BY_EDIT // Revisão anterior substituída após edição pelo executivo (Etapa 1 do ajuste)
  APPROVED           // Aprovado sobre o canonicalPayloadHash exato da revisão atual (Etapa 2)
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

enum OutboxEventStatus {
  PENDING
  PROCESSING
  PUBLISHED
  FAILED_RETRYABLE
  DEAD_LETTER
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
  SUPPRESSED_PAUSED
  SUPPRESSED_RATE_LIMIT
  FAILED
}

enum VerificationStatus {
  PENDING_CHECK
  VERIFIED
  REJECTED_INVALID
}

// ============================================================================
// ENTIDADES TENANT-SCOPED DO CONTROL PLANE (COM COMPOSITE FKS)
// ============================================================================

// 1. ExecutiveWorkspace: Configuração por Tenant (Horários default propostos sujeitos a D2)
model ExecutiveWorkspace {
  id                      String       @id @default(cuid())
  organizationId          String       @unique
  timezone                String       @default("America/Fortaleza") // IANA Timezone
  morningBriefingTime     String       @default("08:00")             // Default proposto (sujeito a D2)
  middayUnblockTime       String       @default("13:00")             // Default proposto (sujeito a D2)
  weeklyReviewDay         Int          @default(1)                   // 1 = Segunda-feira (proposto)
  quietHoursStart         String       @default("22:00")             // Default proposto (sujeito a D2)
  quietHoursEnd           String       @default("07:00")             // Default proposto (sujeito a D2)
  maxDailyNudges          Int          @default(8)
  pausedUntil             DateTime?                                  // Pausa temporária anti-fadiga
  personalVaultEnabled    Boolean      @default(false)               // OFF no MVP F1A até revisão de criptografia
  notificationPreferences Json
  policyVersion           String       @default("v1.1.0")
  featureFlagEnabled      Boolean      @default(false)               // OFF por padrão (nega UI, API, Cron, Worker)
  createdAt               DateTime     @default(now())
  updatedAt               DateTime     @updatedAt

  organization            Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([id, organizationId])
}

// 2. SourceConnection: Conectores por Tenant (ZERO segredos OAuth salvos no banco)
model SourceConnection {
  id              String           @id @default(cuid())
  organizationId  String
  ownerUserId     String
  provider        SourceProvider
  accountLabel    String
  oauthScopes     String[]
  secretReference String           // Ponteiro opaco para Secret Manager externo (NUNCA o token bruto)
  status          ConnectionStatus @default(DISCONNECTED)
  syncCursor      String?          // Ex: Gmail historyId ou GitHub cursor
  watchExpiresAt  DateTime?        // Gmail Push exige renovação < 7 dias
  lastReconciledAt DateTime?       // Última reconciliação por janela (fallback de historyId 404)
  lastSyncAt      DateTime?
  lastError       String?          @db.Text
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  organization    Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  signals         Signal[]

  @@unique([id, organizationId])
  @@unique([organizationId, provider, accountLabel])
  @@index([organizationId, status])
  @@index([watchExpiresAt])
}

// 3. Signal: Eventos brutos normalizados, marcados como UNTRUSTED_DATA e deduplicados
model Signal {
  id                  String          @id @default(cuid())
  organizationId      String
  sourceId            String
  ownerUserId         String?         // Obrigatório se sensitivity == PERSONAL_VAULT
  externalId          String
  eventVersion        String          @default("1")
  occurredAt          DateTime
  receivedAt          DateTime        @default(now())
  type                String
  evidenceRef         String
  untrustedTextSummary String         @db.Text // Sempre tratado como UNTRUSTED_DATA (nunca instrução de sistema)
  encryptedPayloadB64 String?         @db.Text // Para futuro PERSONAL_VAULT (AEAD AES-256-GCM)
  encryptionKeyRef    String?         // Referência da DEK/KEK do usuário quando cifrado
  sensitivity         DataSensitivity @default(ORG_SHARED)
  confidence          Float           @default(1.0)
  fingerprint         String          // SHA-256 determinístico para deduplicação idempotente
  rawMetadataJson     Json?

  organization        Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  // FK Composta garantindo que Signal e SourceConnection pertençam exatamente à mesma Organization:
  source              SourceConnection @relation(fields: [sourceId, organizationId], references: [id, organizationId], onDelete: Cascade)
  workItems           WorkItem[]

  @@unique([id, organizationId])
  @@unique([organizationId, fingerprint])
  @@index([organizationId, occurredAt(sort: Desc)])
  @@index([organizationId, sensitivity, ownerUserId])
}

// 4. WorkItem: Unidade central de trabalho (com FKs compostas estritas por Tenant)
model WorkItem {
  id                String          @id @default(cuid())
  organizationId    String
  domain            ExecutiveDomain
  projectSlug       String?
  title             String
  ownerId           String
  sourceSignalId    String?
  nextAction        String          @db.Text
  triggerCondition  String?
  dueAt             DateTime?
  priorityScore     Float           @default(0)
  scoreBreakdown    Json
  state             WorkItemState   @default(INBOX)
  riskTier          ActionRiskTier  @default(AUTO_SAFE)
  lastProgressAt    DateTime        @default(now())
  snoozedUntil      DateTime?
  blockedById       String?
  sensitivity       DataSensitivity @default(ORG_SHARED)
  encryptedNotesB64 String?         @db.Text // Reservado para futuro PERSONAL_VAULT cifrado
  encryptionKeyRef  String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  organization      Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  owner             User              @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  // FK Composta: impede vincular Signal de outro tenant
  sourceSignal      Signal?           @relation(fields: [sourceSignalId, organizationId], references: [id, organizationId], onDelete: Restrict)
  // FK Composta: impede dependência bloqueante (blockedBy) cruzando tenants
  blockedBy         WorkItem?         @relation("WorkItemDependency", fields: [blockedById, organizationId], references: [id, organizationId], onDelete: Restrict)
  blocking          WorkItem[]        @relation("WorkItemDependency")
  decisionRequests  DecisionRequest[]
  executionOrders   ExecutionOrder[]
  nudges            Nudge[]
  evidences         Evidence[]
  activityEvents    ActivityEvent[]

  @@unique([id, organizationId])
  @@index([organizationId, state, priorityScore(sort: Desc)])
  @@index([organizationId, domain, state])
  @@index([organizationId, ownerId, sensitivity])
  @@index([organizationId, dueAt])
  @@index([organizationId, lastProgressAt])
}

// 5. DecisionRequest: Aprovação em 2 etapas para edições, hash canônico RFC 8785 e consume-once
model DecisionRequest {
  id                   String         @id @default(cuid())
  organizationId       String
  workItemId           String
  revisionNumber       Int            @default(1) // Incrementado a cada edição antes da aprovação
  supersedesDecisionId String?        @unique     // Aponta para a revisão anterior se houve edição
  riskTier             ActionRiskTier
  proposedActionType   String
  actionPayloadJson    Json           // Payload canônico atual
  canonicalPayloadHash String         // SHA-256 sobre JSON canônico (RFC 8785) desta revisão exata
  diffFromPreviousJson Json?          // Diff estruturado exibido na UI quando revisionNumber > 1
  rationale            String         @db.Text
  approverId           String?
  state                DecisionState  @default(PENDING)
  expiresAt            DateTime       // TTL obrigatório
  consumedAt           DateTime?      // Garante semântica consume-once na geração da ExecutionOrder
  decidedAt            DateTime?
  decisionNote         String?        @db.Text
  createdAt            DateTime       @default(now())

  organization         Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  // FK Composta: garante que DecisionRequest e WorkItem pertençam à mesma Organization
  workItem             WorkItem       @relation(fields: [workItemId, organizationId], references: [id, organizationId], onDelete: Cascade)
  approver             User?          @relation(fields: [approverId], references: [id], onDelete: SetNull)
  executionOrders      ExecutionOrder[]

  @@unique([id, organizationId])
  @@unique([organizationId, workItemId, revisionNumber])
  @@index([organizationId, state, expiresAt])
}

// 6. ExecutionOrder: Ordem durável vinculada ao DecisionRequest e Evidence do mesmo Tenant
model ExecutionOrder {
  id                String              @id @default(cuid())
  organizationId    String
  workItemId        String
  decisionRequestId String?
  agentId           String?
  correlationId     String              @unique
  idempotencyKey    String
  commandPayload    Json
  confirmedHash     String              // Deve coincidir com DecisionRequest.canonicalPayloadHash
  payloadSignature  String
  state             ExecutionOrderState @default(QUEUED)
  leaseOwner        String?
  leaseExpiresAt    DateTime?
  retries           Int                 @default(0)
  maxRetries        Int                 @default(3)
  nextRetryAt       DateTime?
  lastError         String?             @db.Text
  evidenceId        String?
  dispatchedAt      DateTime?
  ackedAt           DateTime?
  completedAt       DateTime?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  organization      Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  // FKs Compostas estritas por Tenant:
  workItem          WorkItem            @relation(fields: [workItemId, organizationId], references: [id, organizationId], onDelete: Cascade)
  decisionRequest   DecisionRequest?    @relation(fields: [decisionRequestId, organizationId], references: [id, organizationId], onDelete: Restrict)
  evidence          Evidence?           @relation(fields: [evidenceId, organizationId], references: [id, organizationId], onDelete: Restrict)
  agent             Agent?              @relation(fields: [agentId], references: [id], onDelete: SetNull)

  @@unique([id, organizationId])
  @@unique([organizationId, idempotencyKey])
  @@unique([evidenceId, organizationId])
  @@index([organizationId, state, nextRetryAt])
  @@index([leaseExpiresAt])
}

// 7. OutboxEvent: Tabela Formal de Transactional Outbox (Semântica At-Least-Once)
model OutboxEvent {
  id              String            @id @default(cuid())
  organizationId  String
  aggregateType   String            // Ex: "ExecutionOrder", "Nudge", "DecisionRequest"
  aggregateId     String
  eventType       String            // Ex: "EXECUTION_ORDER_QUEUED", "NUDGE_SCHEDULED"
  idempotencyKey  String            // Chave única enviada ao consumidor para deduplicação
  payloadJson     Json
  status          OutboxEventStatus @default(PENDING)
  leaseOwner      String?
  lockedUntil     DateTime?
  attempts        Int               @default(0)
  maxAttempts     Int               @default(5)
  nextAttemptAt   DateTime          @default(now())
  lastError       String?           @db.Text
  publishedAt     DateTime?
  createdAt       DateTime          @default(now())

  organization    Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([id, organizationId])
  @@unique([organizationId, idempotencyKey])
  @@index([status, nextAttemptAt, lockedUntil])
  @@index([organizationId, aggregateType, aggregateId])
}

// 8. CadencePolicy & Nudge: Regras de cobrança proativa e controle antifadiga (FKs Compostas)
model CadencePolicy {
  id             String          @id @default(cuid())
  organizationId String
  name           String
  domain         ExecutiveDomain?
  cronExpression String
  windowMinutes  Int             @default(60)
  cooldownHours  Int             @default(24)
  maxItemsPerRun Int             @default(5)
  channel        NudgeChannel    @default(WEB_COCKPIT)
  isActive       Boolean         @default(true)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  organization   Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  nudges         Nudge[]

  @@unique([id, organizationId])
  @@index([organizationId, isActive])
}

model Nudge {
  id             String              @id @default(cuid())
  organizationId String
  workItemId     String
  policyId       String?
  recipientId    String
  channel        NudgeChannel
  dedupeKey      String              // Ex: sha256(orgId + workItemId + policyId + windowBucket)
  messageSummary String              @db.Text
  deliveryStatus NudgeDeliveryStatus @default(SCHEDULED)
  scheduledFor   DateTime
  deliveredAt    DateTime?
  snoozedUntil   DateTime?
  createdAt      DateTime            @default(now())

  organization   Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  // FKs Compostas estritas por Tenant:
  workItem       WorkItem            @relation(fields: [workItemId, organizationId], references: [id, organizationId], onDelete: Cascade)
  policy         CadencePolicy?      @relation(fields: [policyId, organizationId], references: [id, organizationId], onDelete: Restrict)

  @@unique([id, organizationId])
  @@unique([organizationId, dedupeKey])
  @@index([organizationId, recipientId, deliveryStatus, scheduledFor])
}

// 9. Evidence & ActivityEvent: Provas verificáveis e trilha append-only (FKs Compostas)
model Evidence {
  id                 String             @id @default(cuid())
  organizationId     String
  workItemId         String
  origin             String
  artifactUri        String
  sha256Hash         String
  summary            String             @db.Text
  verificationStatus VerificationStatus @default(PENDING_CHECK)
  verifiedByUserId   String?
  observedAt         DateTime           @default(now())
  verifiedAt         DateTime?

  organization       Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  workItem           WorkItem           @relation(fields: [workItemId, organizationId], references: [id, organizationId], onDelete: Cascade)
  executionOrder     ExecutionOrder?

  @@unique([id, organizationId])
  @@index([organizationId, workItemId, verificationStatus])
}

model ActivityEvent {
  id             String       @id @default(cuid())
  organizationId String
  workItemId     String
  actorUserId    String?
  actorAgentId   String?
  eventType      String
  previousState  String?
  newState       String?
  metadataJson   Json?
  eventHash      String
  occurredAt     DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  workItem       WorkItem     @relation(fields: [workItemId, organizationId], references: [id, organizationId], onDelete: Cascade)

  @@unique([id, organizationId])
  @@index([organizationId, workItemId, occurredAt(sort: Desc)])
}
```
