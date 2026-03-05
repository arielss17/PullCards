# Plan: Summon i18n Strings (Narration & Results)

## 1. Contexto e Objetivo
Garantir que **todas** as strings de texto renderizadas na zona de "Dice Arena", "Narration" e "Result Banner" durante o fluxo de invocação no `index.html` sejam personalizáveis pela Expansão, mantendo a arquitetura atual de objetos multilingues (`pt-BR`, `en`, etc) baseada no seletor de linguagem do Estúdio.

## 2. Escopo Arquitetural

### [MODIFY] `public/admin.html` (Aba Estúdio)
- Expandir a "Aba Estúdio" para contemplar as seguintes frases cruciais que ficaram presas na Engine Clássica:
  - **Resultado de D100 Crítico**: "SUCESSO CRÍTICO" (Painel do Dado D20)
  - **Narrativa de Crítico Unitário**: "A realidade se estilhaça e o universo responde à sua sorte máxima."
  - **Narrativa de Crítico Múltiplo**: "Múltiplas assinaturas de poder letal foram detectadas..."
- **Narrativas de Custom Tiers**: Expandir a tabela ou criar uma lógica para permitir narrativas únicas para cada Tier ("Uma criatura de nível S surge...").

### [MODIFY] `public/admin.js`
- Fazer o binding desses novos inputs com a variável reativa global e o seletor de Idiomas, mapeando-os como `{ "pt-BR": "...", "en": "..." }` no objeto final exposto na propriedade `config.summonExperience`.
- Atualizar a UI das Custom Tiers para possivelmente abranger uma propriedade `narration: { "pt-BR": "", "en": "" }`, caso as narrativas por tier fiquem aninhadas lá.

### [MODIFY] `public/index.html` e Locales
- Refatorar o Bloco "Phase 3: Results Evaluation" no script final do jogador (aprox. linha 800-850).
- Substituir chamadas cruas como `I18n.t("narration.criticalS")` pelo mecanismo de Fallback Seguro:
  `const text = config.summonExperience.narrationCriticalS?.[I18n.currentLocale] || I18n.t('narration.criticalS');`
- Aplicar o fallback dinâmico também para as narrativas construídas dinamicamente via `getTierNickname`.

## 3. Checklist de Implementação (Onda 5.6)
- [ ] Ampliar HTML do *Admin Studio* com blocos de texto para Resultados e Narrativas Críticas.
- [ ] Ampliar JS do *Admin Studio* para gerenciar a serialização Multilingue desses novos nós.
- [ ] Ampliar HTML/JS do *Admin Studio* (Tabela de Tiers) para embutir a Narrativa Personalizada da Carta sorteada.
- [ ] Refatorar a malha de promessas de animação (`typeNarration` e textContents) no `index.html` central para pescar a configuração.
- [ ] Homologação de tela de fim-a-fim.
