crie 4 explorações de uma interatividade de previsão do tempo. Quero que seja um card com as seguintes informações: temperatura atual, temperatura média, nome do local, ícones comunicando visualmente o clima e informações metereológicas como umidade, tempo sensação térmica. Use essa imagem como referência (selo azul "Replay": muito espaço vazio, tipografia minimalista e bem posicionada), eu gosto do uso do espaço vazio dentro desse componente, com espaço para ser mais visual. User story: Eu como usuário quero acessar informações dinâmicas e em tempo real sobre o clima e a previsão do tempo na minha tela, para que eu possa me planejar para o dia ou semana sem precisar trocar de dispositivo ou interromper minha experiência de uso.

**Para quê e onde:** o espectador consulta o clima na TV, sem trocar de dispositivo, para planejar o dia ou a semana.
**Intenção:** calmo, arejado, mais visual que informativo, com tipografia mínima bem posicionada (como o selo da imagem: título pequeno no canto, grande área livre). Evitar: card cheio/denso, ícones genéricos de app de clima, visual frio de tabela. Suposição: a imagem de referência atrai pelo vazio e pela tipografia, não pela cor azul nem pelo picote.
**Prioridade:** a temperatura atual, grande; local, ícone e detalhes ficam em segundo plano.
**Controle:** interativo. ←/→ navega pelos dias/horas, Enter abre o detalhe; Voltar recolhe.
**Estados:** foco, selecionado e expandido. Suposição: sem carregando nem vazio.
**Conteúdo:** Suposição: São Paulo · agora 24° · média do dia 22° · sensação 26° · umidade 68% · ícone de nuvem com sol; horas de hoje (09h–21h) e próximos dias (Ter–Dom) com ícone e temperatura.
**O que varia:** tese, referência principal e padrão de interação; 4 opções. Fica igual: o dado âncora (temperatura) e os dados do card.
Superfície: Content Card

## Opção 1
- **Tese:** o tempo é um trilho de dias sob um número grande; escolher o dia muda o número e deixa o resto do card vazio e quieto.
- **Referência:** trilho-de-dias-com-seletor (fileira de casas iguais, dia escolhido invertido, frase-resumo); cartoes-contexto-evento-voz-clima-voo (âncora gigante) só no tamanho do número.
- **Interação:** Trilho de passos. ←/→ move o dia (Hoje a Dom); Enter abre sensação e umidade do dia no lugar.
- **Peças:** local + temperatura grande; ícone do clima; trilho de 7 dias; frase-resumo.

## Opção 2
- **Tese:** o dia é uma curva de temperatura; ver a curva ou as barras é a mesma resposta em duas formas.
- **Referência:** semana-barras-e-radial (total fixo, duas geometrias do mesmo dado, marcador de agora).
- **Interação:** Alternar visão. ←/→ percorre as horas de hoje; Enter troca entre curva e barras.
- **Peças:** temperatura atual fixa; gráfico das horas; legenda média/sensação; local.

## Opção 3
- **Tese:** o card mostra só o número e o ícone; cada detalhe é uma linha recolhida que se abre quando você a procura.
- **Referência:** cartoes-contexto-evento-voz-clima-voo (âncora, linha que se abre "Umidade ⌄").
- **Interação:** Expandir no lugar. ←/→ move entre as linhas (Sensação, Umidade, Média); Enter abre a linha e mostra a explicação e a série curta dela.
- **Peças:** local + temperatura + ícone; 3 linhas expansíveis.

## Opção 4
- **Tese:** três segmentos (Agora, Hoje, Semana) trocam o card inteiro, e o ícone do clima grande vira a paisagem do card.
- **Referência:** cidade-foto-com-seletor (contexto grande de fundo, seletor que troca tudo, texto nas faixas calmas).
- **Interação:** Seletor segmentado. ←/→ troca o segmento na hora; Enter não faz nada.
- **Peças:** ilustração do clima de fundo; título do local; temperatura/resumo do segmento; seletor.
