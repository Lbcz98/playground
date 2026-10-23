# Toolbox do playbook de design com IA

Tudo que o playbook produz ou usa mora aqui. Cada arquivo novo entra nesta tabela e na seção "Toolbox" de `playbook.md` (a regra 1 de lá obriga isso).

| Arquivo | Tipo | Para que serve | Aprovado |
|---|---|---|---|
| [`playbook.md`](playbook.md) | doc | O playbook: objetivo, passos, regras, anti-padrões, papéis, pronto, teste | rascunho aprovado pelo designer nos pontos da seção 10 |
| [`interview-notes.md`](interview-notes.md) | doc | Notas da entrevista com o designer: a fonte do playbook, com as palavras dele | notas de trabalho |
| [`judge.md`](judge.md) | doc | O juiz independente: passos, severidade e formato do relatório; roda como agente à parte | pedido pelo designer; calibrar com as rodadas de teste |
| [`test-log.md`](test-log.md) | doc | Registro das rodadas de teste: o que ficou fixo, o veredito do designer, o que o juiz achou e as lacunas | notas de trabalho |
| [`references/pompeia-poster-card/`](references/pompeia-poster-card/index.html) | exemplo | Card "bom" salvo: opção 1 da rodada 2, escolhida pelo designer; o juiz compara com ele | escolhido pelo designer |
| [`tests/`](tests/) | testes | As rodadas de teste do playbook: `pb-test-0` (baseline do `/explore`) e `pb-test-1` a `pb-test-3` (só o playbook), cada uma com `brief.md`, `index.html` e o relatório do juiz | notas de trabalho |
| [`references/pompeia-seletor-card/`](references/pompeia-seletor-card/index.html) | exemplo | Segundo card "bom" salvo: opção 2 do `/explore-playbook` (rodada 4), "melhor que a opção 1 guardada" segundo o designer | escolhido pelo designer |

O comando `/explore-playbook` (`.claude/commands/explore-playbook.md`) usa estes arquivos: é o `/explore` com os agentes lendo o playbook e o juiz rodando no fim.

Scripts e templates: nenhum ainda. Só entram aqui depois que o designer aprovar.
