Pedido: "4 opções para o componente existente do kit Content Card, story 'Tabela de campeonato' (src/ui-kit/ContentCard.stories.tsx, Figma 6371:7480, 288×410), explorando o posicionamento de um selo de patrocínio."

Componente existente: Content Card, story "Tabela de campeonato": cabeçalho "Campeonato Brasileiro · Rodada 28" com colunas Pts/J/V, 9 linhas de time (`TableCell`) e `ContentCardFooter` com a legenda "Clique para ver mais" centralizada.
Superfície: Content Card (a mesma em todas as opções; painel alto 288×410).

Para quê e onde: mostrar a tabela do campeonato com um selo de patrocinador ("Oferecimento" + logo) como apoio, na tela de TV.
Intenção: sentir a tabela como protagonista e o patrocínio como assinatura quieta. Não quer: cobrir a tabela, parecer banner, crescer o card além de 410px.
Foco: a tabela (as 9 linhas de time). O selo é apoio.
Controle: o anúncio é só visual, sem interação. O card segue como hoje (um clique mostra os próximos 9 times).
Estados: repouso e foco do kit, como hoje; o selo não muda entre eles.
Conteúdo: o da story (Campeonato Brasileiro, Rodada 28, 9 times); selo "Oferecimento" + logo monocromática de exemplo (marca fictícia, 16px de altura).
O que varia: só a posição e a composição do selo. A tabela, o card e os 288×410 ficam iguais.
Suposição: sem DialKit; 4 opções; as opções 1 a 3 usam a mesma composição nova de rodapé (legenda e selo na mesma linha), só mudando lados/conteúdo.

**Direção visual**
- Tom: rodapé dividido, logo em neutro, selo discreto · temperatura: neutra. A logo sai no tom da legenda, sem a cor da marca, e o único acento do card fica na tabela.
- Fio condutor: as 9 linhas de time e os 410px ficam intactos; o selo divide uma zona que já existe e nunca custa uma linha nem um pixel de altura.
- Referência principal: repertório: "Quiet corner" (1), com a legenda do "Magazine spread" (11), no lugar de uma referência que não houve · teoria confirmada: (a) o selo divide a linha do rodapé com "Clique para ver mais", na mesma linha de base e com 0px de altura a mais; (b) logo monocromática, no tom secundário da legenda; (c) escala sussurro, com logo de 16px de altura, ≈2–3% da área do card.
- Levar: rodapé dividido. "Clique para ver mais" e "Oferecimento + logo" ocupam a mesma linha do `ContentCardFooter`, com a mesma linha de base e uma ponta em cada lado. A legenda centralizada de hoje passa a ser alinhada às margens.
- Levar: tipografia no piso do kit. "Oferecimento" usa o mesmo `footnote-medium` em `text-secondary` da legenda do rodapé, de modo que as duas legendas tenham um só tamanho e um só peso. É o menor `.text-*` permitido e não existe estilo de 10px.
- Levar: logo de 16px de altura, monocromática, na cor da legenda, sem placa, contorno nem fundo próprio. A logo fica no máximo tão alta quanto a altura de linha da legenda e não empurra o rodapé.
- Levar: a ordem de leitura é título → linhas de time → rodapé. O selo é visto por último, depois da 9ª linha.
- Evitar: perder a 9ª linha. Seria a página cair para 8 times para abrir uma faixa própria de ≈32px para o selo.
- Evitar: parecer banner. Seria uma faixa de fundo, uma caixa, um fio ou a cor da marca isolando o selo do resto do card.
- Evitar: cobrir a tabela ou crescer o card. Seria o selo encostado ou sobreposto à última linha de time, ou o card passar de 410px.
- Palavras do designer: "divide a linha do rodapé", "logo em neutro, sem cor", "sussurro, logo de 16px", "9 linhas e 410px intactos", "a legenda segue o piso tipográfico do kit (sem 10px; use o menor .text-* permitido)"
- Inegociável: a 9ª linha de time continua na página, e o card continua com 288×410.
- Teste de fidelidade: no PNG, contando as linhas de time, aparecem 9, o card mede 410px e o selo (palavra + logo de 16px em neutro) está na linha do rodapé sem faixa, caixa ou cor própria?
- Distância por opção: 1 fiel (rodapé dividido: legenda à esquerda, "Oferecimento + logo" à direita) · 2 reinterpretada (rodapé dividido com os lados trocados: o selo à esquerda, alinhado ao eixo dos nomes de time, e a legenda à direita) · 3 reinterpretada (rodapé dividido só com a logo, sem a palavra "Oferecimento": a legenda à esquerda e a logo de 16px fechando a margem direita) · 4 contraponto (inverte "divide o rodapé": o selo vai para o canto direito da linha do título no cabeçalho, acima das colunas Pts/J/V, mantendo 9 linhas, 410px, logo em neutro e 16px)
- Conflitos e quem decidiu: a escala sussurro de 10px que eu tinha proposto não serve, porque o piso do kit é `.text-footnote-*`. Quem decidiu foi o designer, ao pedir o menor `.text-*` permitido. A legenda do rodapé, hoje centralizada, passa a ser alinhada às margens nas opções 1 a 3 para caber o selo, como consequência direta de "divide a linha do rodapé".
- Pendente no sistema: o `ContentCardFooter` só aceita uma legenda centralizada e não tem lugar para um segundo item. As opções 1 a 3 precisam dessa composição; não pode ser uma solução diferente em cada opção.

