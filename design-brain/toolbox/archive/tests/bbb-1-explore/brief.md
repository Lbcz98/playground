# Brief: ficha do participante do BBB

Pedido do designer: "crie 4 explorações de uma interatividade de ficha do participante para o BBB. A intenção do card é que o usuário consiga ter, de maneira rápida e objetiva, informações dos participantes: foto, nome, idade, quantidade de estalecas e os emojis que cada um recebeu. Será um card apenas informativo e sem interações, onde cada card mostra informações de apenas 1 participante por vez."

O que vem do pedido está sem marca; o que foi deduzido está marcado `Suposição`.

## Para quê e onde
O espectador vê, numa interatividade contextual durante o programa, a ficha de um participante e a entende de relance. Um card por participante, um participante por vez.

## Intenção
Rápido e objetivo: quem é, quantas estalecas tem e como o público o reagiu (emojis). Não quer: card cheio, texto demais, mais de uma informação disputando o primeiro lugar.

## Prioridade
`Suposição`: 1. foto e nome (quem é); 2. estalecas; 3. emojis recebidos; 4. idade.

## Controle
Apenas visual: sem interação, sem foco interno, sem teclas dentro do card. Não desenhe botão, seletor, aba, seta de abrir nem nada que pareça clicável. O card não tem estado de foco.

## Estados
Só o estado padrão. `Suposição`: sem foco, selecionado, desabilitado nem carregando.

## Conteúdo
Dados fixos (usar exatamente estes, sem inventar outros; a foto é um espaço reservado, sem foto real):
- Foto do participante (espaço reservado)
- Nome: Camila Duarte
- Idade: 27 anos
- Estalecas: 3.250
- Emojis recebidos: 🐍 12 · 💔 7 · 🌱 5 · 🎯 3

## O que varia
4 opções. Variam a tese e a hierarquia (o que chama primeiro) e o arranjo das peças. Ficam iguais: o conteúdo acima e a superfície (um card informativo, sem interação).

## Superfície
Content Card do kit (painel alto de uma interatividade contextual), a mesma nas 4 opções.

## Direções

### 1. Foto como contexto
- **Tese:** a foto ocupa o card e o nome ancora; as demais informações são apoio curto sobre ela.
- **Referência:** `cidade-foto-com-seletor` (foto como contexto, título sobre a imagem). Só a foto e o título; o seletor não entra.
- **Interação:** nenhuma (só visual).
- **Peças:** foto com nome; idade; estalecas; emojis.

### 2. Estalecas em destaque
- **Tese:** o número de estalecas é o dado âncora; foto, nome e idade são identidade, e os emojis são apoio.
- **Referência:** `metrica-com-barras-de-sessoes` (número-herói com apoio).
- **Interação:** nenhuma (só visual).
- **Peças:** identidade (foto, nome, idade); estalecas; emojis.

### 3. Ficha em dois grupos
- **Tese:** em cima, quem é (foto, nome, idade); embaixo, o que o público deu (estalecas e emojis). O espaço, não divisores, separa os grupos.
- **Referência:** `cartoes-contexto-evento-voz-clima-voo` (dado âncora e camadas de apoio).
- **Interação:** nenhuma (só visual).
- **Peças:** foto com nome e idade; estalecas; emojis.

### 4. Emojis como protagonista
- **Tese:** a reação do público é o assunto; os emojis recebidos, com suas contagens, ficam em evidência, e o resto identifica o participante.
- **Referência:** `cartoes-de-humor-gradiente` (um emoji por célula, uma variável por célula). Só o molde das células; a escolha não entra.
- **Interação:** nenhuma (só visual).
- **Peças:** foto com nome e idade; estalecas; fileira de emojis com contagens.
