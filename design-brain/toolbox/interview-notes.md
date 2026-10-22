# Notas da entrevista: playbook de design com IA

Idioma: português. Formato escolhido pelo designer: respostas longas e abertas.
Citações entre aspas são palavras do designer; "Inferência" marca interpretação minha.

## Contexto

- Papel: "um dos principais pontos de contato entre design e engenharia".
- Workflow: Figma. Desenha "de maneira mais livre", com "alinhamentos estratégicos com outros designers do time"; há um "afunilamento das ideias" até um ponto convergente; apresenta ao time com os devs; depois faz o hand-off com "comportamentos, fluxo, spec e protótipo".
- Como é julgado (pelo gestor): "qualidade da minha entrega" e fluidez da comunicação. Bom trabalho: "o time recebe todas as informações de maneira eficiente, com um arquivo de hand-off útil para eles utilizarem dentro de seus fluxos agênticos".
- "A barra da entrega do design geralmente é medido pelo próprio designer, então é importante ter um senso crítico apurado." (Inferência: não há um juiz externo; o juiz do playbook substitui/duplica o senso crítico do próprio designer.)
- Os devs consomem o hand-off com agentes (Inferência: o hand-off é lido por IA, então precisa ser estruturado/explícito).

## Design para TV

- Diferença central: "o padrão de interação é completamente diferente. A web permite uma variedade muito grande de componentes e interação, a TV exige que você foque um item por vez e com interações e desenhos bem mais minimalistas."
- "Desenhar um componente para TV tem o mesmo viés de design para mobile, o tamanho é pequeno, então cada pixel importa, cada informação ou interação precisa de uma intenção muito clara por trás." (Inferência: o espaço percebido é pequeno, então tudo precisa de razão de existir; liga com "questiono a intenção".)
- Espaço: "o espaço útil que um dispositivo de TV te entrega é grande mas desenhar para TV exige que você tente ocupar um espaço pequeno da tela." "O protagonista não é o componente e sim o conteúdo." (Regra de ouro candidata: o componente serve ao conteúdo e some.)
- Tipografia: legível "com até 3 metros de distância". Mobile mínimo 10-12px; TV 16-18px, "o mínimo do mínimo" 14px. (Preferência/lei? Perguntar. Confrontar com os tokens do kit.)
- "Qualquer elemento visual que tenha interação de mouse ou que não comunique imediatamente a sua intenção, quebra em TV."
- Estados na TV: "focado, padrão e desabilitado" (poucos). Sem hover. "Algumas TVs rodam em browsers antigos e não aceitam animações, então pode ser que nem tenha um estado de carregamento no botão." (Contradição possível: o repo/regras usam "item escolhido marcado com check" = 4º estado, selecionado; e o kit tem movimento. Perguntar.)
- Focado x selecionado: são estados diferentes. "Todo botão na TV terá um estado de focado, independente se ele foi ou não selecionado." Selecionado = "o usuário intencionalmente clicou naquela opção", o que muda a presença de informações. "O check pode ser uma delas, mas não é uma regra"; pode mudar a label do botão. (Resolve a contradição: focado é sempre possível; selecionado é um 4º estado e o check é só um meio entre outros. Isso suaviza a regra do repo "check ao lado do nome": é preferência, não lei. A confirmar.)
- Movimento: simples, "dissolve", e "sempre garantir que a tela funcione sem ele". Motion serve "para comunicar a transição de uma tela ou estado para o outro".
- Navegação (LEI, "inaceitável"): "é inaceitável que um comando conflite com o outro". Dentro de um card com navegação interna, só ←/→; "o cima e baixo são comandos que podem servir para a navegação entre outros elementos da página".
- Cor (por quê): a tela da TV tem mais brilho, então "não usamos cores puras para não causar canseira na vista"; branco cai para off-white "tipo o #EEEEEE". TVs (OLED, LED com local dimming) têm contraste muito maior e "esmagam" sombras: "textos em cinza escuro sobre fundo preto ou gradientes sutis que você vê perfeitamente no Figma podem simplesmente desaparecer (virar um completo breu) na TV". (Inferência: nunca julgar contraste só pelo render no monitor; valores baixos de luminância perto do preto são proibidos; sem branco/preto puro.)
- Layout/margem segura/densidade: não deu números; apontou "melhor guia sobre layout": developer.android.com/design/ui/tv/guides/styles/layouts. (Aberto: números dele de margem e densidade.)
- Admira: Apple TV ("experiências ótimas para seus conteúdos", interatividade que divide a tela e toca 2 players ao mesmo tempo; "aproveitam a faixa inferior da tela dentro do player para posicionar itens na horizontal, como trilhos"). Amazon Prime em esportes: interatividade sobre o vídeo, "trabalham muito bem a lógica do foco e a quantidade de informação dentro da tela". (Não nomeou o que acha ruim.)
- Referências que ele indica (não lidas por mim ainda): developer.android.com/design/ui/tv; webostv.developer.lge.com/develop/guides/design-principles; smashingmagazine.com/2025/09/designing-tv-principles-patterns-practical-guidance/

