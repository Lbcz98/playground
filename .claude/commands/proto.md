---
description: Cria uma tela ou um fluxo em web/protos/<seu-nome>/ a partir do seu pedido, já revisado (publique depois com /deploy)
argument-hint: "<o que você quer ver; pode incluir link do Figma ou pasta de docs/explorations>"
allowed-tools: Bash(ls:*), Read, Glob, Agent, SendMessage, AskUserQuestion
---

Crie o protótipo do designer. Ele não precisa conhecer Git: fale em telas e revisão.

0. Pedido vazio: pergunte o que ele quer ver e pare.
1. Descubra a pasta do designer: `ls -d web/protos/*/`, ignorando `generated` e `standards`. Uma só → use-a sem perguntar. Várias ou nenhuma → pergunte o nome uma vez (nenhuma: ele será a pasta nova). `--designer <nome>` no pedido força o nome.
2. Chame o agente `proto-writer` com a pasta e o pedido, nas palavras do designer.
   Se o pedido cita uma opção de uma exploração (`docs/explorations/` ou `design-brain/toolbox/references/`) que passou pelo ajuste fino (`/tune`: o `<article>` tem `data-tuned`, e o CSS tem valores com `/* tune */`), diga ao agente, nessas palavras, **modo fiel** (é a única forma de ele saber: ele não adivinha pelo pedido): antes de escrever qualquer arquivo, o agente audita a opção e devolve o relatório do que ela fere no sistema, com a pergunta se deve construir assim mesmo. O que o designer ajustou é a premissa, não um erro: a tela é construída com os valores da opção como estão, nunca trocados pelo token mais próximo. Os valores que ferem o sistema são declarados (`@exploration`, ver `web/protos/CODING_STANDARDS.md`) e o relatório mostra cada ferimento ao designer.
3. A resposta do agente termina com `NEEDS_INPUT` (no modo fiel, vem antes dela o relatório "O que esta opção fere o sistema": mostre-o ao designer, inteiro, antes de perguntar; "Não" encerra sem criar nada): pergunte a primeira pergunta com AskUserQuestion (use as opções que ele deu), uma por vez, e retome o mesmo agente com `SendMessage`, citando a resposta literal do designer. Repita até ele devolver o relatório final.
4. Entregue o relatório final como veio (classificação, telas, veredito, o que sobrou e, no modo fiel, a tabela "O que fere o sistema"). Se o agente sugeriu `/explore`, diga isso e pare.
5. Nunca rode `/deploy` por conta própria, nunca use `--force`, nunca altere arquivos fora de `web/protos/<designer>/`.
