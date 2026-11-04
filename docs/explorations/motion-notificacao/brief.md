Pedido: "create 4 motion variables for the notification component in the storybook. Remember the browser's Chrome 68 and Safari 16 limitations and use only CSS properties"

Componente existente: `Notification` (`src/ui-kit/Notification.tsx`, story UI Kit/Notification): pílula translúcida no canto superior direito, sem scrim. `rounded` = só o logo (72px); `message` = logo + 2 linhas de texto (252px = 16 `sm` + 40 `avatar` + 12 `xs` + 168 `notification-text-width` + 16 `sm`); 72px de altura nos dois.

Para quê e onde: no Storybook, o ciclo completo em loop: entra, abre a mensagem, recolhe ao logo, sai.
Intenção: chega com calma e não rouba o vídeo. Não quer: pular, quicar, piscar.
Foco: a chegada — a notificação entra no canto superior direito sobre o vídeo.
Controle: sem nenhum elemento focado na tela, o foco vai automaticamente para a notificação ao surgir, independente se o alerta do bug estiver acontecendo. Na home com um item do menu focado, a animação entra sozinha, sem foco.
Estados: cada opção mostra os dois cenários lado a lado: chegada com foco (FocusRing do kit) e chegada sem foco.
Conteúdo: "Paredão formado!\nVote agora para eliminar", logo placeholder do kit, sobre `--color-semantic-theme-noite-light`.
O que varia: só o motion. Medidas, tokens e conteúdo iguais. 4 opções.
Suposição: Superfície: nenhuma das duas (Card/Content Card). O componente é a própria Notification, a mesma em todas as opções.
Suposição: padrão de interação e referência do catálogo não se aplicam (o catálogo não tem referência de movimento); as direções diferem na tese e no mecanismo.

**Direção visual**
- Tom: lento, contínuo, contido · temperatura: neutra. A pílula translúcida passa por cima do vídeo sem mudar cor nem luz; só a forma muda.
- Fio condutor: uma pílula só abre de 72 para 252px e volta, sempre na spring do kit em cubic-bezier de 800ms. O logo fica parado onde surgiu, e rounded e message nunca trocam por crossfade. A chegada (o Foco) é o primeiro tempo desse mesmo objeto.
- Referência principal: "Layout-animating expand pill with auto-width transition" (texto do designer, sem imagem) · teoria confirmada:
  - (1) **Um objeto só que estica:** a mesma pílula vai de 72px a 252px de largura (3,5×), com 72px de altura nos dois estados.
  - (2) **Chega redonda, depois abre:** em dois tempos. Primeiro chega o círculo de 72px com o logo; depois a pílula abre em 800ms.
  - (3) **Texto depois da largura:** a coluna de 168px aparece só por opacidade, parada, quando a largura já passou de uns 80%.
- Levar:
  - **Um objeto que estica:** a largura da pílula vai de 72px (`round-button-circle`) a 252px. Pode ser a largura real animada ou uma máscara com `overflow: hidden` e contra-translate do conteúdo. As pontas mantêm o raio `pill` o tempo todo e nada é animado como `width: auto`.
  - **Logo fixo, pílula cresce para a direita:** o círculo nasce com a borda esquerda a 180px da posição final da borda direita, que é o canto. A pílula abre para a direita até encostar no canto e recolhe para a esquerda. O logo fica a 16px da borda esquerda nos dois estados e não se move em x em nenhum quadro.
  - **Dois tempos na chegada e na saída:** primeiro chega o círculo, depois a pílula abre em 800ms. Na saída a ordem se inverte: o texto some, a largura volta a 72px e só então o círculo sai. O ciclo roda em loop: entra, abre, mostra, recolhe ao logo, sai.
  - **Texto depois da largura:** a coluna de 168px fica parada no lugar final. O texto vai de opacidade 0 a 1 só depois que a largura passou de uns 80% dos 252px, e na saída some antes de a largura recolher.
- Evitar:
  - **Logo correndo pela tela:** se a pílula ficar presa pela borda direita, o logo desliza 180px para a esquerda sobre o vídeo.
  - **Texto cortado pela borda (cortina):** a borda em movimento revela a frase letra a letra, porque o texto já está opaco enquanto a largura abre.
  - **Pontas que se deformam:** usar `scaleX` na pílula achata as pontas redondas e o logo de 40px no meio da abertura.
- Palavras do designer: "chega com calma e não rouba o vídeo", "evitar pular, quicar ou piscar", "Layout-animating expand pill with auto-width transition", "use only CSS properties".
- Inegociável (confirmado pelo designer): crossfade entre rounded e message, ou o logo se movendo em x, descartam a opção.
- Teste de fidelidade: comparando o quadro do círculo recém-chegado com o quadro da pílula aberta, o logo está no mesmo x, a borda direita encosta no canto só no fim e o texto ainda está invisível quando a pílula está pela metade? (sim/não)
- Distância por opção:
  - **1 fiel:** os três mecanismos exatamente como acima.
  - **2 reinterpretada:** muda como o círculo chega (desce poucos pixels com opacidade).
  - **3 reinterpretada:** muda como a largura é feita, com máscara e contra-translate (só transform) no lugar da largura real.
  - **4 contraponto:** inverte "chega redonda, depois abre". A chegada e a abertura viram um tempo só de 800ms, e o texto entra por opacidade no mesmo fôlego. Mantém o logo fixo e não usa cortina.