## Princípios e gosto

- Caso real (mapa de calor da casa do BBB, demanda do time do programa, só uma imagem de PDF como brief): 1ª versão copiou o mapa de calor de programas esportivos (planta baixa, pontos por cômodo, rastro vermelho). Rejeitou a si mesmo: "não se alinhava com o tom do programa, o BBB é algo mais leve e não cabia um dado mais 'frio', a informação tinha que estar conectada com a narrativa do programa". 2ª versão: imagens 3D dos cômodos, setas ←/→ para trocar de cômodo, mostrando porcentagem e tempo total; o time do programa rejeitou. 3ª: planta baixa estilizada para combinar com o tom, marcadores por cômodo, mesma navegação por setas, porcentagem e tempo mudam a cada foco.
- Lição dele: "eu questiono mais a intenção por trás do desenho, geralmente os princípios de design são sempre respeitados e muito sólidos". (Inferência importante: o erro que ele pega não é de regra de design; é de intenção/tom/narrativa. As regras do kit cobrem o piso, o juiz precisa de uma pergunta de intenção em cima.)
- As regras do repo (gaps, padding, soft white, proximidade) ele não classifica como lei/preferência; reconduz todas a princípios: **contraste** ("cor rebaixada entre o título e a descrição ou no tamanho de elementos"), **proximidade** ("criação clara de agrupamentos de um mesmo tipo, ação mais próximo de ações, grupos textuais mais claros"; é onde entra o espaçamento; ref.: sistema de 4 pontos, medium.com/@jagadeeshj586/principles-of-spacing-in-ui-design-a-guide-to-the-4-point-spacing-system-3a859d965136), **hierarquia** ("quando a hierarquia está ruim, o design como um todo fica ruim"; por tamanho, cor ou tipografia), **divulgação progressiva** ("em TV é importantíssimo segmentar as informações, não é necessário apresentar tudo dentro do mesmo componente, às vezes vale mais criar paginação ou criar um trilho de cards e deixar o layout mais limpo").
- Decente x bom: "Tipografia é o principal dentro de um design"; quando não se presta atenção a "pesos, tamanhos e uso de diferentes fontes", "o layout pode soar como amador". Todo desenho deve ser criado olhando os 10 princípios de Dieter Rams (designmanifestos.org/dieter-rams-ten-principles-for-good-design/).
- Conflito entre princípios: "depende do objetivo que o componente está se prestando", mas na TV o padrão é "exercitar retirar elementos e deixar apenas aqueles que fazem mais sentido", sempre "levando em consideração o cenário em que o componente irá viver". Tensão central: retirar x "extremamente visuais". Fórmula dele: "No fim é preciso falar muito com pouco." (Regra de bolso: na dúvida, retira; o que fica tem que ser visual.)
- Dieter Rams, ordem de peso: 1) "Good design makes a product useful", 2) "Good design is aesthetic", 3) "Good design is unobtrusive". Ignora mais: "Good design is honest".
- Ordem de sacrifício num card de vídeo (home, objetivo "vender" o conteúdo rápido): "primeiro defino muito claramente seu objetivo"; fica, além da imagem: 1) título, 2) o que faz clicar ou querer saber mais: "selo de validação social, talvez com a avaliação do filme", 3) metadados de gênero. Descrição sai (vai para a página de detalhe, "outra etapa"). Ação sai: "o próprio card é um botão". (Regra: a ordem depende do objetivo da tela; o que sai de um card vive em outra etapa do fluxo.)
- Agentes: "as IAs de maneira geral sempre optam por mais, o trabalho acaba sendo podar a quantidade de elementos".
  - Ruim (imagem 1, seis opções de card do elenco: 'Linhas que abrem', 'Dois lados', 'Trilho do elenco', 'Órbita do elenco', 'Ficha ou história', 'De olho no elenco'): "componentes com 2 ou 3 tipos de interação, cores diversas, sem hierarquia, com muitos elementos na tela".
  - Bom (imagem 2, card de programação "Os Últimos Dias de Pompeia", gradiente azul, título, horário e selo 14, "Ao vivo · restam 28 min", abas Agora/Mais tarde): "trabalhando muito bem a área de respiro, deixando as seções muito claras (topo está a informação e em baixo as ações), com uma única interação e uma imagem sendo o principal chamariz".
  - (Inferência: o teste do bom = uma interação, uma imagem que chama, informação em cima e ação embaixo, respiro. O teste do ruim = mais de um tipo de interação por card, mais de uma cor de destaque, nenhum elemento mais forte que os outros.)
