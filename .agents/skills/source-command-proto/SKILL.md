---
name: "source-command-proto"
description: "Cria uma tela ou um fluxo em web/protos/<seu-nome>/ a partir do seu pedido, já revisado (publique depois com /deploy)"
---

# source-command-proto

Use this skill when the user asks to run the migrated source command `proto`.

## Command Template

Crie o protótipo do designer. Ele não precisa conhecer Git: fale em telas e revisão.

0. Pedido vazio: pergunte o que ele quer ver e pare.
1. Descubra a pasta do designer: `ls -d web/protos/*/`, ignorando `generated` e `standards`. Uma só → use-a sem perguntar. Várias ou nenhuma → pergunte o nome uma vez (nenhuma: ele será a pasta nova). `--designer <nome>` no pedido força o nome.
2. Chame o agente `proto-writer` com a pasta e o pedido, nas palavras do designer.
   Se o pedido cita uma opção de `docs/explorations/` que passou pelo ajuste fino (`/tune`: o `<article>` tem `data-tuned`, e o CSS tem valores com `/* tune */`), diga ao agente: cada valor com `/* tune */` saiu do kit; troque-o pelo token mais próximo e liste, no relatório, "candidatos a token" (valor ajustado → token usado), para o designer levar ao kit.
3. A resposta do agente começa com `NEEDS_INPUT`: pergunte a primeira pergunta com AskUserQuestion (use as opções que ele deu), uma por vez, e retome o mesmo agente com `SendMessage`, citando a resposta literal do designer. Repita até ele devolver o relatório final.
4. Entregue o relatório final como veio (classificação, telas, veredito, o que sobrou). Se o agente sugeriu `/explore`, diga isso e pare.
5. Nunca rode `/deploy` por conta própria, nunca use `--force`, nunca altere arquivos fora de `web/protos/<designer>/`.
