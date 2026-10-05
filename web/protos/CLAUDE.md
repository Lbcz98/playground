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
- Home: por padrão o foco fica no botão do programa (`MainMenu focusedItem="program"`, à direita) e a trilha vai à direita: escreva `<InteractivityMenu align="end">`. Atenção: sem `align`, a trilha renderiza à ESQUERDA (o padrão do componente é `start`) e a regra exige foco num botão da esquerda (`schedule`, `miscellaneous` ou `login`). Trilha à esquerda só quando o pedido disser.
- Um único foco por tela (nível 0 não tem). Vários componentes nascem focados por padrão: confira `docs-show`.
- Fuja do padrão só de propósito, e diga: comentário `@deviation <regra>: <por quê>` (na função, para regra de tela; antes do elemento, para regra de nó).

## Fluxo (várias telas que se ligam)

Um fluxo é uma **pasta** `web/protos/<seu-nome>/<fluxo>/`: um `.tsx` por **estado** (cada um é uma tela como acima, com o foco desenhado por `interactionState`/`focusedItem`) e um `flow.ts` que diz que tecla do controle leva de um estado a outro. Mover o foco para outro cartão é outro estado (`rail` → `rail-cinema`), não código.

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
- O nome do estado é o nome do arquivo sem `.tsx`. Cada arquivo tem um só `<Screen>`; não escreva estado, rota ou `onClick` na tela.
- Camadas: uma tecla abre o nível seguinte ou volta a um nível acima, nunca pula (Home 1 → trilha 2 → interatividade 3). A trilha entrada mostra os mesmos cartões da Home.
- Uma tecla, um destino por estado; todo estado precisa ser alcançável a partir de `start`.
- Exemplo completo: `web/protos/lucas/grade-flow/`. Veja em `/<seu-nome>/<fluxo>` com `cd web && npm run dev` (setas e Enter; Esc volta; R reinicia).
- Conferir: `npm run check:laws -- web/protos/<seu-nome>/<fluxo>` (a pasta inteira: cada estado e as transições).

## Laço de conferência

Depois de escrever ou mudar uma tela:

```
npm run check:laws -- web/protos/<seu-nome>/<tela>.tsx
```

Repita até ficar limpo. Ele roda o `tsc`, os tokens, o livro de regras e mede a tela renderizada (corte, estouro, texto sobreposto, fundo que cobre o quadro). Para ver a tela: `cd web && npm run dev`, em `/<seu-nome>/<tela>`. Para publicar: `/deploy`.

Pedido com "fluxo", "ao clicar", "leva para" ou mais de uma tela: faça um fluxo (pasta), não uma tela com estado interno.
