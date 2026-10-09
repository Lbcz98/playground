# Fluxo

Fluxo = pasta `web/protos/<seu-nome>/<fluxo>/` com um `.tsx` por estado (nome do estado = nome do arquivo sem `.tsx`) e um `flow.ts`. A navegação vive no `<Link>` e no `flow.ts`; a tela fica sem estado, rota e `onClick`.

## Link
`<Link href="/<seu-nome>/<tela>">` (de `next/link`) em volta de **um** elemento do kit. `href` calculado vira "não lido". Pular um nível de propósito: `{/* @deviation flow.next-level: <por quê> */}` antes do `<Link>`.

## `flow.ts`
Dados literais (sem variáveis, spread ou chamadas): a checagem lê o arquivo, não o executa.

```ts
export default {
  start: 'home-bug',
  transitions: [
    { from: 'home-bug', key: 'left', to: 'home-program' },
    { from: 'home-program', key: 'right', to: 'home-bug' },
    { from: 'home-program', key: 'up', to: 'rail-program' },
    { from: 'rail-program', key: 'down', to: 'home-program' },
    { from: 'rail-program', key: 'enter', to: 'detail' },
    { from: 'home-program', key: 'back', to: 'home-bug' },
    { from: 'home-bug', key: 'back', to: 'hidden' },
  ],
}
```

- Teclas: `up`, `down`, `left`, `right`, `enter`. `back` só como transição explícita da Home (abaixo); no resto, Voltar (Esc/Backspace) é automático.
- Níveis: Home 1 → trilha 2 = `up`; trilha 2 → Home 1 = `down`; trilha 2 → interatividade 3 = `enter`; 3 → 2 = Voltar.
- Sem wrap: do último item de uma linha, `left`/`right` não faz nada; não declare transição do último para o primeiro. Seta sem transição não faz nada.
- Voltar na Home tem dois passos: de um item da barra vai para o bug (`back` explícito); do bug esconde o app (`hidden`, nível 0). Em `hidden` qualquer seta volta ao `start`.
- Voltar automático volta ao estado anterior exato: da interatividade 3 reabre a trilha com o cartão que a abriu focado.
- Um estado Home por item focado da barra (o foco revela a trilha acima dele). O foco inicial da Home é o bug (`start`).
- Lado da trilha: persistentes à esquerda, programa/contextual à direita; o botão Voltar do nível 3 fica do mesmo lado.
- Um destino por tecla e estado; todo estado é alcançável a partir de `start`.
