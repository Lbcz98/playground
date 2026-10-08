# Telas em `web/protos/<seu-nome>/`

Uma tela é um `.tsx` com `export default` de um componente que devolve um `<Screen>`. Escreva só na sua pasta. Pedido com "fluxo", "ao clicar", "leva para" ou mais de uma tela é um fluxo.

## 1. Descubra o design system
Pronto quando cada componente usado tem props e valores confirmados.

MCP `storybook` (sobe sozinho): `docs-list`, depois `docs-show <id>`; comece por `foundations-screen`. Tokens e regras: [`generated/tokens.md`](generated/tokens.md), [`generated/rules.md`](generated/rules.md). Modelos de camada: `src/shared/design-system/screen-layers.ts`. Telas de referência: `scripts/storybook/dtv-templates.ts`.

## 2. Escreva
Pronto quando o arquivo existe e cada seção que se aplica de [`CODING_STANDARDS.md`](CODING_STANDARDS.md) foi lida.

- Antes da primeira linha: "Imports e escrita".
- Quebrar um padrão, ou importar dados e arquivos próprios: "`@deviation`".
- `Box`/`Text` ou componente local: "`@reuse` e `@proposal`".
- Fluxo (`flow.ts`): [`standards/flow.md`](standards/flow.md).

## 3. Confira
Pronto quando sai sem **bloqueio** (CI também; conserte ou declare `@deviation`). **Aviso** (legibilidade) pode ficar.

```
npm run check:laws -- web/protos/<seu-nome>/<tela>.tsx   # fluxo: a pasta
```

Chromium que não sobe é bloqueio no CI; local: `npm run browsers:install`.

## 4. Veja e publique
Pronto quando `/<seu-nome>/<tela>` abre após `cd web && npm run dev` (fluxo: setas e Enter; Esc volta; R reinicia). Publicar: `/deploy`.
