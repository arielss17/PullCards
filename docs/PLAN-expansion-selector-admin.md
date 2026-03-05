# PLAN: Onda 7.0 — Seletor de Expansão (Cover Flow) + Admin Creator

## Objetivo
Permitir ao **jogador** escolher a expansão antes de invocar (Cover Flow horizontal com capas) e ao **Admin** criar/editar expansões e monstros pela UI, incluindo upload seguro de imagens.

---

## 🛠️ Task Breakdown

### Onda 7.0 — Seletor de Expansão (Player UX)

#### 1. Backend: Rota de Listagem de Expansões para o Player
- `GET /api/expansions/active` → Retorna expansões com `featured: true` ou ativas, incluindo `name`, `id`, `coverImage`, e bônus disponível para o usuário logado.
- Injetar `bonusCharges` do usuário na resposta, lido do `EnergyService`.

#### 2. Frontend: Cover Flow Component (`index.html`)
- **Antes da Arena**, exibir um container horizontal scrollável com as "capas" das expansões.
- Cada card do Cover Flow mostra:
  - **Capa da Expansão** (imagem ou placeholder temático).
  - **Nome da Expansão**.
  - **Badge de Bônus** (🎁 se `bonusCharges > 0`).
- **Interação Touch/Mouse**: Swipe horizontal para navegar, tap para selecionar.
- Ao selecionar, o `PlayerSession.expansionId` é setado e a Arena de Summon é exibida.
- **Fallback**: Se houver apenas 1 expansão ativa, pular o Cover Flow e ir direto para a Arena.

#### 3. Frontend: Integração com PlayerSession
- Atualizar `player-session.js` para receber o `expansionId` dinamicamente do Cover Flow em vez de usar valor fixo.
- Atualizar `index.html` para passar `state.expansionId` em todas as chamadas de `ApiClient.post('/api/collection/:id/roll')`.

#### 4. CSS/Responsivo (Mobile-First)
- Cover Flow deve funcionar perfeitamente em portrait (vertical).
- Touch targets mínimo 44x44px.
- Animação suave de scroll snap (`scroll-snap-type: x mandatory`).

---

### Onda 7.5 — Admin: Criar Expansão + Monstros pela UI

#### 5. Frontend Admin: Botão "Criar Expansão"
- Na aba de Gerenciamento de Expansões, adicionar botão "➕ Nova Expansão".
- Modal/Formulário com campos: `name`, `description`, `coverImage` (upload), `bonusSummonsQty`, `loginDeadline`.
- Ao salvar, chama `POST /api/expansions` que cria o registro em `expansions.json` e o arquivo `.json` vazio da expansão.

#### 6. Backend: Upload Seguro de Imagens
- Nova rota `POST /api/uploads` para receber imagens (capa de expansão, arte de monstro).
- **Segurança:**
  - Validar MIME type (apenas `image/png`, `image/jpeg`, `image/webp`).
  - Limitar tamanho máximo (ex: 2MB).
  - Sanitizar nome do arquivo (slug + UUID).
  - Salvar em `data/uploads/` com subpastas por expansão.
  - Servir estaticamente via Express (`/uploads/`).
- Usar `multer` como middleware de upload.

#### 7. Frontend Admin: Criar/Editar Monstro no Bestiário
- Na aba Bestiário (com a expansão selecionada no dropdown), adicionar botão "➕ Novo Monstro".
- Formulário inline ou modal com:
  - Nome, Tipo, CR, HP, AC, Stats (STR/DEX/CON/INT/WIS/CHA)
  - Tier (dropdown das tiers configuradas)
  - Tabelas (checkboxes das mesas configuradas)
  - Imagem (upload via rota `/api/uploads`)
  - Habilidades e Ações (textarea JSON ou campos dinâmicos)
- Ao salvar, injeta no array `cards` do arquivo `.json` da expansão ativa.
- Edição: Clicar num monstro existente abre o mesmo formulário preenchido.

#### 8. Backend: CRUD de Monstros por Expansão
- `POST /api/expansions/:id/monsters` → Adicionar monstro ao `.json`.
- `PUT /api/expansions/:id/monsters/:monsterId` → Editar monstro.
- `DELETE /api/expansions/:id/monsters/:monsterId` → Remover monstro.

---

## 🧪 Verificação

### Onda 7.0
- [ ] Cover Flow renderiza todas as expansões ativas.
- [ ] Badge de bônus aparece corretamente.
- [ ] Selecionar uma expansão inicia o Summon com o `expansionId` correto.
- [ ] Funciona corretamente em mobile (touch swipe).
- [ ] Se só houver 1 expansão, pula direto para a Arena.

### Onda 7.5
- [ ] Admin cria nova expansão pela UI com sucesso.
- [ ] Upload de capa funciona e a imagem é exibida.
- [ ] Admin cria novo monstro dentro da expansão.
- [ ] Admin edita monstro existente.
- [ ] Upload de imagem rejeita arquivo inválido (>2MB, tipo errado).
- [ ] Monstros criados aparecem corretamente no summon.

---

## 🎼 Agentes Sugeridos
- **orchestrator**: Coordenação dos agentes e verificação dos resultados.
- **frontend-specialist**: Cover Flow, formulários, responsividade.
- **backend-specialist**: Rotas CRUD, upload seguro com `multer`.
- **security-auditor**: Validação do upload (MIME, tamanho, sanitização).
- **clean-code-specialist**: Refatoração do código para melhor legibilidade e manutenibilidade.
- **node-js-specialist**: Refatoração do código para melhor legibilidade e manutenibilidade.

