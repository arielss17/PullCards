# Planning: Codebase Cleanup & Refactoring

## Objective
Realizar uma revisão técnica baseada nos princípios de Clean Code (SRP, DRY, KISS) para identificar acoplamentos, duplicações e criar um roteiro de melhorias para a manutenibilidade do projeto `PullCards`. 

**Nota:** Este documento apenas aponta as falhas e propõe arquiteturas. Nenhuma alteração de código foi feita ainda.

---

## 🚨 Principais Falhas Identificadas (Clean Code Violations)

### 1. `admin.js` — O "God Object" (Violação SRP)
* **Problema:** O arquivo possui mais de 600 linhas dentro de um único bloco `DOMContentLoaded`. Ele acumula responsabilidades de:
  1. Renderização de UI (criando HTML via templates literais para Mesas, Tiers, Bestiário).
  2. Gerenciamento de Estado (`let config`, `let monsters`).
  3. Requisições de API HTTP (`fetch` diretos).
  4. Lógica de tradução e manipulação do DOM de i18n.
* **Proposta de Refatoração:** Quebrar em módulos menores.
  - `admin-api.js`: Apenas os `fetch()` para endpoints.
  - `admin-ui.js`: Lógica de renderização (Tiers, Mesas, Monstros).
  - `admin-state.js`: Guarda e expõe os objetos `config` e `monsters`.

### 2. `logic.js` — Escopo Inchado (Violação de SRP e YAGNI)
* **Problema:** Mistura a lógica core de RNG (geração de números aleatórios e tabelas) com gerenciamento de estado da sessão do front-end (`createGameState`, `deductEnergy`, `performSummon`). Pior, possui funções criadas apenas para debug/desenvolvimento que estão sendo enviadas para produção: `testDistribution`.
* **Proposta de Refatoração:** 
  - Limpar `testDistribution` do código final (YAGNI / Boy Scout).
  - Extrair o `GameState` e `Energy` para um módulo de gerência local (ex: `player-session.js`), mantendo em `logic.js` apenas o `SummonEngine` puro (dados e probabilidades).

### 3. Chamadas de API Espalhadas (Violação DRY)
* **Problema:** Os arquivos `.js` do front-end (`profile.js`, `collection-page.js`, `admin.js`) realizam chamadas `fetch` brutas com `headers` literais (`x-user-email`) e tratamento de erro repetitivo.
* **Proposta de Refatoração:** Centralizar todas as chamadas de rede num serviço `HttpClient` (ou expandir o `MonsterAPI`) que injete dados de Auth automaticamente e trate os blocos de `try/catch` padrão.

### 4. `server.js` — Lógicas de Regra de Negócio na Camada de Roteamento
* **Problema:** O arquivo principal do servidor injeta defaults para `criticalRules` e `customTiers` (linhas gigantescas de fallback) diretamente na rota ou inicialização. A camada de servidor deveria apenas rotear.
* **Proposta de Refatoração:** Extrair a lógica de validação do JSON de configuração para um arquivo de Controller ou Service (ex: `configService.js`).

---

## 🗺️ Mapa de Ação Recomendado (Próximos Passos)

1. **Fase 1: Extração de Camada de Rede (API)**
   - Criar `api-client.js`.
   - Substituir os `fetch` espalhados no front-end por chamadas centralizadas.
2. **Fase 2: Desmembramento do Painel Admin**
   - Refatorar `admin.js` para usar funções exportadas (modularização ES6 se suportado, ou padrão Factory), separando a UI do Estado.
3. **Fase 3: Limpeza Estrita**
   - Remover métodos `/dev` como `testDistribution`.
   - Substituir injeções massivas de `innerHTML` no front-end por componentes ou clonagem de `<template>` (para evitar falhas eventuais de segurança/fuga de HTML e facilitar manutenção).

## Checklist de Verificação Futura
- [ ] Nenhum arquivo `.js` de front possui mais do que 300 linhas de código.
- [ ] Todas as chamadas de rede partem de uma única classe/objeto.
- [ ] Lógica central isolada da manipulação do DOM.