- LEI (ênfase dele): cards com até 3 padrões de interação DIFERENTES "não pode acontecer"; "o foco dos elementos [deve ser] extremamente minimalista". Já ocorreu "diversas" vezes. (Inferência: um padrão de interação por card; número exato a confirmar. Ele não deu números para cores ou elementos de texto.)
- Respiro (white space) é o que mais fez a boa opção se destacar, e ele não tinha pedido: "o respiro não foi algo que eu tinha especificado e foi justamente o que fez com que a opção se destacasse tanto". As opções ruins são "extremamente claustrofóbicas, com diversos elementos juntos, sem nenhum respiro, isso é horrível". (Vocabulário: claustrofóbico, respiro.)
- Reaproveita partes de uma exploração rejeitada na seguinte (conceito + padrão de navegação ficaram).

## Processo

- Divergir livre no Figma, convergir com outros designers, apresentar aos devs.
- Exploração: "como o Figma é uma ferramenta de canvas infinito, eu gosto de explorar bastante opção"; começa abrangente ("mais abrangente") e depois de uma análise vai "afunilando".
- Duas opções boas: "eu entendo o que de fato está me chamando mais atenção" (layout e hierarquia, ou escolha de cores) e "tento pegar os pontos fortes de cada e pensar em uma forma de juntar as duas e criar um híbrido". (Pergunta ao agente: o que atrai em cada uma; híbrido, não escolha de uma só.)
- Design critique bom: "todos entendem o objetivo do que está sendo proposto e opinam com base nisso". Só o time de design participa; às vezes pede que cada um "desenhe a sua versão do que eu fiz para ver outros pontos de vista". Comentário que ajuda: pontua "com objetividade o que o desenho está ajudando e se está atingindo o que o briefing pede", e se "está trazendo algo de novo para o sistema". Não ajuda: "coisas super específicas que tangem mais gosto pessoal do que avaliar a intenção por trás da escolha". (Inferência: o juiz do playbook deve avaliar objetivo/briefing/novidade para o sistema, e evitar gosto pessoal solto.)

