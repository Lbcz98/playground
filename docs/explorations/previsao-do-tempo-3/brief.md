Pedido: "Crie 4 opções para uma interatividade de previsão do tempo, quero que o card contenha as seguintes informações: nome do loca, temperatura atual, temperatura média, vento, umidade e sensação térmica"

- **Para quê e onde:** consulta rápida na TV. O espectador passa o olho no card, numa fileira da tela inicial, e lê o tempo do local sem esforço, a distância.
- **Intenção:** limpo e legível, sem poluição visual. Evitar cara de app de clima genérico, card cheio e cara de planilha. `Suposição:` sem ícones decorativos de nuvem e sol soltos; qualquer símbolo de clima serve ao dado.
- **Prioridade:** a temperatura atual, em número âncora. Nome do local, sensação térmica, média, vento e umidade ficam em segundo plano.
- **Controle:** só visual. O card só recebe foco (←/→, Enter e Voltar não mudam o conteúdo); ↑ e ↓ passam para a tela. `Suposição:` o foco do card é o anel padrão do kit; por isso as 4 opções diferem pela estrutura, e o padrão de interação é "nenhum" em todas.
- **Estados:** repouso e foco. `Suposição:` sem carregando, vazio ou erro.
- **Conteúdo:** um local por card. Ex.: São Paulo · atual 24° · sensação 26° · média do dia 21° · vento 14 km/h · umidade 68%. `Suposição:` dados fictícios, em °C, km/h e %.
- **O que varia:** muda a tese, a referência principal e a estrutura (onde mora o número e como os outros cinco dados se agrupam). Fica igual: os seis dados, o local, a superfície e só tokens do kit. **4 opções.**

Superfície: Content Card (painel alto de uma interatividade; a mesma nas 4 opções).

## Direção 1: Número e a forma do dia
- **Tese:** o número responde "como está agora?" e uma única linha de contexto (a média) diz se é normal; tudo empilha numa coluna, na ordem em que se lê.
- **Referência:** metrica-com-barras-de-sessoes (número âncora com a variação ao lado, cor só na exceção, tudo empilhado e alinhado à esquerda).
- **Interação:** nenhum (só foco).
- **Peças:** nome do local; temperatura atual âncora com "+3° da média" ao lado; linha de apoio com sensação, vento e umidade.

## Direção 2: Título que diz como é lá fora
- **Tese:** o card abre com uma frase-conclusão ("Mais quente do que parece"), e os números vêm como prova, em lista, cada um com seu nome, valor e comparação em palavras.
- **Referência:** saude-anel-metricas-e-barras (título como conclusão, métrica com valor e comparação em palavras, mini-tendência terminando em ponto).
- **Interação:** nenhum (só foco).
- **Peças:** nome do local e frase-conclusão; temperatura atual âncora; lista de sensação, média, vento e umidade com comparação em palavras.

## Direção 3: O ambiente como fundo
- **Tese:** o clima aparece como ambiente de ponta a ponta no card e o texto fica só nas faixas mais calmas, de modo que se sente o tempo antes de ler o número.
- **Referência:** cidade-foto-com-seletor (imagem como contexto, texto nas faixas calmas, número a 2× o rótulo, véu onde preciso).
- **Interação:** nenhum (só foco).
- **Peças:** fundo atmosférico do clima (só tokens e imagem do kit); nome do local no topo; temperatura atual âncora; faixa de rodapé com sensação, média, vento e umidade.

## Direção 4: Quatro dados em grupos
- **Tese:** o número âncora fica sozinho no alto, e os outros cinco dados se agrupam em pares por proximidade (calor: sensação e média; ar: vento e umidade), sem linhas nem caixas.
- **Referência:** cartoes-contexto-evento-voz-clima-voo (um único dado âncora gigante por card e o resto em grupos separados por espaço, rótulo acima do valor).
- **Interação:** nenhum (só foco).
- **Peças:** nome do local; temperatura atual âncora; grupo "calor" (sensação, média); grupo "ar" (vento, umidade).

*Nota:* só há um padrão disponível ("nenhum", pelo controle só visual), então as direções se diferenciam pela estrutura e pela referência: 1 empilha em coluna, 2 abre por uma frase-conclusão com lista, 3 usa o ambiente de fundo, 4 agrupa os dados em pares. Nada de hover, arrastar ou swipe.
