# PLAN: Transição para Summon por Tempo e Acesso Admin Restrito

Este plano descreve a substituição do sistema de moedas por um sistema de "Energia de Invocação" baseado em tempo e a restrição do acesso ao painel administrativo.

## 🎼 Agentes Orquestrados
1. **project-planner**: Coordenação e revisão do plano.
2. **backend-specialist**: Implementação da lógica de tempo no servidor e restrição de admin no `auth.js`.
3. **frontend-specialist**: Atualização da UI (contador e carga de summons) e bloqueio visual do Admin.
4. **test-engineer**: Validação da regeneração de summons e segurança do admin.

---

## 🛠️ Mudanças Propostas

### 1. Sistema de "Energia de Invocação" (Tempo)
- **Regra**: 1 carga a cada 8 horas. Máximo de 6 cargas acumuladas.
- **Backend (`data/users.json`)**:
    - Adicionar campos `availableSummons` (default 6) e `lastSummonAt` (ISO string) ao perfil do usuário.
- **Backend (`server/routes/collection.js`)**:
    - Criar rota `GET /api/summons/status/:userId` para calcular o estado atual (cargas + timer).
    - Modificar `POST /api/collection/:userId/add` para validar e descontar uma carga, atualizando `lastSummonAt` se estava no máximo.
- **Frontend (`public/logic.js`)**:
    - Refatorar `SummonEngine`: remover `coins` e `deductCoins`.
    - Adicionar métodos para lidar com `summonsAvailable` e `nextSummonAt`.
- **Frontend UI (`public/index.html`)**:
    - Substituir o ícone de moedas por um ícone de energia/cristal.
    - Exibir "Cargas: X / 6".
    - Exibir "Próxima carga em: HH:MM:SS".

### 2. Acesso Admin Restrito
- **Regra**: Somente `arielssilva@hotmail.com` pode acessar as funções de admin.
- **Backend (`server/routes/auth.js`)**:
    - No `/login` e `/register`, adicionar flag `isAdmin: email === 'arielssilva@hotmail.com'`.
- **Backend (`server/server.js`)**:
    - Criar um middleware para proteger rotas `/api/config` (POST) e outras funções administrativas, validando o email do usuário ou a flag `isAdmin`.
- **Frontend (`public/admin.js`)**:
    - Na inicialização, verificar se o usuário logado é o admin. Se não, redirecionar para `/` com um alerta.

---

## 🧪 Verificação (Testes)
- **Teste de Regeneração**: Simular o tempo passando (ajustando `lastSummonAt` no JSON) e verificar se as cargas aumentam corretamente até 6.
- **Teste de Consumo**: Realizar summons e verificar se as cargas diminuem.
- **Teste de Segurança**: Tentar acessar `/admin.html` com um usuário comum e validar o bloqueio.

---
**Status**: ⏸️ Aguardando Aprovação do Usuário.