- Referências: "diversas"; busca "coisas que me façam repensar o layout, testar novas formas de apresentar um mesmo dado, uso de cores, uso de elementos gráficos como cor e ícones". Fontes: bestdesignsonx.com, collectui.com, inspora.design. (Não disse o que nunca faz com uma referência.)
- Kit x ideia nova: abre mão "quando o que está sendo proposto tem um custo muito grande de desenvolvimento ou foge completamente da linguagem de design do produto". Quem decide incorporar ao sistema: "somos nós designers, avaliando e julgando a necessidade de aplicar o que está sendo proposto". (Inferência: desvio do kit é decisão humana de design; o agente propõe, não decide. Casa com `@deviation`/`@proposal` do repo.)

## Hand-off e qualidade

- Hand-off = comportamentos + fluxo + spec + protótipo. Deve ser útil a agentes dos devs.
- "Pronto" = (lista dele) mapeamento completo do componente: interações, cenários de uso e erros, comportamentos, estados; "ver ele sendo testado em algum protótipo" para conferir se bate com o que se quer; "se o fluxo até o componente está coerente"; "se as regras estão de fato sendo respeitadas"; "se o que foi construído é viável tecnicamente"; "se tem os tokens atrelados da maneira correta".
- Reclamações dos devs: "sempre porque algum dado ou cenário está faltando no Figma".
- No resultado construído, olha primeiro a interação ("interação é o principal meio de se interagir com um componente na TV, é o que eu mais avalio"), depois "se de fato está igual ao desenho proposto". (Ordem do juiz: 1 interação, 2 fidelidade visual.)
- Quando segura um desenho: "quando eu sinto que o que está sendo proposto não se encaixa com o objetivo da entrega". Reação: "olho, repenso e tento desconstruir o que eu fiz para entender em que parte está me gerando essa sensação e quais princípios eu deveria aplicar para mudar esse sentimento". (Inferência: o primeiro critério é adequação ao objetivo, antes de acabamento; o julgamento começa como sensação e depois vira princípio nomeado.)
- O que faz o hand-off útil: "informações descritivas do que está sendo proposto", "fluxo das telas", "quais interações terá naquele componente ou elemento".
- Os devs têm uma skill `figma-handoff` (arquivo `~/Downloads/figma-handoff/SKILL.md`, lido): o agente recebe prints exportados do Dev Mode do Figma (spec, variante, fluxo, dados), lê as imagens e escreve 4 arquivos md por Feature do Jira (`componentes.md`, `fluxo.md`, `contrato-dados.md`, `cards-propostos.md`). Intenção do designer: "que o handoff seja um arquivo md do que os designers estão criando para que o agente consiga compreender melhor" (hoje o agente "tira print do figma e tenta interpretar").
  - Padrões dessa skill que o playbook pode reaproveitar (inferência minha, não dito por ele): nunca estimar valor (três marcadores: `[NAO LEGIVEL — REEXPORTAR]`, `[VERIFICAR]`, `[PREENCHER NO REFINAMENTO]`); portão de qualidade antes de classificar; checkpoint humano com tabela por componente antes de escrever; nível de confiança ALTA/MEDIA/BAIXA; fonte citada por dado; "nunca decide regra de negócio".

## Trabalhando com agentes de IA

- Funciona: velocidade; "diversas ideias", "diversos tipos de layouts e formas que eu demoraria algumas horas para chegar".
- Falha: "o agente não é muito bom para interpretar". Com imagem de referência, "ele tenta copiar 100% e falta variedade"; não pega "os pedaços que formam um componente e cria com base nisso"; "sempre entrega um pouco mais do mesmo".
- Confia: "que ele vá criar coisas em cima de regras muito bem detalhadas, mas se faltar algo, o resultado já vai ser mediocre". Não confia: "que ele vá me entregar consistência".
- Regra não aplicada / escopo: ao pedir mudar um único elemento ou espaçamento, "ele tenta realizar a tarefa levando em consideração todo o componente e não o aspecto único em que eu apontei". (Regra de playbook: edição cirúrgica; mexer só no apontado; o resto fica intacto. Inferência.)

