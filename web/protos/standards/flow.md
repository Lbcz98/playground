# Fluxo: `<Link>` e `flow.ts`

Fluxo = pasta `web/protos/<seu-nome>/<fluxo>/` com um `.tsx` por estado e um `flow.ts`. O nome do estado é o nome do arquivo sem `.tsx`. Não escreva estado, rota ou `onClick` na tela.

## Link
`<Link href="/<seu-nome>/<tela>">` (de `next/link`) em volta de **um** elemento do kit. As regras `flow.*` rodam sobre as telas ligadas da sua pasta. `href` calculado vira "não lido". Para pular um nível de propósito: `{/* @deviation flow.next-level: <por quê> */}` logo antes do `<Link>`.

## `flow.ts`
Só dados literais (sem variáveis, spread ou chamadas): a checagem lê o arquivo, não o executa.

```ts
export default {
  start: 'home',
  transitions: [
    { from: 'home', key: 'up', to: 'rail' },
    { from: 'rail', key: 'enter', to: 'detail' },
  ],
}
```

- Teclas: `up`, `down`, `left`, `right`, `enter`. Voltar é automático (Esc/Backspace); não declare `back`.
- Camadas: uma tecla abre o nível seguinte ou volta um nível, sem pular (Home 1 → trilha 2 → interatividade 3). A trilha de entrada mostra os mesmos cartões da Home.
- Uma tecla, um destino por estado; todo estado é alcançável a partir de `start`.
- Exemplo completo: `web/protos/lucas/grade-flow/`.
