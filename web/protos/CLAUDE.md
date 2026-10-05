# Como escrever uma tela em `web/protos/<seu-nome>/`

Uma tela é um arquivo `.tsx` com `export default` de um componente que devolve um `<Screen>`. Edite só a sua pasta.

## Onde buscar o que o design system tem (nesta ordem)

1. **MCP do Storybook** (`storybook`, já configurado em `.mcp.json`; o Storybook sobe sozinho ao abrir o Claude Code aqui):
   - `docs-list` lista os componentes; `docs-show <id>` dá a descrição, as props com os **valores permitidos** (espaçamentos, fundos, raios, alinhamentos) e exemplos. Nunca invente uma prop que ele não mostra.
   - Comece por `foundations-screen` (o quadro 1280×720 de toda tela).
   - `stories-preview` devolve o link de um componente renderizado.
2. **Os arquivos do repo**, para o que o MCP não traz: tokens em `tokens/tokens.json`, modelos de camada em `src/shared/design-system/screen-layers.ts`, telas de referência em `scripts/storybook/dtv-templates.ts` (ou as de `web/protos/lucas/`).

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
- Fuja do padrão só de propósito, e diga: comentário `@deviation <regra>: <por quê>` (na função, para regra de tela; antes do elemento, para regra de nó).

## Laço de conferência

Depois de escrever ou mudar uma tela:

```
npm run check:laws -- web/protos/<seu-nome>/<tela>.tsx
```

Repita até ficar limpo. Ele roda o `tsc`, os tokens, o livro de regras e mede a tela renderizada (corte, estouro, texto sobreposto, fundo que cobre o quadro). Para ver a tela: `cd web && npm run dev`, em `/<seu-nome>/<tela>`. Para publicar: `/deploy`.
