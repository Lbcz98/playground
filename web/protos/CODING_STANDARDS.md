# Padrões das telas

Leis e convenções: [`generated/rules.md`](generated/rules.md). Tokens: [`generated/tokens.md`](generated/tokens.md). Abaixo, só o que eles não dizem.

## Imports e escrita
Os exemplos do Storybook mostram `from 'screenflow-studio'`; use:

```tsx
import { Stack, Text } from '@/primitives'
import { MainMenu } from '@/ui-kit/MainMenu'      // um arquivo por componente
import { Screen } from '@/ui-kit/Screen'
```

- Estilo é o nome de um token (`gap="sm"`); elementos são do kit.
- Ícones vêm dentro de cada componente; a tela não importa `.svg`.
- A camada de conteúdo é transparente: a raiz do `<Screen>` não pinta fundo nem tem margem (o quadro cuida disso).
- Vários componentes nascem focados; deixe um só focado e confira o padrão no `docs-show`.

## `@deviation`
Declara um padrão que o usuário pediu para quebrar. Lei não se declara; corrija-a.
Só declare quando o pedido veio do usuário, em palavras, e cite-o: `@deviation <ruleId>: pedido: "<frase do usuário>". <por quê>`. Sem pedido, siga o padrão; na dúvida, pergunte antes de escrever.
Dados e arquivos próprios: importe de dentro da sua pasta (`./dados`, `./components/Etapa`). Arquivo sem JSX não passa pelo filtro de valores brutos; o que o checador não lê aparece como "não lido" e a medição renderizada continua valendo.

## `@exploration`
Uma opção explorada (`docs/explorations/` ou `design-brain/toolbox/references/`) e ajustada no `/tune` (o `<article>` tem `data-tuned`) vira tela **como foi ajustada**: o ajuste do designer é a premissa, e o que ele fere no sistema é dito, não escondido. A peça vai num componente local em `components/` com `@exploration <slug>#<N>` no JSDoc, junto do `@proposal`:

```tsx
/**
 * @exploration seletor-card#3
 * @proposal
 * why: ...
 */
```

- Nesse arquivo, valor bruto, `style` (que é um valor bruto) e elemento nativo (`tokens.only`, `component.api`) saem como **ferimento** em `check:laws` (`exploration … breaks …`), não como bloqueio. Aparecem no relatório do agente e no comentário do PR, onde o time decide se viram token ou componente.
- O marcador só vale em arquivo de `components/`, e a exploração que ele nomeia precisa estar no repositório e ter `data-tuned`: sem isso, `check:laws` bloqueia como antes. Suba a exploração junto com o protótipo. Nunca na tela (o arquivo com `<Screen>`).
- O `proto-reviewer` confere que cada valor veio da opção, não de escolha do agente.
- Foco: o componente marcado, recebendo `interactionState="focus"`, conta como o elemento focado (não há holder do kit dentro dele). As regras de foco continuam valendo para a tela.
- Camadas, grade e fluxo continuam bloqueando.
- O `@proposal` de um componente `@exploration` é preenchido com o que a exploração já diz (brief, spec); sem link do Figma na exploração, omita `figma` em vez de inventar. Token mais próximo de um valor: `npm run nearest-token -- "144px" "#e10600"`.

## `@reuse` e `@proposal`
Vão para o comentário do PR, onde o time decide se viram componente do kit: dê motivo real.

- `Box`/`Text`: `@reuse` (forma em rules.md). Estourou `primitives.budget`: vira `@proposal`.
- Componente novo: `web/protos/<seu-nome>/components/`, com bloco `@proposal` acima da função. Monte o bloco a partir de 4 perguntas ao usuário, uma por vez: (1) o que é? (2) como se comporta? (3) por que o kit não serve? (4) link do Figma? Confirme o bloco com ele.

```tsx
/**
 * @proposal
 * why: o stepper do kit é horizontal e estático
 * description: stepper vertical que expande o passo ativo
 * figma: https://figma.com/file/...
 * proposedApi:
 *   activeStep: "number"
 */
```
