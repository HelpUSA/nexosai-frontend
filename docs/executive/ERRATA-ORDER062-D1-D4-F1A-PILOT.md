# Errata & Freeze Record — Ordem 062 (`HU-HUB-ORDER062-NEXOSAI-EXECUTIVE-F1A-AUTHORIZED-20261104`)

- **Ordem Executiva:** `HU-HUB-ORDER062-NEXOSAI-EXECUTIVE-F1A-AUTHORIZED-20261104`
- **Referência GitHub:** [Issue #22 Comment #6639945733](https://github.com/HelpUSA/nexosai-frontend/issues/22#issuecomment-6639945733)
- **Branch de Implementação F1A:** `feat/nexosai-executive-f1a-pilot-20261104` (baseada em `bb1830976ac9a16066400b0839a39be83cac8bef`)
- **Status:** `FROZEN_FOR_F1A_IMPLEMENTATION`

---

## 1. Registro de Errata e Congelamento da Decisão D3 (Cadência e Fuso Horário)

Nos documentos preliminares da Fase F0 (Ordens 059–061), havia sido sugerida a cadência inicial em `America/Sao_Paulo` (`08:00`, `18:00`, `Domingo 19:00`). Por decisão expressa do **Master SuperAdmin** formalizada na **Ordem 062**, aquela sugestão fica **SUPERADA** e os seguintes defaults oficiais ficam **CONGELADOS** em código, banco de dados e testes:

| Parâmetro de Cadência | Valor Oficial Congelado (D3) | Detalhe / Regra Operacional |
| :--- | :--- | :--- |
| **Fuso Horário Padrão (IANA)** | `America/Fortaleza` | UTC-3 constante (sem horário de verão histórico/futuro); configurável por tenant |
| **Briefing Matinal (`MORNING_BRIEFING`)** | `08:00` | Síntese "Meu Dia" com Top Prioridades (`P0`/`P1`) e bloqueios |
| **Radar da Tarde (`AFTERNOON_RADAR`)** | `13:00` | Check-in de meio de expediente, radar de projetos sem movimento e sinais críticos |
| **Revisão Semanal (`WEEKLY_REVIEW`)** | `Segunda-feira 08:30` (`dayOfWeek = 1`) | Varredura completa do portfólio de negócios/projetos e ideias estagnadas |
| **Janela de Silêncio (`Quiet Hours`)** | `22:00` às `07:00` | Supressão proativa (`SUPPRESSED_QUIET_HOURS`) no fuso configurado do tenant |
| **Jobs e Notificações Externas** | `DISABLED_BY_DEFAULT` | Implementados como código testável com relógio injetado (`now: Date`); sem cron produtivo ativo e sem envio externo nesta fase |

---

## 2. Consolidação das Decisões D1, D2 e D4 na Fase F1A

- **D1 (`APPROVED LIMITED`)**: Autorizada exclusivamente a implementação da Fase F1A em branch e PR Draft isolados (`feat/nexosai-executive-f1a-pilot-20261104`), com validação em banco PostgreSQL efêmero local/CI. Proibido merge, deploy produtivo, aplicação de migrations em staging/produção ou uso do banco FBA (`tiny-rice-22943393`).
- **D2 (`Conectores F1A`)**: Escopo estritamente restrito à **captura manual de atividades/ideias de negócios e projetos** (`MANUAL`, `INTERNAL_AUDIT`) e conectores **GitHub e Vercel Read-Only** (`GITHUB`, `VERCEL`). Conectores `GMAIL`, `GOOGLE_CALENDAR`, `LINEAR`, `STRIPE`, `WEBHOOK` e o escopo `PERSONAL_VAULT` / categoria `PERSONAL` são bloqueados **fail-closed (`HTTP 403`)** em todas as camadas da F1A.
- **D4 (`Isolamento Multi-Tenant Obrigatório desde F1A`)**: `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` nas 8 tabelas `exec_*`, GUC transacional `SET LOCAL app.current_organization_id` (seguro para connection pooling), chaves estrangeiras compostas com `organizationId` e guard `N1-B` + Feature Flag Quádrupla (`NEXOSAI_EXECUTIVE_ENABLED="false"` por padrão).
