

# Plano: Sistema de Notificações Avançado - Central de Atividades

## Objetivo
Transformar o sistema de notificações atual em uma **Central de Atividades** completa, similar ao feed de atividades do Instagram, onde o usuário tem acesso a todo histórico de eventos relevantes com navegação dedicada, filtros, e notificações mais completas.

---

## Arquitetura Proposta

```text
+----------------------------------+
|       Header do Dashboard        |
|  [Sino] Badge → Popover Resumido |
|         + Link "Ver tudo"        |
+----------------------------------+
              |
              v
+----------------------------------+
|    /cliente/notificacoes         |
|    /montador/notificacoes        |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  |  Filtros por Categoria    |  |
|  |  [Todos] [Jobs] [Pagam.]  |  |
|  |  [Negoc.] [Sistema]       |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  |  Feed de Atividades       |  |
|  |  - Agrupado por data      |  |
|  |  - Cards visuais ricos    |  |
|  |  - Scroll infinito        |  |
|  |  - Indicador de lido      |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

---

## Componentes a Criar/Modificar

### 1. Nova Página: Central de Notificações

**Arquivo:** `src/pages/Notificacoes.tsx`

**Funcionalidades:**
- Lista completa de notificações com scroll infinito (paginação de 20 em 20)
- Agrupamento por período (Hoje, Ontem, Esta semana, Este mês, Anteriores)
- Filtros por tipo de notificação (tabs ou chips)
- Cards visuais com ícones coloridos por categoria
- Botão "Marcar todas como lidas" no topo
- Navegação ao clicar em cada notificação
- Estado vazio com ilustração quando não há notificações

### 2. Componente de Card de Notificação Rico

**Arquivo:** `src/components/NotificationCard.tsx`

**Características:**
- Ícone colorido por tipo (usando cores do sistema)
- Título em destaque + descrição secundária
- Timestamp relativo (há 5 minutos, há 1 hora, etc.)
- Indicador visual de não lida (borda ou fundo destacado)
- Foto do usuário relacionado quando disponível (montador/cliente)
- Ação rápida se aplicável (ex: "Ver Orçamento", "Responder")

### 3. Hook de Notificações Aprimorado

**Arquivo:** `src/hooks/useNotificationsRealtime.tsx` (modificar)

**Melhorias:**
- Paginação com `cursor-based` ou offset
- Filtro por tipo
- Cache inteligente
- Contador separado por categoria

### 4. Componente NotificationCenter Atualizado

**Arquivo:** `src/components/NotificationCenter.tsx` (modificar)

**Mudanças:**
- Adicionar link "Ver tudo" no footer do popover
- Preview limitado a 5 notificações no popover
- Visual mais compacto para mobile

---

## Eventos a Adicionar (Notificar Ambas as Partes)

Atualmente, algumas ações só notificam uma parte. A proposta é garantir que **cliente e montador sempre recebam notificações relevantes**:

| Evento | Cliente | Montador | Status Atual |
|--------|---------|----------|--------------|
| Novo job criado | - | OK | Funciona |
| Nova candidatura | OK | - | Funciona |
| Negociação iniciada | - | OK | Funciona |
| Orçamento enviado | OK | - | Funciona |
| Orçamento aceito | - | OK | Funciona |
| Contra-proposta | - | OK | Funciona |
| Pagamento confirmado | OK | OK | Funciona |
| OS criada | ADICIONAR | ADICIONAR | Falta |
| OS iniciada | ADICIONAR | - | Falta |
| OS concluída | ADICIONAR | ADICIONAR | Falta |
| Avaliação recebida | - | ADICIONAR | Falta |
| Garantia ativada | ADICIONAR | ADICIONAR | Falta |
| Saque processado | - | OK | Funciona |

---

## Estrutura de Arquivos

```text
src/
├── pages/
│   └── Notificacoes.tsx          (NOVA - página central)
├── components/
│   ├── NotificationCenter.tsx    (MODIFICAR - adicionar link "Ver tudo")
│   ├── NotificationCard.tsx      (NOVO - card visual rico)
│   └── NotificationFilters.tsx   (NOVO - filtros por categoria)
├── hooks/
│   └── useNotificationsRealtime.tsx (MODIFICAR - paginação e filtros)
└── lib/
    └── notificationsService.ts   (MODIFICAR - adicionar novos eventos)

