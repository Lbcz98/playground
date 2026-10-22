# tipografia-de-detalhe
Tags: quebra de linha, números que mudam, alinhamento óptico, texto claro sobre escuro
Padrão: nenhum
Resumo: ajustes pequenos no texto (quebra, numerais, suavização, alinhamento óptico) somam e fazem a interface parecer melhor.
Fonte: destilado do artigo "Details that make interfaces feel better", de Jakub Krehel (jakub.kr), e das explorações do perfil de áudio · 2026-10-22
Vale para: qualquer card com texto de mais de uma linha, números que mudam e ícone ao lado de texto

## Cerne
Uma interface boa raramente vem de uma coisa grande: vem de muitos detalhes pequenos que se somam. Na tipografia, cada detalhe costuma ser uma propriedade de CSS que corrige algo que a pessoa sente e não sabe nomear: uma palavra solta na última linha, um número que pula quando muda, um ícone que parece fora do lugar ao lado do texto.

## Receita
- Título: quebra equilibrada (`text-wrap: balance`), para as linhas ficarem com comprimentos parecidos.
- Frase ou parágrafo: `text-wrap: pretty`, para a última linha não ficar com uma palavra só. Com título e descrição, use os dois: equilibrada no título, `pretty` na descrição.
- Número que muda (total, contagem, horário): numerais tabulares (`font-variant-numeric: tabular-nums`), para os dígitos terem a mesma largura e nada pular quando atualiza. Em algumas fontes, como a Inter, o desenho dos numerais muda com isso: confira o resultado.
- Texto claro sobre fundo escuro: suavização em escala de cinza (`-webkit-font-smoothing: antialiased`), uma vez para o documento inteiro, para o texto sair mais fino e nítido no macOS.
- Alinhamento óptico: ícone ao lado de texto se alinha pelo olho, não pela caixa. Dê um pouco menos de respiro do lado do ícone, ou corrija no próprio SVG; formas como triângulos e círculos pedem um ajuste pequeno e próprio.
- Cada detalhe é pequeno e o efeito é o conjunto: não pare no primeiro.

## Uso no kit
- Tamanho e peso vêm das classes `.text-*` (veja `ancora-e-apoio`); estes ajustes entram junto, nas propriedades de quebra e de numerais do elemento, nunca como um tamanho novo.
- As classes `.text-*` do kit não definem `text-wrap`: ponha `text-wrap: balance` no título e `text-wrap: pretty` na frase, no CSS da opção. O `check-explore-layout` falha com `quebra` quando um texto de duas linhas ou mais não tem nenhum dos dois.
- Numerais: `font-variant-numeric: tabular-nums` no total, na variação e em qualquer número que mude com o foco.
- Ícone ao lado do nome: `--dimension-size-semantic-icon-sm`, no grupo do nome, com o ajuste óptico no respiro do lado do ícone.

## Ajuste
- A quebra equilibrada vale para blocos curtos; em frases longas use `pretty`.
- Numerais tabulares só onde o número muda; num número fixo, deixe o desenho padrão da fonte.
- A suavização é decisão do documento, não de cada opção: se o kit ainda não a define, proponha a mudança no layout. Não verificado: o efeito na TV real, já que a propriedade com `-webkit-` age no macOS.
