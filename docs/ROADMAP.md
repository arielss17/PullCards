# 🗺️ PullCards — Roadmap & TODO (Ondas 7+)

> **Documento vivo.** Atualize os checkboxes conforme as features forem implementadas.
> PLANs detalhados de cada onda ficam em `docs/PLAN-*.md`. PLANs concluídos ficam em `docs/done/`.

---

## ✅ Ondas Concluídas (1–6)

Referência rápida do que já foi construído:

| Onda | Escopo | Status |
|------|--------|--------|
| 1.0 | Layout base, autenticação, painel admin | ✅ Done |
| 2.0 | Collection TCG, modal de carta, critical hits admin | ✅ Done |
| 3.0 | Refactoring (frontend cleanup + backend Clean Architecture) | ✅ Done |
| 3.5–3.7 | Sistema de Expansões, configs por expansão, deadline de bônus | ✅ Done |
| 4.0 | Dual Currency (energia 8h + bônus por expansão) | ✅ Done |
| 5.0–5.7 | Summon backend, Estúdio visual, i18n, narrations, visual intensity | ✅ Done |
| 6.0 | Drop Rates individuais (weighted random) | ✅ Done |

---

## 🔴 Onda 7.0 — Seletor de Expansão (Cover Flow)
**PLAN:** `docs/PLAN-expansion-selector-admin.md`

- [ ] Backend: Rota `GET /api/expansions/active` com bônus do usuário
- [ ] Frontend: Cover Flow horizontal com capas das expansões
- [ ] Frontend: Badge de bônus 🎁 visível na capa
- [ ] Frontend: Integrar `PlayerSession.expansionId` com a seleção do Cover Flow
- [ ] Frontend: Fallback automático se só houver 1 expansão
- [ ] CSS: Scroll snap + animações touch-friendly
- [ ] Mobile: Validar touch targets ≥ 44px e swipe suave

---

## 🔴 Onda 7.5 — Admin: Criar Expansão + Monstros via UI
**PLAN:** `docs/PLAN-expansion-selector-admin.md`

- [ ] Frontend Admin: Botão "➕ Nova Expansão" com modal/formulário
- [ ] Backend: Upload seguro de imagens (`multer`, MIME validation, 2MB limit, sanitização)
- [ ] Backend: Rota `POST /api/uploads` + servir estáticos em `/uploads/`
- [ ] Frontend Admin: Formulário de criar/editar monstro no Bestiário
- [ ] Backend: CRUD de monstros (`POST/PUT/DELETE /api/expansions/:id/monsters`)
- [ ] Verificação: Monstros criados pela UI aparecem corretamente no summon

---

## 🟡 Onda 8.0 — Temas Visuais por Expansão
**PLAN:** A criar quando Onda 7 estiver concluída.

- [ ] Admin Estúdio: Campos de tema (paleta primary/secondary/accent, background)
- [ ] Admin Estúdio: Upload de capa da expansão (Cover Art)
- [ ] Admin Estúdio: Upload de background da arena de summon
- [ ] Admin Estúdio: Seleção de fonte customizada (Google Fonts ou upload)
- [ ] Engine: Ao iniciar summon, sobrescrever CSS vars (`:root`) com tokens da expansão
- [ ] Frontend: Cover Flow exibe a capa real da expansão
- [ ] Mobile: Verificar performance com assets carregados (lazy loading)

---

## 🟡 Onda 8.5 — Auditoria Mobile-First
**PLAN:** A criar.

- [ ] Audit completo com `mobile_audit.py` em todas as telas
- [ ] Touch targets: Todos os botões ≥ 44x44px
- [ ] Viewport: Prevenir zoom acidental durante o ritual
- [ ] Arena: Layout portrait otimizado (dados/narração/carta em coluna)
- [ ] Admin: Abas colapsáveis em accordion no mobile
- [ ] Performance: Lazy loading de imagens de monstro
- [ ] Performance: Compressão de assets de capa (WebP)

---

## 🟢 Onda 9.0 — Experiência RPG (Imersão UX)
**PLAN:** A criar.

- [ ] Tipografia RPG: Fontes serifadas (Cinzel/MedievalSharp) nos títulos e narração
- [ ] Efeitos sonoros: Sons de páginas virando, selos quebrando, portal abrindo
- [ ] Transições: Fade com partículas de magia entre fases (D100 → D20 → Resultado)
- [ ] Selo de Tier: Badge dourado/prata estampado como lacre de cera na carta
- [ ] Vibração: `navigator.vibrate()` no critical hit (mobile)
- [ ] Animações: Micro-interações nos botões e transições de estado

---

## 🟢 Onda 10.0 — Dados 3D (O Sonho)
**PLAN:** A criar.

- [ ] D100 visual: Dois D10 rolando (dezena 00-90 + unidade 0-9, "00"+"0" = 100)
- [ ] D20 visual: Dado icosaédrico girando
- [ ] Fase 1 (CSS 3D): Dados pseudo-3D com `perspective` + `rotateX/Y/Z`
- [ ] Fase 2 (WebGL): Migrar para `dice-box` ou Three.js se o jogo crescer
- [ ] Interação touch: Segurar e arremessar dados na tela (stretch goal)

---

## 📌 Requisitos Transversais (Aplicar em TODAS as Ondas)

| Requisito | Disciplina |
|-----------|-----------|
| Mobile-first em toda feature nova | UX |
| Clean Code + SRP nos arquivos novos | Backend/Frontend |
| i18n em toda string nova | Localização |
| Upload seguro (MIME, tamanho, sanitização) | Segurança |
| Testes de aleatoriedade após mudanças no summon | QA |
