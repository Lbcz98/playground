# Playground DTV — app compartilhado

Um app Next.js, um repositório, uma pasta por designer. Sem backend e sem banco: o dado é a árvore de arquivos.

```
web/protos/<designer>/<tela>.tsx   → rota /<designer>/<tela>
```

Cada arquivo exporta (default) um componente que devolve um `<Screen>` do kit DTV. O app não copia o kit: importa de `../src` (`@/ui-kit/…`, `@/primitives`), com os mesmos tokens, fonte e ícones do Storybook.

## Rodar

```
cd web && npm install
npm run dev          # http://localhost:3000
npm run build        # as telas viram HTML estático
```

## Checar uma tela (na raiz do repo)

```
npm run browsers:install                       # uma vez
npm run check:laws -- web/protos/<designer>/<tela>.tsx
```

## O que o kit assume (Vite) e como o Next responde (`next.config.mjs`, `shims.d.ts`)

- `import icon from './x.svg'` devolve uma URL (data URI inline) como no Vite.
- `import.meta.env.DEV` vira o modo do Next.
- O kit não marca `'use client'`: o protótipo é carregado do lado cliente (`app/[designer]/[screen]/Proto.tsx`), renderizado no servidor primeiro e hidratado depois.
- O fundo atrás da tela é branco, igual ao harness de checagem. O anel de foco usa mistura com o fundo, então a cor muda sobre preto; num vídeo real depende do vídeo.

## Navegar entre telas (`flow.ts`)

Um fluxo é uma pasta `protos/<designer>/<fluxo>/` com um `.tsx` por estado e um `flow.ts` que diz qual tecla leva de um estado a outro; a rota `/<designer>/<fluxo>` toca o fluxo com o teclado. Uma tela não carrega navegação: importar `next/link` é bloqueio no `check:laws`. O `check:laws` na pasta confere cada estado e as transições (estado que não existe, tecla ligada duas vezes, estado inalcançável, salto de nível, a regra da trilha). Detalhes em [`protos/standards/flow.md`](protos/standards/flow.md).

## Convenção

Cada designer só escreve na própria pasta (`protos/<nome>/`). Sugestão para o GitHub: `CODEOWNERS` com uma linha por pasta.
