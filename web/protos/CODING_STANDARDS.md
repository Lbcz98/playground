# Padrões de código das telas em `web/protos/<seu-nome>/`

Referência consultada por [`CLAUDE.md`](CLAUDE.md). O passo a passo fica lá; aqui ficam as regras.

## Imports

Os exemplos do Storybook mostram `from 'screenflow-studio'`: troque pelos caminhos abaixo.

```tsx
import { Stack, Text } from '@/primitives'
import { MainMenu } from '@/ui-kit/MainMenu'      // um arquivo por componente
import { Screen } from '@/ui-kit/Screen'
```

## Regras que valem sempre

- Use só componentes do kit e props que o Storybook documenta. Valor de estilo é sempre o **nome de um token** (`gap="sm"`, `background="primary"`); nada de hex, px, rem, `style` ou `className`, e nenhum elemento HTML (`div`, `span`).
- Ícones: não existe componente de ícone genérico. Cada componente traz os seus; não importe `.svg` na tela.
- A raiz do `<Screen>` não pinta fundo nem tem margem: o quadro cuida disso, e a camada de conteúdo é transparente.
- Um único foco por tela (nível 0 não tem). Vários componentes nascem focados por padrão: confira `docs-show`.

## `@deviation`

Para fugir de um padrão de propósito, escreva `@deviation <regra>: <por quê>`: na função, para regra de tela; antes do elemento, para regra de nó. Lei nunca se declara; só padrão.

## Lógica e arquivos próprios

Importe só de dentro da sua pasta (`./dados`, `./components/Etapa`). Arquivo sem JSX (dados) não passa pelo filtro de valores brutos. O que o checador não consegue ler aparece como "não lido" e é contado, mas a medição da tela renderizada continua valendo.

## `@reuse` e `@proposal`

- `Box` e `Text` são primitivos: antes de cada um, `{/* @reuse <ComponenteDoKit>: <por quê o kit não serve> */}`. Há um limite por tela; passou dele, vira `@proposal`.
- Componente novo vai em `web/protos/<seu-nome>/components/` e leva, acima da função, um bloco `@proposal`:

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

- `@reuse` e `@proposal` só existem onde há motivo real: os dois vão para o comentário do PR, onde o time decide se vira componente do kit.

## Navegação entre telas

Navegar é `<Link href="/<seu-nome>/<tela>">` (de `next/link`) em volta de **um** elemento do kit. As regras de fluxo (`flow.*`) rodam sobre as telas ligadas da sua pasta. `href` calculado vira "não lido". Para pular um nível de propósito, declare `{/* @deviation flow.next-level: <por quê> */}` logo antes do `<Link>`.

## Fluxo em pasta (`flow.ts`)

```ts
// flow.ts — só dados literais (sem variáveis, spread ou chamadas): a checagem lê o arquivo, não o executa
export default {
  start: 'home',
  transitions: [
    { from: 'home', key: 'up', to: 'rail' },
    { from: 'rail', key: 'enter', to: 'detail' },
  ],
}
```

- Teclas: `up`, `down`, `left`, `right`, `enter`. **Voltar é automático** (Esc/Backspace volta pelos estados visitados); não declare `back`.
- O nome do estado é o nome do arquivo sem `.tsx`. Não escreva estado, rota ou `onClick` na tela.
- Camadas: uma tecla abre o nível seguinte ou volta a um nível acima, nunca pula (Home 1 → trilha 2 → interatividade 3). A trilha entrada mostra os mesmos cartões da Home.
- Uma tecla, um destino por estado; todo estado precisa ser alcançável a partir de `start`.
- Exemplo completo: `web/protos/lucas/grade-flow/`.

## O que bloqueia e o que só avisa

- **Bloqueia** (sai com erro, e o CI também): lei quebrada, padrão sem `@deviation`, elemento cortado ou fora do quadro, fundo que cobre o quadro, `@reuse`/`@proposal` faltando, link para tela que não existe. Ou conserte, ou declare com `@deviation`.
- **Só avisa** (legibilidade): texto sobre texto ou espremido. Aparece na saída e no comentário do PR, sem bloquear.
- Se o Chromium não sobe, a medição não roda; no CI isso é falha (`--require-render`). Local: `npm run browsers:install`.
