# medidor-com-escala-e-marcador
Tags: número herói com contexto, escala de traços, marcador de posição, frase de comparação
Padrão: Marcador em escala
Resumo: Um valor grande, uma escala de traços que se colore até onde o valor chega, um marcador em cima e uma frase que diz o que o número significa.

## Cerne
O número sozinho não diz se é bom; o card responde isso três vezes, de jeitos diferentes: a variação contra o período anterior, a posição numa escala de ruim a perfeito, e uma frase comparando com a mediana. A escala é feita de traços discretos para que "quanto falta" seja visível como traços apagados, não só como um fim de barra.

## Peças
Sete peças em três grupos. Cabeçalho (título, expandir, fechar). Superfície interna (número, seletor "7 days", variação, rótulo de meta + pílula, escala com marcador e rótulos das pontas, divisória tracejada, frase). Rodapé (menu, divisória vertical, dois ícones, "BASED ON").

## Tipografia
- Duas famílias: sem serifa para título, número e seletor; monoespaçada em caixa alta com espaçamento aberto para todo texto de apoio.
- Quatro tamanhos (estimado): número cerca de 3,5× o texto mono; título e seletor cerca de 1,4× o mono; mono em um só tamanho.
- O número é leve ou regular, não negrito: o tamanho já basta. O "%" fica no mesmo tamanho e peso, colado.
- A variação começa com seta, e "+4.9%" divide a linha com "VS LAST 7 DAYS": valor e contexto na mesma voz mono.

## Posição e espaço
- Eixo esquerdo único dentro da superfície (número, variação, escala, POOR, frase); eixo direito para seletor, meta, PERFECT e "BASED ON".
- Linhas pareadas: número ↔ seletor no topo; variação ↔ meta numa só linha de base; POOR ↔ PERFECT sob as pontas da escala.
- Escala ocupa toda a largura interna, cerca de 1/8 da altura da superfície (estimado).
- Vão número→variação pequeno; variação→escala cerca de 2× maior; escala→frase separado por uma divisória tracejada com vão igual dos dois lados.
- Superfície interna aninhada no card com margem estreita; raio externo maior que o interno (próximo do concêntrico).

## Cor e superfícies
- Neutros: fundo do card quase preto, superfície interna um passo mais clara com borda fina; texto branco (número, título) e cinza (todo o mono de apoio).
- Um verde semântico, "bom", repetido em quatro lugares: variação, pílula "60%", marcador e o "79%" dentro da frase.
- A rampa vermelho→laranja→amarelo→verde existe só nos traços preenchidos; cada traço tem a cor da sua posição, não do valor. Os traços depois do marcador ficam cinza escuro.
- A pílula da meta tem fundo verde translúcido e texto verde: cor no fundo em baixa opacidade para não virar botão.
- Seletor "7 days" é contorno neutro: controle sem cor.

## Hierarquia e leitura
Número → escala colorida (a maior mancha de cor) → variação verde → frase → rodapé. Título e ações do cabeçalho são lidos rápido e esquecidos.

## Interação
Mostrado: um cursor de mouse perto do número, sem estado de hover visível. O seletor de período e os ícones implicam troca de período, expandir e compartilhar. Infiro que o marcador e o preenchimento se movem com o valor ao trocar o período.

## Minúcias
- O marcador é um triângulo verde apontado para baixo, exatamente sobre o último traço aceso.
- Os traços acesos terminam no verde, que é a mesma cor de "bom" do resto do card: a rampa e a semântica se encontram no ponto do valor.
- Na frase, só o número "79%" ganha cor; o resto fica cinza.
- A divisória tracejada é mais fraca que a borda da superfície: separa ideias, não superfícies.
- "BASED ON: 12,430 USERS" dá a base da medida no canto mais quieto.

## Por que funciona
Ordem por importância (better-layout): o número que a pessoa veio ver está no topo e à esquerda, grande. Uma cor, um significado (better-colors): o verde é sempre "bom", e a cor só aparece onde há julgamento. Contraste de função entre famílias (better-typography): sem serifa para o dado, mono caixa alta com espaçamento para o apoio. Agrupamento por espaço e por superfície interna, com a linha tracejada só onde o espaço não bastava.

## Receita
- O valor principal vai a pelo menos 3× o texto de apoio, em peso regular.
- Dê ao número três contextos: variação, posição numa escala e uma frase comparativa.
- Faça a escala em traços discretos; acesos até o valor, apagados depois.
- Pinte cada traço aceso pela sua posição na rampa; o traço do valor tem a cor semântica do julgamento.
- Use um único acento semântico e repita-o em tudo que diz "bom"; o resto fica neutro.
- Coloque pares nos dois eixos (esquerda: dado; direita: contexto ou controle) na mesma linha de base.
- Lição: valor + escala + frase. Aparência a não carregar: a fonte mono, a rampa de semáforo, o cartão escuro.

## Falhas
- A meta (60%) está escrita, mas não marcada na escala; o leitor não vê a distância entre valor e meta.
- Rótulos e frase em cinza miúdo caixa alta sobre quase preto: contraste e legibilidade fracos.
- Os ícones do rodapé não têm rótulo e são ambíguos.
- A rampa vermelho-verde é o único portador de "ruim/bom" na escala para quem não distingue essas cores (os rótulos POOR/PERFECT ajudam só nas pontas).
