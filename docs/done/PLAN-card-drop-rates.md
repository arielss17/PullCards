# PLAN-card-drop-rates.md

## 🧠 Brainstorm: Card Specific Drop Rates (Math.random within Tiers)

### Context
Atualmente, o D20 define a **Tier** (ex: Rara, Lendária). Uma vez que a Tier é decidida, o `SummonService.js` filtra todas as cartas daquela Tier e tabela, e sorteia **igualmente** entre elas (1 em X). O objetivo é manter a essência do D20 para definir a Tier, mas permitir que o Admin configure "Pesos" ou "Chances Individuais" para cada monstro dentro da sua própria Tier.

---

### Option A: Algoritmo de Pesos Relativos (Weight-based Pool)
Cada monstro recebe uma propriedade `dropWeight` (ex: 10, 50, 100).
Para sortear, o sistema soma o `dropWeight` de todas as cartas válidas daquela Tier.
Ex: [Dragão A (peso 10), Dragão B (peso 90)] = Total 100.
Um número aleatório de 1 a 100 sorteia: 1-10 cai Dragão A, 11-100 Dragão B.

✅ **Pros:**
- Extremamente robusto e à prova de falhas matemáticas (não exige que as porcentagens somem exatamente 100%).
- Fácil para o administrador: "Quero que o Pidgey caia 10x mais que o Pikachu" (Pesos 100 e 10).
- Fallback automático: Se cartas não tiver peso, recebem `weight: 10` como padrão, dividindo igualmente o restante da pizza.

❌ **Cons:**
- O admin não enxerga a "porcentagem exata" diretamente no arquivo `json`, ele enxerga um número de proporção (peso).

📊 **Effort:** Low

---

### Option B: Probabilidade Decimal Estrita (Percentage-based)
Cada monstro recebe uma propriedade `dropChance` (ex: 0.15 para 15%).
Para sortear, o sistema gera `Math.random()`. Entretando, o sistema precisa normalizar caso a soma total das cartas da Tier R não dê 100% exatos.

✅ **Pros:**
- Visão matemática exata ("Dragão Vermelho tem 1% de chance de cair se rolar o D20").

❌ **Cons:**
- Muito frágil. Se o Admin errar a matemática e a soma das cartas ativas der 95% ou 110%, o algoritmo precisa de heurísticas de normalização pesadas para não bugar o retorno nulo (undefined).
- Mais complexo aplicar o fallback "dividir o resto igualmente" em fatias decimais quebradas.

📊 **Effort:** Medium

---

## 💡 Recommendation
**Option A (Algoritmo de Pesos Relativos)** porque ele atende perfeitamente ao seu pedido de "dividir igualmente as chances do que sobrar (fallback)", uma vez que pesos matemáticos não lidam com teto de 100%, eles apenas ditam a "largura da fatia" de cada monstro na roleta.

Dito isto, eis o Plano de Execução:

---

## Task Breakdown (Onda 6.0)

### 1. Modelagem de Dados (Backend & JSON)
- Atualizar a estrutura (via Admin Bestiário ou documentação manual em `monsters_game.json`) para aceitar a chave `dropWeight` em cada monstro. Exemplo: `"dropWeight": 10`.

### 2. Lógica Core (`SummonService.js`)
- Refatorar o método `findCards(expansionId, table, tier, count)`.
- Substituir a linha `pick = pool[Math.floor(Math.random() * pool.length)]` pelo **Weighted Random Algorithm**.
- Implementar a regra de Fallback: "se a carta não tiver `dropWeight` configurada nas overides/json, assuma um peso padrão (ex: 100) para entrar na divisão igualitária com as outras sem peso".

### 3. Ajuste Visual de UI (Frontend Admin - Bestiário)
- Na aba "Bestiário" do Painel de Admin, onde hoje vemos os Detalhes da criatura, podemos adicionar um campo visual "Peso de Drop (Weight)" caso deseje customizar pela interface no futuro, atrelando à rota de `POST /api/config`.

---

## Verification
- Simular invocações programáticas injetando Pesos absurdos (Ex: Dragão Zumbi = Peso 9999, Esqueleto = Peso 1) e garantir que o random retorna o Dragão Zumbi > 99% das vezes quando a Tier é sorteada.
