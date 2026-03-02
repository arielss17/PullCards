# Plano: Documentação da Regra de Negócio de Summons

Este plano descreve o processo de criação de um documento técnico em Português-BR que detalha a lógica matemática e os algoritmos de invocação do PullCards.

## 📝 Visão Geral
O objetivo é consolidar a dispersão do conhecimento sobre summons (atualmente em `logic.js` e `api.js`) em um único guia de referência técnica para desenvolvedores.

## 🛠️ Fases do Projeto

### Fase 1: Análise de Lógica (Silent)
- [ ] Revisar `public/logic.js` para extrair ranges de d100 e d20.
- [ ] Analisar `handleCritical` para calcular chances reais de Tier S e Multi-Summon (Tier A x2).
- [ ] Analisar `public/api.js` para entender a filtragem CR -> Tier base.

### Fase 2: Estruturação do Documento
- [ ] Criar `docs/summon-business-rules.md`.
- [ ] Definir seções: Ritual de Dois Passos, Resolução de Tabelas, Resolução de Tiers e Mecânica de Crítico.

### Fase 3: Cálculo de Probabilidades e Tabelas
- [ ] Construir tabela de Ranges de Dados.
- [ ] Calcular Probabilidade Acumulada (ex: chance de 5% de Crítico no d20 -> chances resultantes em S e A).
- [ ] Documentar o fallback de busca de cartas (Pool Handling).

### Fase 4: Revisão Técnica
- [ ] Verificar consistência dos nomes de variáveis no documento com o código (`d100`, `d20`, `maxD100`).

## 📋 Lista de Tarefas (Checklist)

| ID | Tarefa | Responsável | Status |
|----|--------|-------------|--------|
| T1 | Criar diretório `docs` (se não existir) | Antigravity | ⏳ |
| T2 | Redigir `summon-business-rules.md` em PT-BR | Antigravity | ⏳ |
| T3 | Validar cálculos matemáticos de Tier S | Antigravity | ⏳ |
| T4 | Adicionar seção de Fallback/Pool | Antigravity | ⏳ |

## 🚀 Próximos Passos
1. Executar a criação do arquivo de documentação.
2. Review final das probabilidades.
