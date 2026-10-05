# Playground DTV

Sistema compartilhado para prototipar telas de DTV em código real: um **kit de componentes**
(`src/ui-kit`, `src/primitives`), um **livro de regras** que confere cada tela (`npm run check:laws`)
e um **app Next.js** (`web/`) onde cada designer tem a sua pasta. Sem backend e sem banco: só arquivos.

## Como se usa

```bash
npm install && npm install --prefix web      # uma vez
cd web && npm run dev                         # http://localhost:3000
```

1. Abra o Claude Code na raiz do repositório e peça uma tela ou um fluxo em `web/protos/<seu-nome>/`.
2. Ele escreve o TSX, consulta o Storybook (MCP) e roda `npm run check:laws` até ficar limpo.
3. Veja em `http://localhost:3000/<seu-nome>/<tela>` (fluxo: setas, Enter, Esc volta, R reinicia).
4. Publique com `/deploy` (branch, commit, PR e CI sem ver o Git).

O guia que o Claude segue está em [`web/protos/CLAUDE.md`](web/protos/CLAUDE.md).

## O que tem em cada pasta

| Pasta | O que é |
| --- | --- |
| `web/` | App Next.js. `web/protos/<designer>/` é a pasta de cada designer: `<tela>.tsx`, ou `<fluxo>/` com um `.tsx` por estado e um `flow.ts` |
| `src/ui-kit`, `src/primitives` | O kit React que as telas usam (e que os devs consomem) |
| `src/shared` | Livro de regras (`design-system/rules.ts`, `screen-layers.ts`, `flow.ts`), leitura do TSX (`export/fromTsx.ts`, `flowFile.ts`) e medição do layout renderizado |
| `src/interpreter`, `src/model` | Motor que valida um blueprint contra as regras (usado pelo validador e pelos testes das leis) |
| `tokens/` | `tokens.json`: o contrato de design tokens (W3C DTCG); `npm run tokens:build` gera o CSS |
| `scripts/` | `check-laws`, `deploy`, medição por Chromium (`render-audit`), exportação do Storybook |
| `.storybook/`, `.mcp.json` | Storybook do kit e a conexão MCP que o Claude Code usa para ler os componentes |
| `.claude/` | Comando `/deploy` e o hook que sobe o Storybook |

## Comandos

```bash
npm run check:laws -- <tela.tsx | pasta-do-fluxo>   # as leis + medição da tela renderizada
npm run test                                         # testes (vitest)
npm run typecheck
npm run storybook                                    # kit em :6006
npm run lint:tokens                                  # sem hex/px soltos
npm run tokens:build | tokens:check | tokens:audit
npm run storybook:manifest[:check]                   # snapshot do que o Storybook documenta
npm run browsers:install                             # Chromium para a medição (uma vez)
```

## Histórico

Este repositório já foi o ScreenFlow Studio, um app desktop (Electron) com canvas e um agente de IA
embutido. Foi removido na arquitetura atual; o código continua no histórico do Git
(`git log -- electron/`).
