# saude-anel-metricas-e-barras
Tags: título como conclusão, métrica com tendência, semana com hoje destacado, interruptores
Padrão: Lista de métricas
Resumo: Três telas de saúde em que o título já é a conclusão ("Ready for a run") e os números embaixo são a prova.
Fonte: imagem fora do repositório · 2026-10-15

## Cerne
Cada tela começa com uma frase-resposta em tamanho de título e um subtítulo que a explica; o gráfico e os números vêm depois, como evidência. O painel do meio é o mais instrutivo: três métricas em lista, cada uma com nome, valor grande com unidade, comparação em palavras e um mini-gráfico de tendência que termina num ponto (o valor de hoje). Os outros dois ensinam o anel com pontuação + barra de fases (esquerda) e a semana com o dia atual invertido + interruptores + ação (direita).

## Peças
- **Esquerda (sono):** hora, título + subtítulo, anel com nota no centro ("86 / Good"), barra horizontal segmentada em quatro fases, legenda em grade 2×2 (ponto + nome + duração). Cinco peças.
- **Meio (prontidão):** hora, título + subtítulo, três linhas de métrica (nome / valor + comparação / mini-gráfico à direita), frase de conselho no rodapé. Quatro peças; as três métricas são um grupo.
- **Direita (semana):** hora, título + subtítulo, sete barras com letras dos dias (a última preta), duas linhas de interruptor, botão largo "Start wind down". Cinco peças.

## Tipografia
- Uma família sem serifa humanista; quatro tamanhos (estimado): título, valor de métrica, texto de apoio, rótulo pequeno.
- Título cerca de 1,6× o subtítulo (estimado), peso semibold; subtítulo regular em cinza.
- Valor da métrica ("52 bpm", "64 ms", "+0.1°") cerca de 1,5× o nome da métrica e em peso maior; a comparação ("3 below average", "Up 9", "Usual range") vem na mesma linha de base, cerca de metade do tamanho, em cinza. A unidade fica no mesmo tamanho e peso do número.
- O nome da métrica fica acima do valor, em texto de apoio escuro.
- Nota "86" no anel cerca de 2× a palavra "Good" (estimado), que fica em cinza logo abaixo.
- Legenda do sono: nome em cinza, duração em preto, mesmo tamanho.
- Durações escritas com espaços ("7 h 48 m"), e o título da direita usa o mesmo formato.
- Frase de conselho do meio em tamanho de subtítulo, preta, em duas linhas.

## Posição e espaço
- Todos os textos na mesma borda esquerda; só o mini-gráfico e o interruptor ancoram à direita.
- Ritmo vertical igual nas três telas: hora no topo, título num mesmo nível, conteúdo no meio, ação ou conclusão no rodapé. As três podem ser lidas lado a lado.
- Métricas: cada linha ocupa cerca de 1/6 da altura (estimado); o gap entre métricas é cerca de 2× o gap entre nome e valor.
- Mini-gráfico com cerca de 1/4 da largura (estimado), alinhado verticalmente com o nome e o valor da linha.
- Barras da semana: sete colunas iguais com raio total, gap cerca de 1/3 da largura da barra; letras centradas embaixo.
- Barra de fases do sono: segmentos com vãos brancos finos e pontas arredondadas só nas extremidades.
- Botão de rodapé em largura total, pílula, dentro da margem.

## Cor e superfícies
- Um acento (amarelo-limão) e três neutros (preto, cinza médio, cinza claro).
- O amarelo marca o que está "bom/ligado": arco do anel, fase REM, interruptores ligados, botão de ação. Isso mistura dado e controle na mesma cor.
- Preto marca o "hoje" na semana (barra M e letra M em negrito) e a fase Deep.
- Cinza claro é o restante do anel, as barras dos outros dias e a fase Awake: tudo que é fundo ou passado.
- Mini-gráficos em cinza escuro com ponto preto no fim; nenhuma cor de bom/ruim.
- Telas brancas com borda finíssima cinza, sem sombra.

## Hierarquia e leitura
Título (conclusão) → subtítulo (por quê) → evidência (anel, métricas, barras) → ação ou conselho. A hora no topo é pequena e fica de fora da leitura.

## Interação
- **Visível:** dois interruptores ligados; botão de ação; hoje destacado nas barras.
- **Inferido:** abrir uma métrica no lugar para ver o gráfico maior; ligar e desligar os interruptores; percorrer os dias da semana. Nenhum foco ou estado aberto aparece.

## Minúcias
- O mini-gráfico termina num ponto cheio: "hoje" é o fim da linha, ligado ao valor da esquerda.
- A comparação é escrita em palavras e sem cor (não usa verde/vermelho para "abaixo da média").
- O anel começa no topo e a parte que falta fica em cinza claro, à esquerda do topo.
- A barra de fases termina num pedaço cinza muito claro (Awake), quase invisível.
- O botão "Start wind down" tem um leve degradê e borda clara, a única peça com algum relevo.

## Por que funciona
- **Ordem por importância** (better-layout): a conclusão vem primeiro, em frase, e o dado depois.
- **Valor forte, apoio fraco** (better-typography): número maior e pesado, comparação menor e cinza na mesma linha de base.
- **Agrupar com espaço** (better-layout): métricas separadas só por espaço, sem divisores.
- **Uma ação preenchida por tela** (better-colors): o botão amarelo é o único preenchimento grande.

## Receita
1. Escreva o título como a conclusão, e use o subtítulo para o motivo.
2. Em cada métrica: nome acima, valor a cerca de 1,5× o nome, comparação em palavras ao lado com metade do tamanho e em neutro.
3. Ponha a tendência à direita, pequena, terminando num ponto que é o valor atual.
4. Marque "hoje" invertendo a cor de um item numa fileira de iguais neutros.
5. Mantenha as telas irmãs no mesmo ritmo vertical: mesmo topo, mesmo nível de título, ação no rodapé.
6. Separe linhas por espaço, com gap entre linhas cerca de 2× o gap dentro da linha.
Lição: título-conclusão + valor com comparação + tendência que termina em hoje. Só aparência: o amarelo-limão, o anel, a hora no topo.

## Falhas
- O amarelo significa ao mesmo tempo "fase REM", "pontuação", "ligado" e "ação": uma cor com quatro sentidos.
- Os interruptores ligados mostram o estado só pela cor e pela posição, sem texto.
- A fase Awake e a parte vazia do anel quase somem no fundo.
