# PLAN: Sistema de Expansões (Ondas 3 a 6)

## Objetivo
Implementar o Sistema de Expansões para o PullCards de acordo com o `brainstorm_todo.md`. O objetivo é criar uma arquitetura modular ("Onda 3") que permita adicionar cartas personalizadas, regras estéticas dinâmicas de invocação ("Onda 5") e gerenciar bônus de energia separados ("Onda 4") para cada expansão, finalizando com a experiência do jogador ("Onda 6").

---

## 🎼 Orquestração de Agentes
1. **project-planner**: Desenho e validação do fluxo e da arquitetura do plano.
2. **backend-specialist**: Implementação do CRUD no servidor, endpoints e gerenciamento do estado em `users.json` e `expansions.json`.
3. **database-architect**: Expansão do schema atual no `User` (campo `expansionBonus`) e do sistema de arquivos (`expansions.json`).
4. **frontend-specialist**: Criação das interfaces (Admin UI para CRUD de expansão, header com cargas bônus e tela de seleção para jogadores).
5. **test-engineer**: Validação ponta a ponta (Consumo da energia dual, UI estourando corretamente).

---

## 🛠️ Task Breakdown (Ondas)

### 🌊 Onda 3: Sistema de Expansões (Fundação)
A infraestrutura básica para suportar múltiplos "jogos" dentro do PullCards.
- [X] **DB/Schema**: Criar `data/expansions.json` contendo um array (o Registro de Expansões).
    - Campos obrigatórios no Registro: `id`, `name`, `file` (ex: `monsters_dnd5e.json`), `featured` (boolean).
    - Campos de Bônus no Registro: `bonusSummonsQty` (qtd de cargas) e `loginDeadline` (data limite para resgate).
- [X] **Arquivo Dedicado da Expansão (`{file}.json`)**: Além do array de `cards`, este arquivo passará a ser a fonte da verdade de sua própria expansão, contendo os nós de metadados:
    - `"config"`: (tables de probabilidade, customTiers).
    - `"summonExperience"`: (falas dinâmicas, cores, introText).
- [X] **Módulo Base**: Extrair o atual `data/monsters_game.json` e cadastrá-lo internamente como a expansão padrão (D&D 5e).
- [X] **Backend (Admin)**: Criar arquivo e rota separada `server/routes/expansions.js` contendo o CRUD (Create, Read, Update, Delete).
- [X] **Frontend (Admin)**: Criar uma nova aba no Painel Admin (`admin.html` / `admin.js`) dedicada exclusivamente ao gerenciamento visual das expansões.
- [X] **Backend (User)**: Atualizar a modelagem/Repository do `User` com o campo `expansionBonus` aninhado. (Ex: `{"dnd5e": { charges: 3, claimedAt: ... }}`).

## Patch Onda 3.6 — Contexto Frontend (API e Bestiário Admin)
Apesar do backend já separar por expansões, o frontend (`api.js`) ainda está fixo no arquivo padrão.
- [ ] Frontend `api.js`: Remover hardcode de `LOCAL_DATA` e passar a receber o objeto da expansão atual para construir o link dinamicamente.
- [ ] Frontend Admin: Fazer a aba "Bestiário" também respeitar o Dropdown de Expansões (recarregar a lista de monstros correta).

### 🌊 Onda 4: Cargas Bônus por Expansão (Dual Currency)
A moeda secundária que prioriza descontar o bônus antes da energia de 8h.
- [ ] **Service/Auth**: Adicionar ao ciclo de Autenticação/Login um validador: Se a expansão tem um bônus ativo (`expiresAt > hoje`) e o jogador ainda não resgatou na chave `expansionBonus`, **transferir as charges bônus para ele** e registrar o `claimedAt`.
- [ ] **Backend (EnergyService)**: Refatorar `EnergyService.consumeEnergy(user, expansionId)` para ler o contexto da expansão chamada.
    - Se o jogador tiver bônus para aquele `expansionId` > 0, consumir -1 do bônus.
    - Senão, consumir -1 da energia regular.
    - Se ambos estiverem < 1, barrar (HTTP 403 HTTP 403).
