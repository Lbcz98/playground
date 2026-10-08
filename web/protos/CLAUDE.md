# Telas em `web/protos/<seu-nome>/`

Uma tela é um `.tsx` com `export default` de um componente que devolve um `<Screen>`. Edite só a sua pasta.

Pedido com "fluxo", "ao clicar", "leva para" ou mais de uma tela: faça um fluxo, não uma tela com estado interno.

## 1. Descubra o que o design system tem
Pronto quando cada componente que você vai usar tem props e valores permitidos confirmados.

1. MCP `storybook` (em `.mcp.json`; o Storybook sobe sozinho ao abrir o Claude Code aqui): `docs-list`, depois `docs-show <id>`. Comece por `foundations-screen` (o quadro 1280×720).
2. Arquivos do repo, para o que o MCP não traz: tokens em [`generated/tokens.md`](generated/tokens.md), regras em [`generated/rules.md`](generated/rules.md), modelos de camada em `src/shared/design-system/screen-layers.ts`, telas de referência em `scripts/storybook/dtv-templates.ts` e `web/protos/lucas/`.

## 2. Escreva a tela
Pronto quando o arquivo existe e cada pointer abaixo que se aplica foi lido.

- Sempre, antes da primeira linha: [`standards/tokens-e-imports.md`](standards/tokens-e-imports.md) (imports, tokens, ícones, foco, fundo).
- Fugir de um padrão de propósito, ou importar dados e arquivos próprios: [`standards/deviation.md`](standards/deviation.md).
- Usar `Box`/`Text` ou criar componente local: [`standards/reuse-proposal.md`](standards/reuse-proposal.md).
- Ligar telas por `<Link>` ou criar fluxo em pasta com `flow.ts`: [`standards/flow.md`](standards/flow.md).

## 3. Confira
Pronto quando o comando sai sem **bloqueio** (aviso de legibilidade pode ficar).

```
npm run check:laws -- web/protos/<seu-nome>/<tela>.tsx
```

Fluxo: passe a pasta (`.../<fluxo>`). Repita até limpar. Bloqueio que você não entende, ou Chromium que não sobe: [`standards/checagem.md`](standards/checagem.md).

## 4. Veja e publique
Pronto quando a tela abre em `/<seu-nome>/<tela>` após `cd web && npm run dev` (fluxo: setas e Enter; Esc volta; R reinicia). Publicar: `/deploy`.