supabase/
└── migrations/
    └── XXXXXX_adicionar_eventos_notificacao.sql (NOVA)
```

---

## Migração de Banco de Dados

Criar/atualizar triggers para novos eventos:

1. **Trigger `notify_os_created`**: Quando OS é criada, notificar cliente e montador
2. **Trigger `notify_os_status_change`**: Quando status da OS muda (iniciada, concluída)
3. **Trigger `notify_new_avaliacao`**: Quando avaliação é criada, notificar montador
4. **Trigger `notify_garantia_ativada`**: Quando garantia é ativada

---

## Rotas a Adicionar

```typescript
// Em App.tsx
<Route path="/cliente/notificacoes" element={
  <ProtectedRoute requiredRole="client">
    <Notificacoes />
  </ProtectedRoute>
} />
<Route path="/montador/notificacoes" element={
  <ProtectedRoute requiredRole="montador">
    <Notificacoes />
  </ProtectedRoute>
} />
```

---

## UX/UI - Design da Central de Notificações

### Layout Mobile-First

```text
+--------------------------------+
|  <- Voltar      Notificações   |
+--------------------------------+
|  [Todas] [Jobs] [Pagam.] ...  |
+--------------------------------+
|                                |
|  HOJE                          |
|  +---------------------------+ |
|  | [💰] Pagamento recebido   | |
|  |     R$ 150,00 - Montag... | |
|  |     há 2 horas            | |
|  +---------------------------+ |
|  | [📋] Nova OS atribuída    | |
|  |     Mesa de jantar        | |
|  |     há 3 horas            | |
|  +---------------------------+ |
|                                |
|  ONTEM                         |
|  +---------------------------+ |
|  | [🔔] Orçamento aceito     | |
|  |     Cliente confirmou...  | |
|  |     há 1 dia              | |
|  +---------------------------+ |
|                                |
+--------------------------------+
```

### Cores por Categoria

- **job**: Roxo (#8B5CF6) - Briefcase icon
- **negociacao**: Azul (#3B82F6) - MessageSquare icon  
- **pagamento**: Verde (#22C55E) - DollarSign icon
- **saque**: Laranja (#F97316) - Wallet icon
- **sistema**: Cinza (#6B7280) - Bell icon
- **os**: Ciano (#06B6D4) - ClipboardCheck icon

---

## Detalhes Técnicos

### Paginação no Hook

```typescript
// useNotificationsRealtime.tsx
const fetchNotifications = async (page = 0, tipo?: string) => {
  const limit = 20;
  const offset = page * limit;
  
  let query = supabase
    .from('notificacoes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
    
  if (tipo && tipo !== 'todos') {
    query = query.eq('tipo', tipo);
  }
  
  return query;
};
```

### Agrupamento por Data

```typescript
const groupByDate = (notifications) => {
  const groups = {
    hoje: [],
    ontem: [],
    estaSemana: [],
    esteMes: [],
    anteriores: []
  };
  // Lógica de agrupamento com date-fns
  return groups;
};
```

---

## Resumo das Entregas

1. **Página `/cliente/notificacoes` e `/montador/notificacoes`** - Central de atividades completa
2. **Componentes visuais** - Cards ricos com categorização visual
3. **Filtros por tipo** - Navegar entre categorias de notificações
4. **Scroll infinito** - Carregar mais conforme rola
5. **Novos eventos** - OS criada, concluída, avaliação recebida
6. **Link "Ver tudo"** - No popover do header para acessar central
7. **Triggers de banco** - Garantir notificações bilaterais

