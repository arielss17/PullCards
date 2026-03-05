# Plan: Escala de Intensidade Visual das Tiers (0–100)

## Contexto
O campo `rateTarget` nas Custom Tiers controla a intensidade do efeito visual na invocação, mas com lógica invertida (`<= 15` = épico). O objetivo é substituí-lo por uma escala intuitiva **0–100** onde **100 = Lendário** e **0 = Insignificante**.

## Lógica Atual (Binária)
```javascript
const isHighDef = tierData.rateTarget <= 15; // true = épico, false = comum
```
Apenas 2 níveis: épico ou normal.

## Nova Lógica (Graduada, 0–100)

| Faixa | Nível | Shake | Partículas | Som | Overlay |
|-------|-------|-------|------------|-----|---------|
| **0–25** | Insignificante | Nenhum | 5 | `tierC()` | Nenhum |
| **26–50** | Comum | Leve | 15 | `tierA()` | `tierAB` |
| **51–75** | Impressionante | Leve | 30 | `tierA()` | `tierAB` |
| **76–100** | Lendário | Pesado | 50 | `tierS()` | `tierS` |

## Proposed Changes

### [MODIFY] `admin.js`
- Renomear `rateTarget` → `visualIntensity` no handler e no default de nova Tier
- Atualizar label e placeholder

### [MODIFY] `admin.html` (renderStudioTiers template)
- Renomear label de "Chance Base (%)" → "Intensidade Visual (0–100)"

### [MODIFY] `index.html`
- Substituir a lógica binária `isHighDef` por uma resolução graduada baseada na nova escala
- Interpolar partículas e efeitos proporcionalmente

### [MODIFY] `server/` (Backward Compat)
- Se `rateTarget` existir no config antigo, migrar para `visualIntensity` invertendo (`100 - rateTarget`)

## Verification
- Testar no Admin: campo exibe "Intensidade Visual"
- Testar na Invocação: Tier com 100 = efeito máximo, Tier com 0 = efeito mínimo