- [ ] **Frontend (Header UI)**: Adicionar um widget dinâmico 🎁 ao lado da contagem normal ⚡: "🎁 X Bônus".
    - Regra: O widget só aparece se a expansão atual no dropdown do usuário possuir bônus para ele. Ocultar caso zero.

### 🌊 Onda 5: Summon Experience Dinâmico e "Aba Estúdio"
Metadados estéticos que controlam a roleta. As cores de Incomum a Lendário e textos narrativos serão customizáveis via Admin UI.
- [ ] **Admin UI (Aba Estúdio)**: Criar uma 5ª aba no painel Admin (Estúdio) dedicada ao visual da expansão.
    - Seleção de expansão via dropdown.
    - Campos de texto nativo para o Texto de Introdução (`introText`).
    - Gerenciamento dinâmico de Cores do Palco (Fundo Geral, Aura de Invocação).
    - Sub-tabela para gerenciar Tiers Customizadas (Nome, Chance %, Cores de Partículas Ouro/Prata).
- [ ] **Backend (Update Config)**: Criar ou expandir rotas do `api/config` para salvar as propriedades estéticas no arquivo `.json` da expansão selecionada (dentro do nó `summonExperience` e `config`).
- [ ] **Engine Aesthetics**: Mapear as variáveis CSS do front (`--table-color`, partículas) via Javascript lendo as definições da expansão atual na chamada da API, sem usar CSS/JS hardcoded.
- [ ] **Narrativa**: No `logic.js` (ou `index.html`), extrair a string da animação inicial (`typeNarration()`) permitindo overwrite via campo `expansion.summonExperience.introText`.

### 🌊 Onda 6: Experiência do Jogador (Player UX)
O funil de entrada e organização da coleção final.
- [ ] **Frontend (Index)**: Tela Inicial (Summon). O jogador precisa ter um seletor (dropdown ou cover flow) para escolher em qual expansão ele vai gastar sua energia. (Garante que o rolar consuma do Silo correto).
- [ ] **Frontend (Collection)**: Refatorar o renderizador da `collection.html`. As cartas precisam ser navegadas com base na expansão escolhida num dropdown no topo (exibindo o "Silo" isolado).
- [ ] **Frontend (Collection)**: Refatorar o renderizador da `collection.html`. As cartas precisam ser quebradas por sessões (`<div class="expansion-block">`).
- [ ] **Mistério (Missings)**: Todas as cartas das expansões ativas que o jogador não obteve devem aparecer opacas. As que ele possui, visíveis.

---

## ✅ Socratic Gate (Validações para Iniciarmos)
Antes de iniciarmos o desenvolvimento da Onda 3, esclarecendo pontos baseados em `@[nodejs-best-practices]`:

1. ~~**[RESOLVIDO] Onde guardar as configurações (Tiers/Mesas)?**~~
   - **Decisão Arquitetural:** Abordagem descentralizada. O `expansions.json` servirá apenas como um catálogo/índice (contendo a referência do arquivo, qual é a 'featured', e os dados de bônus/deadline). Todo o payload pesado (Probabilidades, Tiers, Textos de Invocação e Cartas) residirá exclusivamente no arquivo `{file}.json` de cada expansão.

2. ~~**[RESOLVIDO] Como estruturar o armazenamento das cartas conquistadas pelo usuário?**~~
   - **Decisão Arquitetural:** Silos Isolados. Cada expansão terá o seu próprio array dentro de `collection.cards`. (ex: `colecao_usuario: { "dnd5e": [cartas], "pokemon": [cartas] }`).

---

**[OK] Plan updated: docs/PLAN-expansions-system.md**

Next steps:
- Responda sobre a estrutura da coleção (Pergunta 2: Array Único Carimbado vs Silos Isolados).
- Após essa resposta, iniciaremos imediatamente a execução (Onda 3).