- Postura: "eu vejo um agente como um parceiro de trabalho do mesmo nível que eu".
- Piso (nunca falhar): "uma boa hierarquia", "não inventar padrões de interação e se o fizer, justificar o porquê da sua escolha", nunca apresentar opções com acessibilidade falha, nem com spacing, escala tipográfica e cores errados. (Determinístico/piso = hierarquia, acessibilidade, spacing, escala tipográfica, cor, padrão de interação do sistema.)
- Julgado (acima do piso): "a forma que ele constrói o layout, a posição das coisas, o porquê de ter usado certo elemento". (O agente deve justificar escolhas.)
- Quando o agente pergunta: se o pedido "infringe algum elemento fundamental do design system" (o designer precisa saber que está indo contra o sistema); se ele julgar necessário "alguma mudança brusca em como o sistema se comporta". Decide sozinho: "aquilo que tem regras bem definidas"; onde a regra não existe, "ele tem que me questionar até chegar em uma definição". (Regra de escalonamento: regra definida = autonomia; lacuna ou conflito com o sistema = pergunta.)

- Quantas opções: "um número bom o suficiente para ter material de comparação mas que o agente não cuspisse 'slop'" (sem número exato; o repo usa 6). Comparação: "uma do lado da outra". Desejo de UI: ao clicar numa opção ela "ficasse em destaque na tela para que o designer leia o racional que o agente teve na criação dele", como em https://x.com/rakshaa_t/status/2111819957512405339 (não aberto por mim), "assim ficaria mais simples de mandar correções".
- Bom relatório: "me fala o porquê de cada escolha, qual foi o racional, como aquilo se conecta com o objetivo ou briefing". (Ele não disse o que não quer ler.)
- Feedback que pega: explicar "com detalhes o que o agente fez errado", "apontar o princípio que ele usou de maneira incorreta", "explicar o sentimento que a pessoa teve ao ver a opção" (ajuda o agente a entender a intenção), e "ver o histórico de mudanças no componente também é ótimo para poder comparar". (Formato de feedback: o que errou + princípio violado + sentimento + histórico.)

## Desejos para o playbook

- Hand-off em md ideal: dados consistentes; "escrito por meio do próprio designer em um questionário que o agente vai preenchendo cada tópico do arquivo" (o agente entrevista o designer e preenche o md tópico a tópico).

- Papéis novos/mudanças: (a) **Questionador** antes do explorador: o explore já tem perguntas, mas deveria ter mais, inclusive aceitar documentos de PRD; esse papel "vestiria o chapéu de alguém como um PO", questionando "mais sobre o objetivo e caminhos". (b) **Coleta de referências**: "chapéu do designer que precisa entender o caminho visual e de comportamento"; o usuário traz referências "e explica o que ele gosta nelas para que o agente consiga interpretar os pontos na criação" (resposta direta à falha "copia 100%"). (c) O explorador deveria usar "algumas skills do juiz" para melhorar o resultado antes de mostrar.
- Parada: "o trabalho só termina se o usuário desejar". O agente deve avisar "que ele está começando a reciclar ideias" se a pessoa ficar pedindo mais opções. Pronto: "a definição de pronto está na mão do usuário", que refina e decide. O agente "precisa intervir para questionar o que exatamente o designer procura" a cada iteração. (Sem limite numérico de rodadas dado.)

- Juiz: quer que "indique com precisão quais elementos que foram explorados não condizem com os tokens do sistema"; o designer precisa "entender os níveis de severidade do que ele está construindo e como isso conversa com o que está documentado". "O juiz sempre avisa mas nunca intervém"; o designer explora o quanto quiser "mas sempre com visibilidade". (Veredito = lista de achados com severidade, citando o token/regra; sem bloquear, sem consertar.)
- Teste do playbook: consistência. "Quase sempre o que é criado está 'all over the place'. Eu espero um resultado que seja on brand, usando como base os tokens corretamente." (Teste de sucesso: várias rodadas independentes saem coerentes entre si e com os tokens.)
- Anti-padrões: ele devolveu a pergunta para mim (rascunho abaixo, proposto por mim, a confirmar por ele).

## Vocabulário

