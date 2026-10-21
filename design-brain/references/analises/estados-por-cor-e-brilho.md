# estados-por-cor-e-brilho
Tags: fase codificada por matiz, esqueleto fixo com zona variável, visualização própria por fase, brilho como atividade
Padrão: Estado muda o card
Resumo: o mesmo card em três fases de um processo; cada fase tem um matiz próprio e uma visualização própria de progresso, sobre um esqueleto que não muda.
Fonte: imagem fora do repositório · 2026-10-15

## Cerne
O nome da fase e a cor dizem "onde o processo está" antes de qualquer número. O esqueleto (título e subtítulo no canto, alça embaixo) fica parado, então o olho reconhece o card; só a zona de dado muda, e muda de forma conforme o que cada fase tem para mostrar. O brilho difuso diz "isto está acontecendo agora".

## Peças
Três painéis, mesmo esqueleto de quatro peças:
1. Título da fase (Parsing / Planning / Reasoning) com o nome do modelo embaixo, canto superior esquerdo.
2. Zona superior direita: vazia (Parsing) ou lista de tarefas com duração alinhada à direita (Planning, Reasoning).
3. Zona inferior: três colunas rótulo/valor (Parsing), barra de progresso com botão (Planning), percentual grande + campo de partículas (Reasoning).
4. Alça curta centrada na borda de baixo.
O painel mais instrutivo é **Reasoning**: tem as duas zonas preenchidas e o dado principal (97%) com o maior tamanho de texto da folha.

## Tipografia
- Título da fase em negrito, ~2× o subtítulo (estimado); o subtítulo é regular, na mesma cor tingida do painel.
- Lista: nomes de tarefa em snake_case, regular; durações curtas ("1m") alinhadas à direita, mais apagadas.
- Reasoning: "97%" ~1,3× o título (estimado), negrito, com o "%" no mesmo tamanho do número.
- Parsing: rótulos (Tokens, Latency, Process) em texto claro e os valores embaixo menores e tingidos. A hierarquia está invertida: o rótulo pesa mais que o número.
- Números usam ponto como separador de milhar ("15.530") e unidade colada ("123ms").

## Posição e espaço
- Os três painéis têm a mesma largura, o mesmo raio grande e a mesma margem interna; o vão entre eles é ~1/4 da altura de um painel (estimado).
- Título sempre no mesmo canto e mesma altura; a lista começa a ~40% da largura (estimado) e as durações fecham na margem direita.
- Na lista, as três linhas têm passo igual e curto; as linhas formam uma coluna de nomes e uma de tempos.
- Parsing: três colunas de mesma largura, centradas, ancoradas embaixo.
- Planning: a barra ocupa a largura toda, dentro das margens, com raio de pílula; o botão é um círculo maior que a espessura da trilha.
- Reasoning: "97%" ancorado à esquerda embaixo; as partículas ocupam o resto da linha, à direita.
- A alça embaixo é centrada e igual nos três.

## Cor e superfícies
- Um matiz por fase: vermelho, verde-oliva, azul-violeta. Dentro de cada painel, tudo deriva do mesmo matiz (fundo escuro, brilho claro, texto tingido); não há segunda cor.
- Texto em dois níveis: claro (título, rótulos, lista em Reasoning) e tingido do matiz (subtítulo, valores, durações). Em Planning até o título e a lista vêm tingidos de amarelo-verde.
- O brilho é a camada de cima: um halo radial no Parsing, a luz da barra em Planning, um halo + pontos desfocados no Reasoning. É decoração com significado: "ativo".
- A barra de Planning tem trilha com borda clara fina e um botão de vidro; o preenchimento é a parte mais luminosa da folha.
- Profundidade por luz e não por sombra.

## Hierarquia e leitura
1. A cor do painel (lida de longe, antes do texto).
2. O título da fase.
3. A zona de dado: barra / percentual / colunas.
4. Subtítulo, lista e durações.

## Interação
- Mostra: três estados lado a lado, não a troca entre eles; uma barra com botão (sugere progresso ou arraste) e uma alça (sugere folha que se puxa).
- Infiro: o card passa de uma fase para a outra no mesmo lugar, trocando matiz e zona de dado; o brilho se move enquanto a fase roda. A ordem Parsing → Planning → Reasoning vem da leitura de cima para baixo.

## Minúcias
- O nome do modelo se repete igual nos três: é a âncora estável, por isso vai apagado.
- As durações "1m / 2m / 5m" são idênticas nas duas listas.
- O botão da barra tem um anel claro fino e um centro brilhante: parece vidro sobre luz.
- As partículas variam de tamanho e de nitidez, mais densas perto do número.
- A alça embaixo tem a cor do matiz em cada painel, não um cinza fixo.

## Por que funciona
- Uma cor, um significado (better-colors): cada matiz é uma fase e nada mais.
- Consistência de padrão (critique): o esqueleto fixo deixa a mudança de fase legível; só o que muda chama atenção.
- Ordem por importância (better-layout): o nome da fase no canto de entrada da leitura.
- Restrição de movimento (animations): o brilho é ambiente, mas o estado também é dito em texto (o título), então não depende da animação.

## Receita
- Fixe o esqueleto: título da fase no canto de entrada, subtítulo estável embaixo, mesma margem e raio em todas as fases.
- Dê a cada fase um matiz próprio e derive dele todas as camadas do painel; não misture um segundo matiz.
- Diga a fase em texto também; a cor nunca é o único sinal.
- Troque só a zona de dado, e escolha a visualização pelo que a fase tem: contadores, barra, percentual.
- O dado principal da fase vai pelo menos ao tamanho do título; rótulos ficam abaixo dele em peso e contraste.
- Listas: nome à esquerda, tempo na margem direita, passo curto e igual.
- Lição: esqueleto fixo + matiz por fase + zona variável. Só o visual do original: fundo inteiro tingido, halos, partículas, vidro.

## Falhas
- Parsing inverte a hierarquia: rótulos claros e grandes, valores menores e tingidos. O número deve pesar mais que o rótulo.
- Texto tingido sobre o brilho (valores do Parsing, subtítulos) fica com contraste baixo, sobretudo "123ms" sobre o halo.
- Durações repetidas nas duas listas parecem dado de preenchimento.
- A barra de Planning tem botão de controle, mas mostra um progresso medido: um botão sugere que dá para arrastar.