Conflitos e quem decidiu:
- Spring do kit: `motion.semantic.easing` usa `linear()` (Chrome 113+). Pela restrição do designer, vale `cubic-bezier(0.19, 0.06, 0.24, 1)` (o mesmo do `AlertBug`), sem overshoot, 800ms (`--motion-semantic-duration`).
- Anel de foco: se acompanha a pílula enquanto abre ou só aparece quando ela para fica livre por opção, desde que nunca seja animado com `scaleX`.

Restrição técnica (real, do designer): só CSS, rodando em Chrome 68 e Safari 16 ou mais novo (`transition`, `@keyframes`, `transform`, `opacity`, `width` em px, `-webkit-mask-image`, `clip-path`). Fora: `linear()` easing, `interpolate-size`, `calc-size()`, `@starting-style`, `:has()`/`:is()`/`:where()`, propriedades `translate`/`scale`/`rotate` separadas, `inset`, `clamp()`/`min()`/`max()`, `gap` em flex (usar `margin`), `aspect-ratio`, `@property`, `color-mix`, view transitions. `prefers-reduced-motion` não existe no Chrome 68: o movimento reduzido entra por `data-reduced` (estados trocam só por opacidade). Nenhum JS no motion; a página de exploração pode usar JS só para reiniciar o loop.

## Opção 1 · Fiel: chega, abre, fala
- **Tese:** o círculo aparece parado no lugar e só depois se abre em mensagem, como quem chega e então começa a falar.
- **Foco em cena:** a chegada é o primeiro tempo isolado (só opacidade, sem deslocamento), com pausa curta antes de abrir; o texto recua até a largura assentar.
- **Referência:** nenhuma do catálogo (a frase do designer, levada exatamente).
- **Interação:** nenhuma (só visual). Os dois cenários lado a lado.
- **Peças:** círculo surge por opacidade; largura real 72→252px; texto por opacidade após 80% da largura; anel de foco só quando a pílula assenta.
- **Regras:** raios-concentricos, tipografia-de-detalhe

## Opção 2 · Chegada que desce
- **Tese:** o círculo desce poucos pixels do topo enquanto aparece, como algo que pousa, e então abre.
- **Foco em cena:** a chegada ganha uma direção (de cima, de onde vêm as notificações) somada à opacidade; a abertura depois é a da opção 1.
- **Referência:** nenhuma do catálogo (a frase do designer; muda só a chegada).
- **Interação:** nenhuma (só visual).
- **Peças:** círculo com `transform: translateY(-12px)`→0 e opacidade; largura real 72→252px; texto depois; anel acompanha a pílula enquanto abre.
- **Regras:** raios-concentricos, tipografia-de-detalhe

## Opção 3 · Máscara que corre
- **Tese:** a pílula já tem 252px e é revelada por uma máscara que corre para a direita; só `transform` se move, nenhum quadro recalcula layout.
- **Foco em cena:** a chegada é um assentar uniforme (escala da forma inteira, sem deformar) com opacidade; a abertura é só composição.
- **Referência:** nenhuma do catálogo (a frase do designer; muda o mecanismo da largura).
- **Interação:** nenhuma (só visual).
- **Peças:** círculo com `transform: scale(0.9)`→1 uniforme e opacidade; máscara `overflow: hidden` com contra-translate abre a pílula sem achatar as pontas; texto depois; anel quando assenta.
- **Regras:** raios-concentricos, tipografia-de-detalhe

## Opção 4 · Contraponto: um tempo só
- **Tese:** chegada e abertura são um gesto único de 800ms, e o texto entra por opacidade no mesmo fôlego.
- **Foco em cena:** a chegada é a própria abertura; o logo é o único ponto parado e o olho fica nele enquanto a forma cresce para a direita.
- **Referência:** nenhuma do catálogo (a frase do designer, com os dois tempos invertidos).
- **Interação:** nenhuma (só visual).
- **Peças:** pílula nasce e abre num só movimento de largura + opacidade; texto entra na última fase da abertura (nunca opaco com a borda andando sobre ele); saída também num tempo só; anel acompanha a pílula.
- **Regras:** raios-concentricos, tipografia-de-detalhe

Verificação: abrir a página ao vivo, ver as 4 opções em loop nos dois cenários (com foco e sem foco), checar que o logo não se move em x, que não há crossfade e que o texto não aparece em cortina.
