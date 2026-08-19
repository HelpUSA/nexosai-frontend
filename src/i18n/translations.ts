export type Language = 'pt' | 'en' | 'es';

export function getLang(rawLang?: string): Language {
  if (rawLang && ['pt', 'en', 'es'].includes(rawLang)) {
    return rawLang as Language;
  }
  return 'en';
}

export interface TranslationSchema {
  nav: {
    dashboard: string;
    nodes: string;
    agents: string;
    projects: string;
    conversations: string;
    downloads: string;
    audit: string;
    admin: string;
  };
  header: {
    brandSubtitle: string;
    bootstrapAdmin: string;
  };
  dashboard: {
    badge: string;
    title: string;
    description: string;
    stats: {
      nodesModel: { label: string; value: string; note: string };
      relayCloud: { label: string; value: string; note: string };
      localExec: { label: string; value: string; note: string };
      activeAgents: { label: string; value: string; note: string };
    };
    cloudRespTitle: string;
    cloudRespList: string[];
    localRespTitle: string;
    localRespList: string[];
  };
  nodes: {
    badge: string;
    title: string;
    description: string;
    contractTitle: string;
    contractList: string[];
  };
  agents: {
    badge: string;
    title: string;
    description: string;
    newAgentBtn: string;
    configuredAgents: string;
  };
  conversations: {
    badge: string;
    title: string;
    description: string;
    relayFlowTitle: string;
    relayFlowDesc: string;
  };
  projects: {
    badge: string;
    title: string;
    description: string;
  };
  downloads: {
    badge: string;
    title: string;
    description: string;
  };
  audit: {
    badge: string;
    title: string;
    description: string;
  };
  admin: {
    badge: string;
    title: string;
    description: string;
  };
}

