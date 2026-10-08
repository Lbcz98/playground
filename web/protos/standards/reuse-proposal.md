# `@reuse` e `@proposal`

Os dois vão para o comentário do PR, onde o time decide se vira componente do kit: use só com motivo real.

- `Box` e `Text`: antes de cada um, `{/* @reuse <ComponenteDoKit>: <por quê o kit não serve> */}`. Há um limite por tela; passou dele, vira `@proposal`.
- Componente novo vai em `web/protos/<seu-nome>/components/` e leva, acima da função, um bloco `@proposal`.
- Você não escreve o bloco à mão. Faça 4 perguntas ao usuário, uma por vez: (1) o que é? (2) como se comporta? (3) por que o kit não serve? (4) qual o link do Figma? Monte o bloco com as respostas e confirme com o usuário.

```tsx
/**
 * @proposal
 * why: o stepper do kit é horizontal e estático
 * description: stepper vertical que expande o passo ativo
 * figma: https://figma.com/file/...
 * proposedApi:
 *   activeStep: "number"
 */
```
