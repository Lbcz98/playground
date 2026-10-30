# ponto-focal
Tags: grupo focal, objetivo do componente, informação principal, destaque, peso visual, hierarquia, olho primeiro, teste de apertar os olhos
Padrão: nenhum
Resumo: todo componente tem um objetivo e um grupo de informação que o cumpre; esse grupo é o destaque, com peso em várias alavancas ao mesmo tempo, e o resto recua.
Fonte: devolutiva do designer sobre a exploração previsao-do-tempo (tudo com o mesmo peso) · 2026-10-27
Vale para: qualquer card ou tela; numa fileira de escolha o grupo focal é o escolhido, sempre com o dado principal junto

## Cerne
Um componente existe para uma coisa. O **grupo focal** é o conjunto de informações que cumpre essa coisa (na previsão do tempo: a temperatura de agora com o local). Ele é a atração do componente: o olho chega nele primeiro, de longe, sem procurar. Quando tudo tem o mesmo peso, nada é visto e o componente parece uma lista, por mais bonito que cada pedaço seja. Âncora (`ancora-e-apoio`) é a razão de tamanho dentro do grupo; esta regra decide **qual** é o grupo e **quanto o card inteiro gira em torno dele**.

## Receita
- **O grupo vem do designer, nunca de palpite.** Objetivo e informação principal são a primeira pergunta da entrevista. Resposta "tudo" ou dois grupos: pergunte qual vem primeiro. Sem resposta, o brief não está pronto.
- **É um grupo, não só um número.** O que o designer chamou de principal (ex.: temperatura e cidade) fica junto, num bloco só, com a mesma proximidade; o ícone ou a imagem que conta a mesma coisa entra no grupo.
- **Destaque por pelo menos 3 alavancas ao mesmo tempo**, nunca só tamanho:
  1. tamanho e peso: o dado principal a 2× o apoio (3× se for número curto), em negrito, o único no peso forte;
  2. espaço: a maior área livre do card é em volta do grupo; ele não encosta em mais nada e não divide a linha com outra peça;
  3. posição: ele ocupa o ponto onde o olho começa (o canto de partida ou o centro óptico) e o resto se alinha a ele;
  4. contraste e cor: só ele em contraste cheio e, quando o card tem cor ou imagem, só nele ela acontece (o resto fica neutro);
  5. massa visual: a maior imagem, ícone ou forma do card trabalha para o grupo, nunca para um detalhe;
  6. movimento: só ele pode ter uma animação em repouso, discreta.
- **O resto recua em pelo menos duas alavancas** (menor, mais suave, mais perto da borda, menos cor) e se junta numa única faixa quieta. Nenhum segundo grupo com o mesmo tamanho, contraste ou massa do focal. Três blocos parecidos lado a lado são um defeito.
- **O foco do controle não muda o grupo focal.** Se a interação troca o dado (outro dia, outra hora), o grupo continua no mesmo lugar e no mesmo peso; o que mudou é o conteúdo dele. O anel do kit marca onde o controle está, não o que é a atração.
- **Teste de apertar os olhos.** Olhe o PNG da opção pequeno ou desfocado: a primeira coisa que aparece tem de ser o grupo focal. Se aparecem dois pontos, ou nenhum, ou o primeiro é o ícone de um detalhe, refaça o peso, não acrescente enfeite.
- **As opções de uma exploração têm o mesmo grupo focal** (o do brief); mudam a tese, a referência e a interação, isto é, **como** o foco é encenado.
- Relato: uma linha `Foco: <grupo> · alavancas: <as usadas>` por opção.

## Uso no kit
- Grupo: o dado em `.text-display-lg-*` ou `.text-display-md-*` quando é um número focal (a altura do algarismo, de 10% a 25% do card, é o que o faz arquitetura); senão `.text-heading-3-bold`; para o dado, rótulo e local em `.text-body-sm-medium`/`.text-footnote-medium` no mesmo bloco, lado a lado ou empilhados, com o mesmo `gap` curto.
- Espaço: o vão entre o grupo focal e a faixa quieta é o maior passo de `--dimension-spacing-core-*` que o card comporta; dentro do grupo, o menor (`grupo-por-espaco`).
- Recuo: `--color-semantic-functional-text-muted` para o apoio; ícones pequenos de apoio na mesma cor; só o grupo focal em `--color-semantic-functional-text-primary`.
- Imagem: a ilustração ou foto grande é do grupo; use o scrim do kit (`DESIGN.md`, imagem) para o texto focal ler sobre ela.

## Ajuste
- Fileira de escolha (dias, perfis): o focal é o item escolhido com o dado principal à vista; os outros ficam em contraste cheio (`ancora-e-apoio`), só sem a massa e o espaço do focal.
- Dois objetivos de verdade iguais: não fabrique dois focais; pergunte ao designer ou separe em dois estados do card.
- Card muito pequeno: duas alavancas (tamanho e espaço) bastam, desde que o resto fique em uma só faixa.
