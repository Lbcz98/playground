Pedido: uma exploração descartável, uma opção só, da entrada orquestrada do menu da Home, com os valores que já estão no protótipo, para abrir o palco de ajuste.

Componente existente: o menu de baixo da Home (`MainMenu` do kit). Cinco opções, da esquerda para a direita: Login (avatar), Schedule (ícone), Miscellaneous (botão + duas linhas), program (duas linhas + botão) e o bug do canal.

Para quê e onde: no palco de ajuste, para o designer mexer no atraso e no deslocamento dessa entrada. Não é uma tela.
Intenção: as opções chegam em fila, cada uma 8px à direita, e assentam para a esquerda. Não quer: fade, escala, subida, quique, nem repetir a entrada a cada troca de foco.
Foco: a fila das cinco opções entrando. O bug começa focado (anel do kit); os outros ficam em repouso. O foco não muda durante a entrada.
Controle: nenhuma tecla. A entrada toca quando a opção aparece.
Estados: `espera` (cada opção parada 8px à direita) e `assentada` (cada opção em translate 0). A opção nasce em `assentada` e a passagem de `espera` para `assentada` é a orquestra.
Conteúdo: Login com avatar circular; Schedule com ícone de calendário; Miscellaneous "Previsão do tempo" / "São Paulo, SP"; programa "Jornal Nacional" / "A seguir, Hora Um"; bug com a marca do canal.
O que varia: nada entre opções. Há uma só. Os valores são os do protótipo.
Suposição: Superfície: nenhuma (Card/Content Card). O componente é a barra do menu, a mesma do kit.

**Direção visual**
- Tom: contido, uma fila que assenta · temperatura: neutra. Só a posição muda.
- Fio condutor: cinco grupos, da esquerda para a direita, cada um começa em `translate(8px, 0)` e vai a `translate(0, 0)`. O 8px é `--dimension-spacing-core-2xs`. A duração é `--motion-semantic-duration` (800ms) e a curva é `--motion-semantic-easing`. O atraso é o índice vezes 120ms: 0, 120, 240, 360, 480. `animation-fill-mode: both`.
- Levar:
  - **Oito pixels para a esquerda:** o movimento é no eixo x, de +8px até 0. Nada em y.
  - **120ms entre uma e a seguinte:** a primeira (Login) não espera; cada próxima espera mais 120ms.
  - **Spring do sistema:** 800ms, a curva do kit. Sem outra duração.
  - **Cinco grupos, não sete peças:** o texto do miscellaneous anda com o botão; o texto do programa anda com o botão dele. O bug é o quinto.
- Evitar: opacidade, escala, blur, translateY, e recomeçar a animação quando o foco muda.
- Palavras do designer: "120ms delay with a 8px translation on the x axis to the left", "orchestration entrance".
- Teste de fidelidade: no primeiro quadro as cinco estão 8px à direita e, 200ms depois, as da esquerda já andaram e as da direita ainda estão paradas? (sim/não)
- Distância: uma opção fiel. Sem reinterpretar.

Restrição: CSS que o Chrome 68 entende. `transform: translate()`, não a propriedade `translate`. Sem `gap` em flex (usar margem), sem `:is()`, sem `@property`. `prefers-reduced-motion` troca o deslocamento por aparecer no lugar (sem translate).

## Opção 1 · Fila que assenta
- **Tese:** as cinco opções da Home nascem 8px à direita e assentam para a esquerda, uma 120ms depois da outra, no spring do sistema.
- **Foco em cena:** a fila é o assunto; o primeiro a sair do lugar é o Login, e o bug é o último. O anel do bug fica nele o tempo todo.
- **Referência:** nenhuma do catálogo (os valores já estão no protótipo).
- **Interação:** nenhuma (só visual).
- **Peças:** avatar do Login; ícone do Schedule; botão e duas linhas do Miscellaneous; duas linhas e botão do programa; bug do canal.
- **Regras:** esqueleto-fixo, tipografia-de-detalhe
