# Codebase Clean Code Review (Frontend/Backend Separation)

Este documento avalia a saúde estrutural atual do projeto focando em Acoplamento, Responsabilidade Única (SRP), DRY e a correta separação entre as camadas Cliente (Frontend) e Servidor (Backend).

---

## 🚨 Alertas Vermelhos (Infrações Críticas)

### 1. Regra de Negócio (RNG) Vazada no Frontend (`logic.js`)
* **Problema:** Toda a matemática do gacha (roleta, sorteio de tiers, porcentagens, checagem de crítico) está sendo executada no navegador do usuário dentro do arquivo `public/logic.js` (`SummonEngine`).
* **Risco (Clean Code / Segurança):** 
  - **Falta de Confiança:** Qualquer usuário mal-intencionado pode abrir o Console (F12) e modificar o `SummonEngine.rollTierStep()` para forçar um "Tier Lendário" em 100% das vezes e depois enviar para a API `/add` dizendo que "tirou" a carta.
  - **Acoplamento Invertido:** O Cliente decide qual carta tirou e avisa o Servidor para guardar. O correto é o Cliente pedir *"Gira a roleta pra mim!"*, e o Servidor realizar as contas de probabilidade, salvar no banco e apenas responder: *"Você ganhou esta carta"*.
* **Proposta:**
  - Migrar `logic.js` inteiramente para o Backend (ex: `server/services/SummonService.js`).
  - O botão de "Invocação Ritual" no Frontend fará apenas um `POST /api/summon` e aguardará o JSON de retorno com os dados do que ele tirou.

### 2. O Anti-Pattern "God Object" em `admin.js`
* **Problema:** O arquivo `public/admin.js` possui quase 700 linhas de código e é responsável por TUDO:
  - Fazer requisições HTTP (API Client calls).
  - Gerenciar estado interno (Arrays de montros, configurações de tabela).
  - Manipular o DOM violentamente (Renderizações de HTML misturadas no JS).
  - Processar busca, filtro e sort (Regras de UI).
* **Risco (SRP / DRY):** Manutenção impossível. Mudar a estrutura HTML do Bestiário no painel exigirá garimpar linhas de `card.innerHTML = ...` perdidas no meio do arquivo.
* **Proposta:** 
  - Usar ECMAScript Modules (`<script type="module">`).
  - Dividir em arquivos menores: `admin-ui.js` (DOM manipulação), `admin-state.js` (Busca e Filtro) e `admin-api.js` (Comunicação com o cofre).

### 3. Falta de Confiança e Isolamento da "Fonte da Verdade" (Banco de Monstros)
* **Problema:** Quando o administrador abre a tela, a UI consome dados brutos (API `MonsterAPI` no front-end). Mas como a lógica de Rolar os Dados (`logic.js`) também roda no front, o front precisa possuir uma cópia local de todos os monstros pra poder buscar.
* **Proposta:** Assim que migrarmos a `SummonEngine` para o Backend (Ponto 1), o Frontend não precisará mais carregar o JSON pesado com todos os monstros na memória só para o usuário poder apertar "Rolar". A carga se tornará instantânea (Lazy Loading).

---

## 🟡 Alertas Amarelos (Oportunidades de Refatoriação)

### 1. Inchaço no Sistema de Sons (`sounds.js`)
* **Problema:** O Web Audio API está manual. Há mais de 20 funções `tierC`, `tierS`, `tableA` com números mágicos, violando **DRY** repetidamente no padrão de gerar osciladores e filters.
* **Proposta:** Criar um mapa de configuração de som genérico e um gerador único: `playEffect(effectType)` consumindo um JSON de frequências, em vez de funções hardcoreadas (Até porque isso precisará ser dinâmico para a nova features de Expansões da Onda 5).

### 2. Falta de Controle de Tipo / Validações
* **Problema:** Durante as requisições, injetamos informações diretamente do DOM no body do objeto JSON (`{ "cardId": "foo", "tier": "S" }`).
* **Proposta:** Aplicar **Guard Clauses** e Tipagem (ex: JSDoc ou Typescript, se migrato) na base do Frontend para sabermos quais variáveis são requeridas na saída da rede.

---

## 🏁 Conclusão e Próximos Passos (Socratic Gate)

O backend agora está estruturado (Routes -> Services -> Repos), o que é excelente. Mas o Frontend ainda carrega o fardo de Regras de Negócio e Cálculos Matemáticos Críticos, quebrando as barreiras do `Layered Architecture` e `Security Validations`.

**(Checklist do Usuário - Escolha um caminho)**
* [X] **Ação Corretiva Imediata (Refatoração Crítica)**: Antes de iniciarmos as features de *Expansões (Onda 3)*, vamos trazer toda a `SummonEngine` de Matemática/Probabilidade (`logic.js`) para dentro do Backend do Node.js, fechando completamente as brechas de trapaça e isolando a responsabilidade de servidor.
  
Qual direcionamento você prefere tomar?
