# Como escrever uma tela em `web/protos/<seu-nome>/`

Uma tela é um arquivo `.tsx` com `export default` de um componente que devolve um `<Screen>`. Edite só a sua pasta.

## Onde buscar o que o design system tem (nesta ordem)

1. **MCP do Storybook** (`storybook`, já configurado em `.mcp.json`; o Storybook sobe sozinho ao abrir o Claude Code aqui):
   - `docs-list` lista os componentes; `docs-show <id>` dá a descrição, as props com os **valores permitidos** (espaçamentos, fundos, raios, alinhamentos) e exemplos. Nunca invente uma prop que ele não mostra.
   - Comece por `foundations-screen` (o quadro 1280×720 de toda tela).
   - `stories-preview` devolve o link de um componente renderizado.
2. **Os arquivos do repo**, para o que o MCP não traz: tokens em [`generated/tokens.md`](generated/tokens.md), regras em [`generated/rules.md`](generated/rules.md), modelos de camada em `src/shared/design-system/screen-layers.ts`, telas de referência em `scripts/storybook/dtv-templates.ts` (ou as de `web/protos/lucas/`).

## Imports (os exemplos do Storybook mostram `from 'screenflow-studio'`: troque)

```tsx
import { Stack, Text } from '@/primitives'
import { MainMenu } from '@/ui-kit/MainMenu'      // um arquivo por componente
import { Screen } from '@/ui-kit/Screen'
```

## Regras que valem sempre

- Só componentes do kit e props que o Storybook documenta. Valor de estilo é sempre o **nome de um token** (`gap="sm"`, `background="primary"`): nada de hex, px, rem, `style` ou `className`, e nenhum elemento HTML (`div`, `span`).
- Ícones: não existe componente de ícone genérico. Cada componente traz os seus; não importe `.svg` na tela.
- A raiz do `<Screen>` não pinta fundo nem tem margem: o quadro cuida disso, e a camada de conteúdo é transparente.
- Um único foco por tela (nível 0 não tem). Vários componentes nascem focados por padrão: confira `docs-show`.
- Fuja do padrão só de propósito, e diga: comentário `@deviation <regra>: <por quê>` (na função, para regra de tela; antes do elemento, para regra de nó). Lei nunca se declara; só padrão.
- Não existe modo para escolher: a checagem é uma só. Quebrou, é bloqueio; ou conserte, ou declare com `@deviation`.

## Lógica e arquivos próprios

Pode usar hooks, `.map`, props calculadas e dados. Importe só de dentro da sua pasta (`./dados`, `./components/Etapa`); arquivo sem JSX (dados) não passa pelo filtro de valores brutos. O que o checador não consegue ler aparece como "não lido" e é contado, mas a medição da tela renderizada continua valendo.

## Primitivos e componentes locais

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

- Você não escreve esse bloco à mão. Antes de criar um componente local, o agente faz 4 perguntas, uma de cada vez, em conversa: (1) o que é? (2) como se comporta? (3) por que o kit não serve? (4) qual o link do Figma? Com as respostas, ele monta o bloco `@proposal` e confirma com você.
- Não existe `@reuse` nem `@proposal` por enfeite: os dois vão para o comentário do PR, onde o time decide se vira componente do kit.

## Fluxo entre telas

Navegar é `<Link href="/<seu-nome>/<tela>">` (de `next/link`) em volta de **um** elemento do kit. As regras de fluxo (`flow.*`) rodam sobre as telas ligadas da sua pasta. Link para tela que não existe é bloqueio; `href` calculado vira "não lido". Para pular um nível de propósito, declare `{/* @deviation flow.next-level: <por quê> */}` logo antes do `<Link>`.

## O que bloqueia e o que só avisa

- **Bloqueia** (sai com erro, e o CI também): lei quebrada, padrão sem `@deviation`, elemento cortado ou fora do quadro, fundo que cobre o quadro, `@reuse`/`@proposal` faltando, link quebrado.
- **Só avisa** (legibilidade): texto sobre texto ou espremido. Aparece na saída e no comentário do PR, sem bloquear.
- Se o Chromium não sobe, a medição não roda; no CI isso é falha (`--require-render`). Local: `npm run browsers:install`.

## Laço de conferência

Depois de escrever ou mudar uma tela:

```
npm run check:laws -- web/protos/<seu-nome>/<tela>.tsx
```

Repita até ficar limpo (avisos de legibilidade não precisam sumir). Ele roda o `tsc`, os tokens, o livro de regras e mede a tela renderizada (corte, estouro, texto sobreposto, fundo que cobre o quadro). Para ver a tela: `cd web && npm run dev`, em `/<seu-nome>/<tela>`. Para publicar: `/deploy`.