export const translations: Record<Language, TranslationSchema> = {
  pt: {
    nav: {
      dashboard: 'Dashboard',
      nodes: 'Nós (Nodes)',
      agents: 'Agentes de IA',
      projects: 'Projetos',
      conversations: 'Conversas & Relays',
      downloads: 'Downloads & Instalador',
      audit: 'Auditoria & Logs',
      admin: 'Administração'
    },
    header: {
      brandSubtitle: 'Cloud Mesh Command Center',
      bootstrapAdmin: 'Admin Bootstrap: helpus.ecommerce@gmail.com'
    },
    dashboard: {
      badge: 'Painel Central NexosAI',
      title: 'Operação Distribuída & Malha de Agentes',
      description: 'O NexosAI Cloud coordena usuários, nós de execução, projetos, conversas por papel e instaladores locais com controle de segurança unificado.',
      stats: {
        nodesModel: { label: 'Modelos de Nós', value: '2 Tipos', note: 'Light Node (Relay) e Full Node (Bridge Local)' },
        relayCloud: { label: 'Relay Cloud', value: 'Inbox / Outbox', note: 'Roteamento seguro de mensagens entre dispositivos' },
        localExec: { label: 'Execução Local', value: 'AI Bridge', note: 'Ambiente local mantido seguro em 127.0.0.1:8765' },
        activeAgents: { label: 'Agentes de IA', value: 'Multi-LLM', note: 'GPT-4o, DeepSeek-R1 e Ollama Local' }
      },
      cloudRespTitle: 'Responsabilidades da Nuvem (Cloud)',
      cloudRespList: [
        'Autenticação Google Login & Permissões de Usuários',
        'Registro de Nós (Nodes), Heartbeats e Status ao Vivo',
        'Controle de Concessão de Papéis (Leases) para evitar Split-Brain',
        'Fila Inbox/Outbox para comunicação entre chats e extensões',
        'Gerenciamento de Downloads e Tokens de Instalação'
      ],
      localRespTitle: 'Responsabilidades Locais (Full Node)',
      localRespList: [
        'Gateway Local ativo em 127.0.0.1:8765 com Port-Guard',
        'Execução de comandos seguros em arquivos, Git e Terminal',
        'Extensão de Navegador para descoberta e relay de chats',
        'Processamento isolado sem comandos remotos arbitrários'
      ]
    },
    nodes: {
      badge: 'Malha de Dispositivos',
      title: 'Dispositivos e Nós Conectados',
      description: 'Cada nó opera como um relay leve no navegador ou como um executor completo com a AI Bridge local configurada.',
      contractTitle: 'Contrato de Funcionamento dos Nós (MVP)',
      contractList: [
        'Light Node: descobre chats, envia heartbeats e entrega mensagens via inbox/outbox.',
        'Full Node: realiza todas as funções do Light Node e executa ações locais seguras.',
        'Nenhum dispositivo é tratado como servidor único permanente.',
        'Nós offline podem reconectar sem bloquear os demais dispositivos da malha.'
      ]
    },
    agents: {
      badge: 'Gerenciador de Agentes',
      title: 'Agentes Autônomos de Inteligência Artificial',
      description: 'Crie e configure agentes de IA personalizados treinados com a base de conhecimento da sua empresa e integrados ao WhatsApp e Webchat.',
      newAgentBtn: 'Criar Novo Agente',
      configuredAgents: 'Agentes Configurados'
    },
    conversations: {
      badge: 'Relay de Mensagens',
      title: 'Conversas Roteadas por Papel',
      description: 'A extensão de navegador transforma cada chat em um endpoint. A nuvem decide para qual chat ativo rotear a mensagem com base na disponibilidade.',
      relayFlowTitle: 'Fluxo de Roteamento (Relay Flow)',
      relayFlowDesc: 'Chat A → Extensão A → NexosAI Cloud Inbox/Outbox → Extensão B → Chat B'
    },
    projects: {
      badge: 'Gestão de Projetos',
      title: 'Projetos e Ambientes de IA',
      description: 'Organize nós, agentes e conversas em projetos específicos da sua empresa com isolamento de contexto.'
    },
    downloads: {
      badge: 'Central de Downloads',
      title: 'Instaladores e Extensões NexosAI',
      description: 'Baixe a extensão oficial do navegador e o executável da AI Bridge local para habilitar o Full Node na sua máquina.'
    },
    audit: {
      badge: 'Trilha de Auditoria',
      title: 'Logs de Auditoria & Segurança',
      description: 'Registro imutável de todas as ações executadas pelos nós e agentes para garantia de compliance empresarial.'
    },
    admin: {
      badge: 'Administração',
      title: 'Configurações do Sistema NexosAI',
      description: 'Gerencie usuários, papéis (Roles), permissões globais e chaves de API da organização.'
    }
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      nodes: 'Nodes',
      agents: 'AI Agents',
      projects: 'Projects',
      conversations: 'Conversations',
      downloads: 'Downloads',
      audit: 'Audit Logs',
      admin: 'Admin'
    },
    header: {
      brandSubtitle: 'Cloud Mesh Command Center',
      bootstrapAdmin: 'Bootstrap Admin: helpus.ecommerce@gmail.com'
    },
    dashboard: {
      badge: 'NexosAI Command Center',
      title: 'Distributed Operation & Agent Mesh',
      description: 'NexosAI Cloud coordinates users, execution nodes, projects, role conversations, leases, and local installers with unified security controls.',
      stats: {
        nodesModel: { label: 'Node Models', value: '2 Types', note: 'Light Node (Relay) & Full Node (Local Bridge)' },
        relayCloud: { label: 'Relay Cloud', value: 'Inbox / Outbox', note: 'Secure message routing across devices' },
        localExec: { label: 'Local Execution', value: 'AI Bridge', note: 'Local environment kept secure on 127.0.0.1:8765' },
        activeAgents: { label: 'AI Agents', value: 'Multi-LLM', note: 'GPT-4o, DeepSeek-R1 & Local Ollama' }
      },
      cloudRespTitle: 'Cloud Responsibilities',
      cloudRespList: [
        'Google Auth Login & User Role Permissions',
        'Node Registration, Live Heartbeats, and Status Tracking',
        'Role Leases to prevent Split-Brain operational conflicts',
        'Inbox/Outbox Queue for messaging between chats and extensions',
        'Download Management & Installer Tokens'
      ],
      localRespTitle: 'Local Responsibilities (Full Node)',
      localRespList: [
        'Local Gateway active on 127.0.0.1:8765 with Port-Guard',
        'Controlled execution on files, Git, and local Terminal',
        'Browser extension for chat discovery and relaying',
        'Isolated execution without arbitrary remote commands'
      ]
    },
    nodes: {
      badge: 'Device Mesh',
      title: 'Connected Devices & Nodes',
      description: 'Each node operates as a light browser relay or as a full execution node with the local AI Bridge configured.',
      contractTitle: 'Node Operating Contract (MVP)',
      contractList: [
        'Light Node: discovers chats, sends heartbeats, and relays inbox/outbox messages.',
        'Full Node: performs all Light Node functions and executes safe local actions.',
        'No single device is treated as a permanent single point of failure.',
        'Offline nodes can reconnect without blocking other devices in the mesh.'
      ]
    },
    agents: {
      badge: 'Agent Manager',
      title: 'Autonomous AI Agents',
      description: 'Create and configure custom AI agents trained on your business knowledge base and integrated with WhatsApp and Webchat.',
      newAgentBtn: 'Create New Agent',
      configuredAgents: 'Configured Agents'
    },
    conversations: {
      badge: 'Message Relay',
      title: 'Role-Routed Conversations',
      description: 'The browser extension turns each chat into an endpoint. The cloud routes messages based on project, role lease, and node availability.',
      relayFlowTitle: 'Relay Flow Architecture',
      relayFlowDesc: 'Chat A → Extension A → NexosAI Cloud Inbox/Outbox → Extension B → Chat B'
    },
    projects: {
      badge: 'Project Management',
      title: 'AI Projects & Contexts',
      description: 'Organize nodes, agents, and conversations into specific projects with complete context isolation.'
    },
    downloads: {
      badge: 'Download Center',
      title: 'NexosAI Installers & Extensions',
      description: 'Download the official browser extension and local AI Bridge executable to enable Full Node capabilities.'
    },
    audit: {
      badge: 'Audit Trail',
      title: 'Audit Logs & Security',
      description: 'Immutable trail of all actions performed by nodes and AI agents to guarantee enterprise compliance.'
    },
    admin: {
      badge: 'Administration',
      title: 'NexosAI System Settings',
      description: 'Manage users, organization roles, global permissions, and API credentials.'
    }
  },
  es: {
    nav: {
      dashboard: 'Dashboard',
      nodes: 'Nodos (Nodes)',
      agents: 'Agentes de IA',
      projects: 'Proyectos',
      conversations: 'Conversaciones',
      downloads: 'Descargas',
      audit: 'Auditoría y Logs',
      admin: 'Administración'
    },
    header: {
      brandSubtitle: 'Cloud Mesh Command Center',
      bootstrapAdmin: 'Admin Bootstrap: helpus.ecommerce@gmail.com'
    },
    dashboard: {
      badge: 'Centro de Comando NexosAI',
      title: 'Operación Distribuida y Malla de Agentes',
      description: 'NexosAI Cloud coordina usuarios, nodos de ejecución, proyectos, conversaciones por rol e instaladores locales.',
      stats: {
        nodesModel: { label: 'Modelos de Nodos', value: '2 Tipos', note: 'Light Node (Relay) y Full Node (Bridge Local)' },
        relayCloud: { label: 'Relay Cloud', value: 'Inbox / Outbox', note: 'Enrutamiento seguro de mensajes entre dispositivos' },
        localExec: { label: 'Ejecución Local', value: 'AI Bridge', note: 'Entorno local seguro en 127.0.0.1:8765' },
        activeAgents: { label: 'Agentes de IA', value: 'Multi-LLM', note: 'GPT-4o, DeepSeek-R1 y Ollama Local' }
      },
      cloudRespTitle: 'Responsabilidades de la Nube (Cloud)',
      cloudRespList: [
        'Autenticación Google Login y Permisos de Usuario',
        'Registro de Nodos, Heartbeats y Estado en Vivo',
        'Control de Leases para evitar conflictos operacionales',
        'Cola Inbox/Outbox para comunicación entre chats y extensiones',
        'Gestión de Descargas y Tokens de Instalación'
      ],
      localRespTitle: 'Responsabilidades Locales (Full Node)',
      localRespList: [
        'Gateway Local activo en 127.0.0.1:8765 con Port-Guard',
        'Ejecución de acciones seguras en archivos, Git y Terminal',
        'Extensión de Navegador para descubrimiento y relay de chats',
        'Ejecución aislada sin comandos remotos arbitrarios'
      ]
    },
    nodes: {
      badge: 'Malla de Dispositivos',
      title: 'Dispositivos y Nodos Conectados',
      description: 'Cada nodo opera como un relay ligero en el navegador o como un ejecutor completo con la AI Bridge local configurada.',
      contractTitle: 'Contrato de Funcionamiento de Nodos (MVP)',
      contractList: [
        'Light Node: descubre chats, envía heartbeats y entrega mensajes vía inbox/outbox.',
        'Full Node: realiza todas las funciones de Light Node y ejecuta acciones locales seguras.',
        'Ningún dispositivo es tratado como servidor único permanente.',
        'Los nodos offline pueden reconectarse sin bloquear la operación.'
      ]
    },
    agents: {
      badge: 'Gestor de Agentes',
      title: 'Agentes Autónomos de Inteligencia Artificial',
      description: 'Cree y configure agentes de IA personalizados entrenados con la base de conocimientos de su empresa.',
      newAgentBtn: 'Crear Nuevo Agente',
      configuredAgents: 'Agentes Configurados'
    },
    conversations: {
      badge: 'Relay de Mensajes',
      title: 'Conversaciones Enrutadas por Rol',
      description: 'La extensión de navegador transforma cada chat en un punto de extremo.',
      relayFlowTitle: 'Flujo de Enrutamiento (Relay Flow)',
      relayFlowDesc: 'Chat A → Extensión A → NexosAI Cloud Inbox/Outbox → Extensión B → Chat B'
    },
    projects: {
      badge: 'Gestión de Proyectos',
      title: 'Proyectos y Ambientes de IA',
      description: 'Organice nodos, agentes y conversaciones en proyectos específicos.'
    },
    downloads: {
      badge: 'Centro de Descargas',
      title: 'Instaladores y Extensiones NexosAI',
      description: 'Descargue la extensión oficial del navegador y el ejecutable de la AI Bridge local.'
    },
    audit: {
      badge: 'Trilla de Auditoría',
      title: 'Logs de Auditoría y Seguridad',
      description: 'Registro inmutable de todas las acciones ejecutadas por nodos y agentes.'
    },
    admin: {
      badge: 'Administración',
      title: 'Configuración del Sistema NexosAI',
      description: 'Gestione usuarios, roles organizacionales y credenciales de API.'
    }
  }
};
