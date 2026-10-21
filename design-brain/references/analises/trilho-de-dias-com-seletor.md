# trilho-de-dias-com-seletor
Tags: trilho de dias, marcador por dia, filtro segmentado acima, frase-resumo com o número em destaque
Padrão: Trilho de passos
Resumo: uma semana em sete pílulas; cada dia diz se tem conta (ícone da marca) ou não (círculo tracejado), e o dia selecionado inverte a cor.
Fonte: imagem fora do repositório · 2026-10-15

## Cerne
A semana vira uma fileira de sete casas iguais; o que importa (há conta ou não, e de quem) mora num pequeno espaço fixo dentro de cada casa. A frase acima resume a fileira em palavras ("3 bills … next 7 days"), então o leitor tem a conta antes de olhar os dias. O dia escolhido é o único escuro.

## Peças
Seis peças, em quatro grupos:
1. Cabeçalho: título "Bills" à esquerda, dois botões redondos de ícone (ajuda, ajustes) à direita.
2. Barra de controle: seletor segmentado "Upcoming Bills / All Bills" à esquerda, "Sort" com seta à direita.
3. Frase-resumo.
4. Trilho (um grupo, numa bandeja): letras dos dias em cima, sete pílulas com número + marcador embaixo.

## Tipografia
- Quatro tamanhos, dois pesos (estimado). Título "Bills" é o maior e o mais pesado (~1,4× os rótulos dos controles, estimado).
- Segmentos e "Sort" no mesmo tamanho; o segmento ativo em texto escuro, o inativo em cinza.
- Frase em cinza, com "3 bills" em negrito e preto: o número e a unidade sobem juntos, o resto fica atrás.
- Letras dos dias (M T W T F S S) em maiúscula, negrito, menores que os números; números dos dias em regular, ~1,2× as letras (estimado), centrados.

## Posição e espaço
- Um eixo esquerdo: "Bills", seletor, frase e bandeja começam no mesmo x. Um eixo direito: botões de ícone, "Sort" e borda da bandeja fecham no mesmo x.
- Pílulas: sete, mesma largura e altura (altas, ~1,3× a largura, estimado), raio total, passo igual; o vão entre pílulas é ~1/4 da largura delas (estimado).
- Cada letra fica centrada sobre a sua pílula: coluna = dia.
- Dentro da pílula, número em cima e marcador embaixo, os dois centrados; o marcador ocupa sempre o mesmo lugar, tenha conta ou não.
- Vãos: cabeçalho → controles e controles → frase são maiores; frase → bandeja menor; letras → pílulas menor ainda. Grupo pelo espaço.
- A bandeja tem raio grande e padding curto em volta das pílulas; o card tem raio ainda maior: raios aninhados crescem para fora.

## Cor e superfícies
- Quase tudo neutro: card branco, bandeja cinza muito claro, pílulas brancas sobre ela, controles brancos com sombra leve.
- Uma inversão: o dia selecionado é pílula preta com número branco. É a única peça escura grande.
- A cor saturada vem só dos ícones das contas (verde, azul, roxo, um por serviço). A cor é identidade do serviço, não estado.
- Dias sem conta mostram um círculo tracejado cinza: o "vazio" tem forma, não é ausência.
- Segmentado: trilha cinza, segmento ativo branco elevado com sombra. Botões de ícone: círculos cinza claro preenchidos, sem borda.

## Hierarquia e leitura
1. A pílula preta (10).
2. "Bills" e "3 bills" (negritos).
3. Os ícones coloridos nos dias 11 e 15.
4. Controles, letras, números restantes.

## Interação
- Mostra: o dia 10 selecionado (invertido) com um cursor sobre ele; o segmento "Upcoming Bills" ativo.
- Infiro: mover entre os dias passa a inversão para o dia seguinte; escolher um dia com conta mostra o detalhe dela (valor, nome). Os segmentos trocam o conjunto mostrado; "Sort" abre opções. O cursor não diz se o preto é foco ou escolha.

## Minúcias
- Três ícones (dias 10, 11, 15) batem com "3 bills" da frase.
- O círculo tracejado tem o mesmo diâmetro dos ícones: casas cheias e vazias têm a mesma geometria.
- No dia selecionado, o ícone verde continua colorido sobre o preto; só fundo e número invertem.
- A letra do dia selecionado (T) parece um pouco mais escura que as outras (estimado).
- O card fica sobre uma foto desfocada; a bandeja dá um segundo plano dentro do branco.

## Por que funciona
- Ordem por importância (better-layout): a resposta em palavras vem antes do detalhe por dia.
- Casas iguais com um espaço fixo para o marcador: a fileira é lida como uma tabela de uma linha, comparando presença e ausência.
- Uma cor, um significado (better-colors): neutro = estrutura, preto = selecionado, cor = qual serviço.
- Raios concêntricos (better-ui): card > bandeja > pílula, cada um maior que o de dentro.

## Receita
- Use uma casa por dia, todas iguais, em passo regular, com a letra do dia centrada em cima.
- Reserve um espaço fixo na casa para o marcador e desenhe o vazio (contorno tracejado) no mesmo tamanho do cheio.
- O selecionado inverte fundo e número; o marcador mantém a cor dele.
- Resuma a fileira numa frase acima, com o número e a unidade em negrito e o resto apagado.
- Ponha as casas numa bandeja um degrau mais escura que o card, com raio entre o do card e o das casas.
- Cor saturada só para identificar o item (serviço), nunca para estrutura.
- Lição: fileira de casas + marcador presente/vazio + resumo em palavras. Só o visual do original: logos de marcas, preto puro, sombra dos controles.

## Falhas
- Não há diferença visível entre foco e escolhido: o cursor sobre o preto deixa as duas coisas iguais.
- O detalhe da conta do dia não aparece em lugar nenhum; a seleção não muda nada visível na imagem.
- O card é cortado embaixo: não se sabe o que vem depois do trilho.
