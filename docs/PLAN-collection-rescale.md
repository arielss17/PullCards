# PLAN: Rescale Collection Cards

## Objetivo
Corrigir a desconfiguração visual dos cards na página de Coleção. Atualmente, os cards estão tentando se espremer dentro de um contêiner fluido (`width: 100%`), o que quebra o CSS original (que usa tamanhos fixos de píxeis para bordas, letras, ícones, etc). 
A nova abordagem vai renderizar a carta em seu tamanho real (220px x 310px) e aplicar `transform: scale()` para reduzi-la em 40% como se fosse uma "imagem", preservando assim o seu layout original intacto.

## Passo a Passo da Implementação

### 1. Ajustes no Grid e Wrappers (`collection.css`)
- **Tamanho Fixo do Slot:** Redefinir a largura do `.col-card-wrapper` no grid para o tamanho exato da carta escalada. Se a carta tem `220px` e reduzirmos em 40% (scale `0.6`), o wrapper terá `132px` de largura e `186px` de altura.
- **Grid Layout:** Alterar o `grid-template-columns` para `repeat(auto-fill, minmax(132px, 1fr))` para que se adapte graciosamente com essa nova proporção.
- **Transform Origin:** Garantir que o ponto de ancoragem do scale da carta comece no topo-esquerdo ou no centro correto dentro do wrapper (`transform-origin: top left;`).

### 2. A Mágica do CSS Scale (`.col-card-wrapper .card`)
- Remover a tentativa de `width: 100%; height: 100%;` que está desfigurando a carta.
- Fixar o tamanho original da carta (`width: 220px; height: 310px;`).
- Aplicar o scale exato no CSS: `transform: scale(0.6);` (redução exata de 40%).
- Manter `position: absolute;` e `top: 0; left: 0;` para que ela fique no topo-esquerdo do `wrapper` (que terá o tamanho exato do card já escalado).
- Adicionar `pointer-events: none;` na estrutura interna se houver problema de click, delegando o hover para o `.col-card-wrapper`.

### 3. Ajuste do Modal (`.col-modal__card-container`)
- Retirar o aspecto de proporção fluido do modal e fixá-lo também no tamanho real da carta.
- Como o modal tem mais espaço, talvez não seja necessário reduzir em 40%. Ou, se for reduzir, usar uma escala que caiba perfeitamente (ex. `scale(0.8)` ou manter proporção 1 para 1).
- Garantir que a renderização dentro do modal chame o mesmo esquema "tamanho fixo + scale".

### 4. Ajuste na Carta Faltante (`.card-missing`)
- Ajustar ou escalar similarmente o frame fantasma com o número para que o design não fique quebrado e mantenha a coesão com os cards escaláveis ao lado.

## Validação / Testes
- Acessar a Coleção e verificar se o design interno do card (padding, CA, atributos, tamanho das fontes) reflete exatamente com proporção 1:1 miniaturizada em relação ao card exibido na invocação.

---
**Escopos Envolvidos:** APENAS CSS (`collection.css`). A estrutura HTML não precisará mudar.
