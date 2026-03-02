# Documentação Técnica: Regras de Negócio de Summon (Ritual de Dois Passos)

Esta documentação detalha a lógica de backend/frontend que governa o sistema de invocação de cartas do **PullCards**.

## 1. Fluxo do Ritual
O processo de invocação é dividido em duas fases principais de rolagem de dados, seguidas por uma resolução de pool de monstros.

### Passo 1: Definição do Reino (d100)
O jogador rola um dado de 100 faces para determinar em qual tabela de monstros a invocação irá buscar o resultado.

| Resultado d100 | Tabela (Reino) | Descrição Técnica |
| :--- | :--- | :--- |
| 1 a 50 | **Tabela A** | Criaturas de baixo CR (Baixa dificuldade) |
| 51 a 80 | **Tabela B** | Criaturas de médio CR (Média dificuldade) |
| 81 a 100 | **Tabela C** | Criaturas de alto CR (Alta dificuldade) |

> **Nota:** Estes valores são carregados dinamicamente via `admin_config.json`. Caso o arquivo não exista, estes são os padrões aplicados.

---

## 2. Qualidade e Raridade (d20)
Após definir a tabela, o jogador rola um dado de 20 faces para determinar a raridade (Tier) da carta.

### Tabela de Probabilidades (d20)
| Resultado d20 | Tier Resultante | Chance Nominal |
| :--- | :--- | :--- |
| 1 a 11 | **Tier C** (Common) | 55% |
| 12 a 15 | **Tier B** (Uncommon) | 20% |
| 16 a 19 | **Tier A** (Rare) | 20% |
| 20 | **CRITICAL** (Especial) | 5% |

---

## 3. Resolução de Crítico (Sub-roll)
Quando um 20 natural é rolado no d20, o sistema executa um `handleCritical()` que rola um **segundo d20** interno para definir o prêmio máximo.

| d20 Interno | Resultado do Crítico | Chance (Total) |
| :--- | :--- | :--- |
| 1 a 19 | **Double Rare**: 2x Cartas Tier A | 4,75% |
| 20 | **Legendary**: 1x Carta Tier S | 0,25% |

### Probabilidade Real Acumulada
Considerando o fluxo completo (d100 ignorado pois define apenas a origem):
- **Tier C**: 55.0%
- **Tier B**: 20.0%
- **Tier A**: 24.75% (20% base + 4.75% via crítico)
- **Tier S**: 0.25% (Apenas via crítico perfeito)

---

## 4. Lógica de Seleção de Cartas (Pool Management)
O sistema utiliza um algoritmo de filtragem por camadas (`findCards`) para garantir que o jogador nunca receba um erro de "vazio", mesmo que as tabelas estejam mal configuradas no Admin.

### Ordem de Prioridade (Fallback):
1. **Match Perfeito**: Cartas que pertencem à `Tabela` sorteada **E** ao `Tier` sorteado.
2. **Fallback por Tabela**: Se não houver o Tier naquela tabela, busca qualquer carta daquela `Tabela`.
3. **Fallback por Tier**: Se a tabela estiver vazia, busca qualquer carta que combine com o `Tier`.
4. **Resgate Global**: Se nada for encontrado, retorna uma carta aleatória de todo o banco de dados.

---

## 5. Mapeamento Automático (API Fallback)
Quando uma carta é carregada do arquivo original sem overrides manuais, o sistema atribui Títulos e Tabelas baseados no **Challenge Rating (CR)**:

| Challenge Rating (CR) | Tabela Sugerida | Tier Sugerido |
| :--- | :--- | :--- |
| 0 a 2 | A | Common (C) |
| 2.1 a 4 | A | Uncommon (B) |
| 4.1 a 6 | B | Uncommon (B) |
| 6.1 a 12 | B/C | Rare (A) |
| 14+ | C | Legendary (S) |
