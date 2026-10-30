Pedido: "crie 4 variações de animações para utilizar especificamente no botão de perfil, veja como é esse componente dentro do storybook. A intenção é chamar a atenção do usuário para um ponto específico da interface, esse motion precisa ser sútil mas ainda assim capturar a atenção. Eu quero sentir que o motion está guiando meu olhar para o elemento que vai estar dentro da tela. Esse motion precisa funcionar em estado iddle do componente, então é importante que seja algo replicável mas que não canse e irrite o usuário. Estou pensando em ripple effect ou um shimmer"

Componente existente: o botão Login do `MainMenu` (ui-kit-main-menu, story Default): avatar redondo na barra inferior, `avatarSrc` ou placeholder em token de cor.

Para quê e onde: guiar o olhar do espectador até o botão de perfil na barra do MainMenu, enquanto o foco está em outro botão (Program por padrão). Ele deve perceber o botão sem que o resto da barra se mexa.
Intenção: sentir o olhar sendo conduzido até o avatar; sutil mas perceptível. Não quer: cansar, irritar, parecer notificação (AlertBug, bolinha de pendência).
Prioridade: o avatar é o ponto de chegada; o motion é uma camada de apoio ao redor ou por cima dele.
Controle: só visual. Estado ocioso (sem foco). Sem hover, sem teclas novas; o foco normal do botão continua como no kit.
Estados: ocioso animado (o foco é o do kit, não se redesenha). Mostrar ao lado o repouso sem motion como referência.
Conteúdo: avatar com placeholder do kit, ao lado dos outros botões do MainMenu (Schedule, Misc "Previsão do tempo", Program "Copa do Mundo: Equador x Argentina") para o olhar ter contexto.
O que varia: só o motion. O botão, o menu e o conteúdo ficam iguais. 4 opções.
Restrições do designer: não muda tamanho nem layout do botão (nada de escalar ou empurrar vizinhos; o motion vive em anel, brilho ou camada por cima); só tokens de cor do kit; cadência de pulso com pausa longa (gesto de ~1,5 s, silêncio de ~6 a 8 s), curvas do kit (`--motion-semantic-*`).
Suposição: Superfície: nenhuma das duas (Card/Content Card). O componente é o próprio botão do MainMenu, a mesma em todas as opções.
Suposição: padrão de interação e referência do catálogo não se aplicam (é motion de um botão, não um card); as direções diferem na tese do movimento.
Suposição: cada opção mostra o MainMenu inteiro com o botão animado em loop, com a pausa longa entre pulsos.

## Opção 1 · Ondas (ripple)
- **Tese:** o olhar segue uma onda que nasce no avatar e se afasta, como uma gota na água.
- **Referência:** nenhuma do catálogo.
- **Interação:** nenhuma (só visual, ocioso).
- **Peças:** avatar; 2 anéis finos que expandem e somem em cascata; pausa longa. Os anéis nascem do contorno do avatar e crescem para fora, sem mexer no layout.

## Opção 2 · Brilho que passa (shimmer)
- **Tese:** uma faixa de luz atravessa o avatar na diagonal, como reflexo em vidro, e o olhar acompanha a faixa até ele.
- **Referência:** nenhuma do catálogo.
- **Interação:** nenhuma.
- **Peças:** avatar; faixa de luz diagonal clipada ao círculo; um único passe, depois a pausa longa.

## Opção 3 · Respiração do contorno
- **Tese:** um halo suave ao redor do avatar sobe e desce de intensidade, como respiração, e o olhar descansa nele.
- **Referência:** nenhuma do catálogo.
- **Interação:** nenhuma.
- **Peças:** avatar; halo difuso em volta (sombra/brilho, sem mudar tamanho); sobe e desce uma vez, depois a pausa longa.

## Opção 4 · Arco que orbita
- **Tese:** um arco de luz percorre o contorno do avatar uma volta, desenhando o caminho que o olhar deve fazer.
- **Referência:** nenhuma do catálogo.
- **Interação:** nenhuma.
- **Peças:** avatar; arco fino que dá uma volta no contorno (conic/máscara), some, e a pausa longa.

Verificação: abrir a página ao vivo, ver as 4 opções animando em loop com a pausa longa, comparar com o repouso, e checar que o layout do MainMenu não se move.

Restrição técnica (real, do designer): o motion tem de rodar em Chrome 68 e Safari 16 ou mais novo, feito só com propriedades de CSS (@keyframes, transform, opacity, filter, box-shadow, border, clip-path, linear/radial-gradient, -webkit-mask-image). Fora: conic-gradient (Chrome 69+), mask-image sem prefixo (Chrome 120+), @property (85+), `inset` (87+), `gap` em flex (84+), `aspect-ratio`, propriedades `translate`/`scale`/`rotate` separadas, `color-mix`, `:is()`/`:where()`/`:has()`, `clamp()`/`min()`/`max()` (79+), animation-timeline, `@starting-style`. Nenhum JS no motion; o "Tocar efeito" da página de exploração pode usar JS só para reiniciar a animação.