## Opção 1 · Rodapé dividido, selo à direita
- **Tese:** a legenda fica na margem esquerda e "Oferecimento + logo" na direita, na mesma linha de base: o patrocínio assina o canto sem ocupar altura.
- **Foco em cena:** as 9 linhas seguem como únicas âncoras (tamanho e contraste intactos); a legenda e o selo recuam no mesmo tom `text-secondary`, a 12px; nada ao redor das linhas muda.
- **Referência:** nenhuma do catálogo (repertório: "Quiet corner" + legenda do "Magazine spread").
- **Interação:** nenhuma (só visual); o clique do card segue como hoje.
- **Peças:** legenda alinhada à esquerda; palavra "Oferecimento" em `footnote-medium`; logo neutra de 16px; linha única de rodapé.

## Opção 2 · Rodapé dividido, selo à esquerda
- **Tese:** o selo abre a linha do rodapé alinhado ao eixo dos nomes de time, e a legenda de ação fecha à direita: a assinatura vem antes, a ação por último.
- **Foco em cena:** a tabela continua a âncora; o selo herda o eixo vertical dos nomes e vira parte da coluna, não um objeto à parte; a legenda recua à direita.
- **Referência:** nenhuma do catálogo (repertório: "Quiet corner" espelhado).
- **Interação:** nenhuma (só visual).
- **Peças:** "Oferecimento + logo" à esquerda no eixo dos nomes; legenda alinhada à direita; mesma linha de base; mesma composição de rodapé da opção 1.

## Opção 3 · Rodapé dividido, só a logo
- **Tese:** sem a palavra, a logo de 16px sozinha fecha a margem direita: o patrocínio é reconhecido sem texto extra.
- **Foco em cena:** a tabela domina; o rodapé fica com uma legenda e um sinal, o mais silencioso dos três; a logo é a única peça não textual e recua em neutro.
- **Referência:** nenhuma do catálogo (repertório: "Quiet corner").
- **Interação:** nenhuma (só visual).
- **Peças:** legenda à esquerda; logo neutra de 16px na ponta direita; mesma linha de base e mesma composição da opção 1.

## Opção 4 · Selo no cabeçalho
- **Tese:** o selo sai do rodapé e entra no canto direito da linha do título, acima de Pts/J/V; o rodapé fica como hoje e a leitura começa com a assinatura.
- **Foco em cena:** as 9 linhas e as colunas Pts/J/V seguem como destaque; o selo recua em neutro, 16px, sem tocar nas colunas; o rodapé centralizado fica intacto.
- **Referência:** nenhuma do catálogo (contraponto às opções 1 a 3).
- **Interação:** nenhuma (só visual).
- **Peças:** título e subtítulo como hoje; "Oferecimento + logo" (ou só a logo, se não couber sem empurrar o título) no canto direito da linha do título; colunas Pts/J/V sem mudar; rodapé como hoje.
