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

## Navegar entre telas (`next/link`)

Uma tela abre outra com `<Link href="/<designer>/<tela>">` em volta de **um** componente do kit (o único `import` de fora do kit permitido é `next/link`). Para controles que normalmente são botões, use `as="span"` no componente e `style={{ display: 'inline-block' }}` no Link:

```tsx
<Link href="/ana/trilha" style={{ display: 'inline-block' }}>
  <InteractivityButton as="span" title="Opções de áudio" interactionState="focus" />
</Link>
```

O HTML fica `<a><span>…</span></a>`: o Link é o único alvo de teclado, com nome acessível vindo do título. `InteractivityButton`, `WideButton`, `RoundedButton`, `Notification` e `AlertBug` aceitam `as="span"` para navegação. Para ações locais, omita `as` e use o botão nativo com `onClick`. Não use estados `loading` ou `disabled` de `WideButton` como links. O conteúdo de um link não deve conter outros controles interativos.
`ContentCard` usa `asLink` no lugar de `as="span"`: isso remove o seu próprio alvo de teclado. Não combine `asLink` com `onClick` ou `rowsPerPage`.
Em links apenas com ícone (`RoundedButton`, `AlertBug` e `Notification kind="rounded"`), dê também `aria-label` ao `<Link>`.

O `check:laws` lê o link como `goTo`, confere que a tela existe na sua pasta e aplica `flow.next-level`, `flow.link-roles` e `flow.rail-consistency` às telas ligadas (até 6). Um salto de nível declara-se no nó: `{/* @deviation flow.next-level: <porquê> */}` logo antes do `<Link>`. `href` calculado, ou `<Link>` em volta de zero ou vários componentes, vira "não lido". No `tsc` da raiz o tipo vem de `scripts/render-harness/next-shim.d.ts`; no harness de render, de `next-link.tsx`; aqui, do `next/link` de verdade.

## Convenção

Cada designer só escreve na própria pasta (`protos/<nome>/`). Sugestão para o GitHub: `CODEOWNERS` com uma linha por pasta.
