# Fluxo

Fluxo = pasta `web/protos/<seu-nome>/<fluxo>/` com um `.tsx` por estado (nome do estado = nome do arquivo sem `.tsx`) e um `flow.ts`. A navegação vive só no `flow.ts`; a tela fica sem estado, rota, `<Link>` e `onClick` (importar `next/link` é bloqueio).

## `flow.ts`
Dados literais (sem variáveis, spread ou chamadas): a checagem lê o arquivo, não o executa.

```ts
export default {
  start: 'home',
  transitions: [
    { from: 'home', key: 'up', to: 'rail' },
    { from: 'rail', key: 'enter', to: 'detail' },
  ],
}
```

- Teclas: `up`, `down`, `left`, `right`, `enter`. Voltar (Esc/Backspace) é automático.
- Camadas: cada tecla abre o nível seguinte ou volta um nível (Home 1 → trilha 2 → interatividade 3). A trilha de entrada mostra os mesmos cartões da Home.
- Um destino por tecla e estado; todo estado é alcançável a partir de `start`.
