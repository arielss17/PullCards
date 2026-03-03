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
- [ ] **DB/Schema**: Criar `data/expansions.json` contendo um array de expansões.
    - Campos obrigatórios: `id`, `name`, `file` (ex: `monsters_dnd5e.json`), `featured` (boolean), `createdAt`.
    - Campos de Configuração: `config` (tables de probabilidade, cores de tiers customizados).
    - Metadados: `summonExperience` (falas dinâmicas) e `bonus` (qtd cargas bônus + `expiresAt`).
- [ ] **Módulo Base**: Extrair o atual `data/monsters_game.json` e cadastrá-lo internamente como a expansão padrão (D&D 5e).
- [ ] **Backend (Admin)**: Criar arquivo e rota separada `server/routes/expansions.js` contendo o CRUD (Create, Read, Update, Delete).
- [ ] **Frontend (Admin)**: Criar uma nova aba no Painel Admin (`admin.html` / `admin.js`) dedicada exclusivamente ao gerenciamento visual das expansões.
- [ ] **Backend (User)**: Atualizar a modelagem/Repository do `User` com o campo `expansionBonus` aninhado. (Ex: `{"dnd5e": { charges: 3, claimedAt: ... }}`).

### 🌊 Onda 4: Cargas Bônus por Expansão (Dual Currency)
A moeda secundária que prioriza descontar o bônus antes da energia de 8h.
- [ ] **Service/Auth**: Adicionar ao ciclo de Autenticação/Login um validador: Se a expansão tem um bônus ativo (`expiresAt > hoje`) e o jogador ainda não resgatou na chave `expansionBonus`, **transferir as charges bônus para ele** e registrar o `claimedAt`.
- [ ] **Backend (EnergyService)**: Refatorar `EnergyService.consumeEnergy(user, expansionId)` para ler o contexto da expansão chamada.
    - Se o jogador tiver bônus para aquele `expansionId` > 0, consumir -1 do bônus.
    - Senão, consumir -1 da energia regular.
    - Se ambos estiverem < 1, barrar (HTTP 403 HTTP 403).
- [ ] **Frontend (Header UI)**: Adicionar um widget dinâmico 🎁 ao lado da contagem normal ⚡: "🎁 X Bônus".
    - Regra: O widget só aparece se a expansão atual no dropdown do usuário possuir bônus para ele. Ocultar caso zero.

### 🌊 Onda 5: Summon Experience Dinâmico
Metadados estéticos que controlam a roleta. As cores de Incomum a Lendário não serão mais hardcoded.
- [ ] **SummonEngine/Config**: Garantir que as lógicas dinâmicas contidas em `logic.js` consumam o objeto `config` extraido do `expansions.json` em vez do servidor monolítico atual.
- [ ] **UI Aesthetics**: Mapear as variáveis CSS do front (`--table-color`, etc.) via Javascript lendo as definições da expansão escolhida na chamada da API.
- [ ] **Narrativa**: No `logic.js`, extrair a string da animação inicial (`typeNarration()`) de `/locales` (i18n) e permitir overwrite via campo `expansion.summonExperience.introText`.

### 🌊 Onda 6: Experiência do Jogador (Player UX)
O funil de entrada e organização da coleção final.
- [ ] **Frontend (Index)**: Tela de Boot. Adicionar um modal inicial no menu que obrigue o jogador a escolher uma expansão entre as ativas (pré-selecionando a `featured = true`), antes de ir pro altar de invocação.
- [ ] **Frontend (Collection)**: Refatorar o renderizador da `collection.html`. As cartas precisam ser quebradas por sessões (`<div class="expansion-block">`).
- [ ] **Mistério (Missings)**: Todas as cartas das expansões ativas que o jogador não obteve devem aparecer opacas. As que ele possui, visíveis.

---

## ✅ Socratic Gate (Validações para Iniciarmos)
Antes de iniciarmos o `/create`, eu preciso esclarecer dois pontos arquiteturais cruciais baseados em `[nodejs-best-practices]`:

1. No Banco de Dados atual temos uma separação brutal entre "Onde estão os arquivos de cartas" vs "Onde está o config global da mesa". Hoje as probabilidades e _Tiers_ estão em `admin_config.json`. Com esse novo plano (Onda 3), devemos:
   - **Opção A:** Mover toda as Configurações de Mesas, Probabilidades e Cores pro novo arquivo modular `expansions.json` deixando o Admin gerenciar probabilidade **por expansão**.
   - **Opção B:** Centralizar o `admin_config.json` valendo para TODAS as expansões universalmente, e o `expansions.json` guardar apenas o caminho das cartas e o bônus.

2. Ao invocar, o jogador terá selecionado uma expansão. As cartas geradas no backend e inseridas em seu perfil no disco devem receber um "Carimbo" invisível dessa expansão (`source: "dnd5e"`) e gravadas num array único da coleção, ou devemos apartar os arrays no arquivo da coleção (ex: `colecao_usuario { dnd5e: [cartas], pokemon: [cartas] }`)?

---

**[OK] Plan created: docs/PLAN-expansions-system.md**

Next steps:
- Revise o plano e responda às duas perguntas metodológicas acima (A/B e Carimbo/Silos).
- Execute `/create` especificando as suas decisões.
