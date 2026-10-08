# Como escrever uma tela em `web/protos/<seu-nome>/`

Uma tela é um arquivo `.tsx` com `export default` de um componente que devolve um `<Screen>`. Edite só a sua pasta.

Pedido com "fluxo", "ao clicar", "leva para" ou mais de uma tela: faça um fluxo (pasta `web/protos/<seu-nome>/<fluxo>/` com um `.tsx` por estado e um `flow.ts`), não uma tela com estado interno.

## 1. Descubra o que o design system tem (nesta ordem)

1. **MCP do Storybook** (`storybook`, já configurado em `.mcp.json`; o Storybook sobe sozinho ao abrir o Claude Code aqui):
   - `docs-list` lista os componentes; `docs-show <id>` dá a descrição, as props com os **valores permitidos** (espaçamentos, fundos, raios, alinhamentos) e exemplos.
   - Comece por `foundations-screen` (o quadro 1280×720 de toda tela).
   - `stories-preview` devolve o link de um componente renderizado.
2. **Os arquivos do repo**, para o que o MCP não traz: tokens em [`generated/tokens.md`](generated/tokens.md), regras em [`generated/rules.md`](generated/rules.md), modelos de camada em `src/shared/design-system/screen-layers.ts`, telas de referência em `scripts/storybook/dtv-templates.ts` (ou as de `web/protos/lucas/`).

## 2. Escreva a tela

Siga [`CODING_STANDARDS.md`](CODING_STANDARDS.md):

- Imports, tokens, ícones, foco e fundo do `<Screen>`: leia a seção "Imports" e "Regras que valem sempre" antes de escrever a primeira linha.
- Para fugir de um padrão de propósito: leia "`@deviation`".
- Para usar dados, hooks ou arquivos próprios: leia "Lógica e arquivos próprios".
- Para usar `Box` ou `Text`, ou criar componente local: leia "`@reuse` e `@proposal`". Você não escreve o bloco `@proposal` à mão: antes de criar um componente local, faça 4 perguntas, uma de cada vez, em conversa: (1) o que é? (2) como se comporta? (3) por que o kit não serve? (4) qual o link do Figma? Com as respostas, monte o bloco `@proposal` e confirme com o usuário.
- Para ligar telas por `<Link>`: leia "Navegação entre telas".
- Para criar um fluxo em pasta: leia "Fluxo em pasta (`flow.ts`)".

## 3. Confira

Depois de escrever ou mudar uma tela:

```
npm run check:laws -- web/protos/<seu-nome>/<tela>.tsx
```

Para um fluxo, passe a pasta inteira (cada estado e as transições): `npm run check:laws -- web/protos/<seu-nome>/<fluxo>`.

Repita até ficar limpo (avisos de legibilidade não precisam sumir). Para saber o que bloqueia, o que só avisa e o que fazer se o Chromium não sobe: leia "O que bloqueia e o que só avisa" em [`CODING_STANDARDS.md`](CODING_STANDARDS.md).

## 4. Veja e publique

Veja a tela com `cd web && npm run dev`, em `/<seu-nome>/<tela>` (num fluxo: setas e Enter; Esc volta; R reinicia). Para publicar: `/deploy`.
