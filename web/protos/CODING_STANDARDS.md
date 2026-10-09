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