| Termo | Sentido |
|---|---|
| afunilamento | fase de convergir as ideias para um ponto só |
| senso crítico apurado | a barra de qualidade que o designer aplica a si mesmo |
| respiro / white space | espaço vazio que dá clareza; o que mais separa a boa opção da ruim |
| claustrofóbico | tela com elementos colados e sem respiro (rejeição forte) |
| podar | retirar elementos; o trabalho principal sobre a saída de um agente |
| falar muito com pouco | a fórmula do minimalismo na TV |
| selo de validação social | avaliação/nota que ajuda o clique |
| focado / selecionado | estados distintos; focado é sempre possível, selecionado é escolha intencional |

## Regras de bolso

| Regra | Motivo | Exemplo | Lei ou preferência |
|---|---|---|---|
| Em card com navegação interna, só ←/→ | ↑/↓ navegam entre elementos da página; "inaceitável que um comando conflite com o outro" | | LEI (ele disse "inaceitável") |
| Um padrão de interação por card | Minimalismo TV; "até 3 padrões DIFERENTES... isso não pode acontecer" | opções do elenco (imagem 1) | LEI |
| Nada de branco/preto puro; off-white ~#EEEEEE | TV mais brilhante, cansa a vista | | LEI (inferida) |
| Sem cinza escuro sobre preto, sem gradiente sutil | TV esmaga sombras; some | | LEI (inferida) |
| Fonte mínima 14px, confortável 16 a 18 | Legível a 3 m | | LEI (valor dele; confrontar com tokens) |
| Poucos estados: focado, padrão, desabilitado (+ selecionado) | Sem hover; TVs antigas | | LEI para hover; selecionado é comunicado de formas variadas |
| Selecionado não é sempre check | Pode mudar a label ou outras infos | | PREFERÊNCIA (check do repo é só um meio) |
| Motion só dissolve; a tela funciona sem | Browsers antigos | | LEI |
| Na dúvida, retira; o que fica é "extremamente visual" | "falar muito com pouco" | card de Pompeia (imagem 2) | PREFERÊNCIA forte, padrão |
| Ordem de sacrifício: título, validação social, gênero; descrição e ação saem | Objetivo da home é "vender" rápido; o card é o botão | | depende do objetivo da tela |
| Respiro generoso | "claustrofóbico... horrível" | imagem 1 vs 2 | O critério que mais pesa (sem número) |
| Editar só o aspecto apontado | Agente generaliza | | LEI (para o agente) |
| Avaliar intenção, não gosto | Critique útil | mapa de calor frio | Princípio do juiz |

## Coisas rejeitadas

- Mapa de calor esportivo (planta baixa com rastro vermelho) no BBB: "dado mais frio", fora do tom.
- Cards com 2 ou 3 padrões de interação, cores diversas, sem hierarquia, "claustrofóbicos".
- Copiar 100% uma referência.
- Agente que "sempre opta por mais"; "mais do mesmo"; "all over the place" (sem consistência).
- Crítica de gosto pessoal super específico em design critique.
- Hover e dependência de animação na TV; cores puras; cinza escuro sobre preto.
- Anti-padrões (lista de 12 proposta por mim e aprovada por ele: "gostei da lista"): 1 mais de um padrão de interação por card; 2 vários destaques disputando; 3 tela claustrofóbica; 4 tudo no mesmo componente; 5 copiar 100% a referência; 6 branco/preto puro e cinza escuro sobre preto; 7 fonte abaixo de 14px ou fora da escala; 8 ↑/↓ consumidas em card; 9 mexer no que não foi pedido; 10 depender de hover ou animação; 11 inventar padrão/desviar do kit sem justificar; 12 dado decorado sem ligação com a intenção.

## Respostas às perguntas abertas (rodada final)

