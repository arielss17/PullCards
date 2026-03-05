# Planning: Backend Architecture Refactoring (Node.js Best Practices)

## Objetivo
Realizar uma análise estrutural do backend (`/server`) sob a ótica das diretrizes `nodejs-best-practices` (Clean Architecture, Express, Error Handling). O foco é garantir que o sistema possa escalar e ser mantido com facilidade, sem quebrar o que já funciona.

**Nota:** Nenhuma linha de código foi alterada. Este é um documento estratégico.

---

## 🚨 Despadronizações e Riscos Identificados

### 1. Ausência de Camadas (Arquitetura Monolítica nas Rotas)
* **Problema:** Atualmente, os arquivos em `server/routes/` (ex: `auth.js` e `collection.js`) fazem tudo: processam a requisição HTTP (Req/Res), executam a regra de negócio (validar campos, deduzir energia) e realizam as operações puras de banco de dados (ler e escrever JSON no disco).
* **Risco (Por que refatorar?):** Isso torna praticamente impossível testar a lógica do jogo (como `calculateSummons`) independentemente do Express, e dificulta uma eventual migração dos arquivos `.json` para um banco real (como PostgreSQL/MongoDB) no futuro, pois os arquivos de rota dependem diretamente do `json-store`.
* **Proposta (Layered Structure):**
  - **Controllers (Rotas):** Lidam apenas com Express, recebem, respondem HTTP statments.
  - **Services (Lógica):** Onde realmente ocorre a regra de negócio do RPG (cálculo de tempo, dedução de energia, autenticação).
  - **Repositories (Dados):** O único local que interage com o `json-store` e os arquivos de disco.

### 2. Falta de Tratamento Centralizado de Erros (Error Handling)
* **Problema:** Cada rota possui seu próprio bloco `try / catch` que finaliza com `console.error` e um `res.status(500)`.
* **Proposta (Centralized Error Handling):** Criar um middleware global no `server.js` para captura de erros. Utilizar classes de Erro Customizadas (Ex: `ValidationError`, `NotFoundError`) para que os Services possam disparar `throw new NotFoundError()` e o middleware transforme isso automaticamente em HTTP 404 sem sujar o Service com lógica de HTTP.

---

## 🗺️ Mapa de Execução (Próximos Passos)

1. **Fase 1: Implementar o Padrão Repository**
   - Extrair a lógica de gravação e leitura do `users.json` e `collections.json` para classes em `server/repositories/`.

2. **Fase 2: Isolar Regras de Negócio (Services)**
   - Criar `server/services/EnergyService.js` (Extraindo o `calculateSummons` de `collection.js`).

3. **Fase 3: Refatorar Express Routes (Controllers)**
   - Limpar as rotas para que sejam apenas "Cascas" chamando as funções dos Services e respondendo em JSON.

4. **Fase 4: Middleware Global de Tratamento de Exceções**
   - Criar e injetar o capturador de falhas no `server.js`.

---

## Checklist / Socratic Board
* [X] Deseja que a reestruturação dos Repositories já seja desenhada pensando numa tabela SQL no futuro, ou focada exclusivamente na otimização da leitura de arquivos JSON?
