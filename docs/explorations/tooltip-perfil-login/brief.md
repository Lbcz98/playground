Pedido: "tooltip sobre o botão de perfil da Home, sobe de baixo para cima, ease 200ms, blur de 2px, 4px de distância do botão, texto 'Faça o login'"

Componente existente: o botão Login do `MainMenu` (avatar redondo, primeiro do grupo da esquerda na barra inferior). A Home abre com o foco em Program, no grupo da direita.

Para quê e onde: lembrar quem não fez login de que pode entrar, logo que a Home abre. O tooltip fica sobre o botão de perfil.
Intenção: um lembrete discreto que não compete com a Home. Não deve parecer alerta nem erro.
Foco: o convite a entrar, ou seja, o texto "Faça o login".
Controle: o tooltip aparece sozinho, uma vez, ao abrir a Home, com o foco em Program. Ele some quando um botão da esquerda (Login, Schedule ou Misc) ganha foco. As setas ←/→ andam pela barra como no kit. Suposição: Enter não faz nada de novo no tooltip, e Enter no Login abre o trilho de conta como hoje.
Estados: Home aberta com o tooltip visível; a entrada em loop para comparar; a saída depois que o foco vai para a esquerda.
Conteúdo: "Faça o login", com o `MainMenu` completo (avatar placeholder do kit, Schedule, Misc, Program "Copa do Mundo: Equador x Argentina").
O que varia: a encenação da pílula (posição, proporção e contraste). O movimento é o mesmo nas 4 opções.
Suposição: Superfície: nenhuma das duas (Card ou Content Card). O componente é o `MainMenu` com o tooltip, igual em todas as opções.
Suposição: a saída é o inverso da entrada (desce, ganha 2px de blur e some em 200ms).
Suposição: sem o `loginBadge`, que competiria com o tooltip.
Suposição: não existe padrão de interação nem referência do catálogo que se aplique. As direções diferem na tese.

**Direção visual**
- Tom: rente, textual, neutro · temperatura: neutra. A superfície não tem matiz, não há ciano e não há fundo claro, e o único elemento que se destaca é o texto.
- Fio condutor: em todas as opções, "Faça o login" aparece sozinho numa pílula escura, só um degrau mais clara que a Home, sem ícone, sem seta e sem segunda linha, a 4px do botão de perfil.
- Referência principal: nenhuma do catálogo. No lugar dela entram as ideias "canto quieto" e "leitura em sala escura" do repertório · teoria confirmada:
  - pílula só de texto: o raio de pílula do kit (`--dimension-radius-semantic-pill`), uma linha e nada além do texto;
  - superfície um degrau acima: fundo neutro só um degrau mais claro que o fundo da Home, sem contorno, sem brilho e sem sombra.
- Levar:
  - Pílula de uma linha: o padding é igual nos quatro lados, medido até o texto visível, e a largura acompanha "Faça o login". Não há largura mínima nem altura reservada.
  - Um degrau acima do fundo: a forma quase some na Home, e quem faz a leitura é o contraste do texto sobre a pílula, não a pílula sobre a Home.
  - Texto como única peça: "Faça o login" em sentence case, na cor de texto neutra do kit, sem nada antes nem depois. O corpo vai de `.text-body-sm-*` a `.text-body-md-*`, em peso regular ou medium, nunca bold.
  - Entrada pedida: sobe de baixo para cima, ease de 200ms, vai de 2px de blur até nítido durante a subida (não é backdrop-blur) e para a 4px do botão. Com `prefers-reduced-motion`, a pílula aparece já nítida e no lugar.
- Evitar:
  - Elementos que apontam ou ilustram: seta ou triângulo na direção do botão, ícone de cadeado ou de usuário. Qualquer um deles transforma o lembrete num aviso.
  - Cor de foco ou de alerta: ciano no fundo, no texto ou num contorno, porque leria como foco, e qualquer cor de estado.
  - Inversão: pílula clara com texto escuro, que faria do tooltip o ponto mais claro da Home.
- Palavras do designer: "Faça o login", "siga as convenções padrões do uso do tooltip", "sobe de baixo para cima, ease 200ms, blur de 2px, 4px de distância do botão"
- Inegociável: uma opção com ícone, seta, segunda linha, ciano ou fundo claro sai na primeira olhada.
- Teste de fidelidade: no PNG, o tooltip é uma pílula escura só com "Faça o login", visivelmente mais apagada que o botão de perfil e que qualquer botão em foco da Home?
- Distância por opção:
  - 1 fiel: pílula centrada no eixo do botão.
  - 2 reinterpretada: a borda da pílula fica alinhada à borda externa do botão, em vez de centrada.
  - 3 reinterpretada: a pílula tem a mesma altura e o mesmo raio do botão de perfil e lê como irmã dele.
  - 4 contraponto: a superfície sobe dois ou três degraus, ainda escura, para testar até onde vai o "um degrau acima".

Conflitos e quem decidiu:
- O kit usa uma mola de sistema de 800ms em toda transição, mas este tooltip usa ease de 200ms porque o designer pediu isso explicitamente.

Pendente no sistema: o kit não tem componente de tooltip, nem token de 200ms, nem token de blur de entrada. Todas as opções usam os mesmos valores literais, declarados no relatório.

## Opção 1 · Fiel: rótulo no eixo
- **Tese:** o lembrete fica exatamente sobre o avatar, como a legenda de um botão.
- **Foco em cena:** a pílula fica centrada no eixo do avatar, e o texto é o ponto mais claro dentro dela. A barra e o foco em Program ficam como estão.
- **Referência:** nenhuma do catálogo.
- **Interação:** nenhuma (só visual).
- **Peças:** o `MainMenu`; uma pílula de uma linha centrada no avatar, 4px acima dele.

## Opção 2 · Alinhada à borda
- **Tese:** a pílula se apoia na mesma borda esquerda da barra, para ler como parte do menu e não como algo que flutua.
- **Foco em cena:** a borda esquerda da pílula fica alinhada à borda externa do avatar e cresce para dentro da tela. O texto ganha um eixo esquerdo comum com a barra.
- **Referência:** nenhuma do catálogo.
- **Interação:** nenhuma (só visual).
- **Peças:** o `MainMenu`; uma pílula alinhada à borda esquerda do avatar, 4px acima dele.

## Opção 3 · Irmã do botão
- **Tese:** a pílula tem a mesma altura e o mesmo raio do botão de perfil, como se fosse mais um botão do menu, só que quieto.
- **Foco em cena:** a proporção repete a do botão redondo, e o texto ganha corpo maior dentro dessa altura. A superfície continua um degrau acima, mais apagada que o botão.
- **Referência:** nenhuma do catálogo.
- **Interação:** nenhuma (só visual).
- **Peças:** o `MainMenu`; uma pílula da altura do botão, centrada no eixo do avatar, 4px acima dele.

## Opção 4 · Contraponto: dois degraus
- **Tese:** testa até onde vai o "um degrau acima": a superfície sobe dois ou três degraus, ainda escura, para a forma ser lida de longe.
- **Foco em cena:** a forma passa a ajudar o texto na leitura, mas continua mais apagada que o botão em foco.
- **Referência:** nenhuma do catálogo.
- **Interação:** nenhuma (só visual).
- **Peças:** o `MainMenu`; uma pílula centrada no eixo do avatar, com a superfície dois ou três degraus acima do fundo.

Verificação: abrir a página ao vivo e ver as 4 opções com a entrada em loop. Conferir os 4px até o botão, o blur de 2px saindo para nítido em 200ms e a saída quando o foco vai para a esquerda.