- Números x exemplos: "prefiro comparar exemplos e ajustar o playbook conforme o que for encontrado". (Sem números fixos para respiro/densidade; o playbook evolui com os testes.)
- Referência: "nunca uso uma referência com a intenção de copiá-la 100%, uma referência é apenas um guia para construção de algo, é um ponto de partida, nunca a chegada".
- O que não quer ler num relatório: ainda não sabe; "posso ir adicionando conforme vou testando".
- Opções por rodada: 4 a 6; "mais que isso a janela de contexto dos agentes pode estourar".
- "Margem segura": ele leu como limite de explorações por rodada: 6. "Mais que isso, o designer precisa ser notificado do que pode vir a acontecer com a qualidade do que é gerado." (Nota: eu me referia à margem segura da tela da TV; essa continua sem resposta, ver abaixo.)
- Explorador + juiz: o explorador "utiliza a skill de juiz para conferir os tokens do design system e avisar o designer de quais elementos estão infringindo". (Resolve a tensão: o explorador roda a checagem do juiz e avisa; não corrige sozinho.)

## Decisões fechadas depois da entrevista

O designer aprovou as propostas para os pontos abertos (níveis de severidade, rodadas, relatório, explorador x juiz, conferência dos tokens, respiro por exemplos, formato do hand-off). Estão em `playbook.md`, seção 10. Resta perguntar aos devs se o md segue o layout de quatro arquivos da `figma-handoff`.

## Contradições e perguntas abertas

- RESOLVIDO: a margem usada pelo designer é "40/32" (confirmado por ele: 40 nas laterais, 32 em cima e embaixo) e os assets são "pensados primordialmente para 1280x720p". Difere do guia do Android (960x540, 48/27 ou 58/28). Conferir contra os tokens do kit.
- (histórico) Margem segura da TV: o designer não deu número, só indicou o guia do Android TV. Eu li o guia (developer.android.com/design/ui/tv/guides/styles/layouts, versão em inglês) e ele diz, em 960x540 dp: margem de 5% = 48dp nas laterais e 27dp (arredondado para 24dp) em cima e embaixo; em outro trecho, "58dp nas laterais e 28dp em cima e embaixo"; grade de 12 colunas de 52dp com 20dp de calha e 4dp entre linhas; "a maioria das TVs modernas não tem mais problema de overscan"; o fundo preenche a tela inteira e só o conteúdo importante respeita a margem. O guia é inconsistente entre 48/27 e 58/28. A conferir contra os tokens do kit e o que o designer usa de fato. Também diz: não use painéis demais para agrupar, o caminho de foco deve seguir a hierarquia e não ir e voltar entre painéis.

- Repo diz "item escolhido com check ao lado do nome"; ele diz que o check é um meio, não regra. Ajustar a regra ou marcar como preferência.
- Ele pede que o agente nunca falhe em hierarquia, mas as respostas dele sobre o que é "bom" são qualitativas (respiro, "falar muito com pouco"). Sem números para respiro, margem segura, densidade, máximo de elementos. Perguntar se quer números ou se prefere comparação com exemplos.
- Fonte mínima 14px (mínimo do mínimo): confrontar com os tokens de tipografia do kit.
- Ele quer que o explorador use skills do juiz, mas também quer que o juiz "nunca intervenha": como conciliar (o explorador se auto-checa, o juiz independente só avisa)?
- Não respondeu: o que nunca faz com uma referência; o que não quer ler num relatório; limite de rodadas; número de opções por rodada; margem segura; qual UI de TV acha ruim; o que os devs reclamam além de "dado faltando"; como acessibilidade entra além de contraste/tamanho.
- Quem escreve o md de hand-off e como encaixa com a skill dos devs (`figma-handoff`): o agente entrevista o designer e preenche; falta o formato.
- A ordem do repo para as áreas 1 a 5 foi coberta; a rubrica do juiz (níveis de severidade) precisa definir: o que é bloqueio, aviso, informação.

- Que princípios aparecem quando ele "desconstrói" um desenho que não convence? (pedido: nomear 2 ou 3 de um caso real)
- O hand-off em md é saída do agente de design (este playbook) ou só da skill dos devs? Quem escreve o md?

- O que, concretamente, compõe o "senso crítico apurado"? Como o designer sabe que a entrega está boa?
- O que um dev precisa ler no hand-off para usar num fluxo agêntico?
