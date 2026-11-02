# Toolbox do playbook de design com IA

Tudo que o playbook produz ou usa mora aqui. Cada arquivo novo entra nesta tabela e na seção "Toolbox" de `playbook.md` (a regra 1 de lá obriga isso).

| Arquivo | Tipo | Para que serve | Aprovado |
|---|---|---|---|
| [`playbook.md`](playbook.md) | doc | O playbook: objetivo, passos, regras, anti-padrões, papéis, pronto, teste | rascunho aprovado pelo designer nos pontos da seção 10 |
| [`../DESIGN.md`](../DESIGN.md) | doc | A linguagem visual do kit: cor, gradientes, sombras, tipografia, imagens, respiro. Lida por quem desenha UI; o juiz cita as regras | rascunho; decisões do designer de 2026-10-26 |
| [`interview-notes.md`](interview-notes.md) | doc | Notas da entrevista com o designer: a fonte do playbook, com as palavras dele | notas de trabalho |
| [`judge.md`](judge.md) | doc | O juiz independente: passos, severidade e formato do relatório; roda como agente à parte | pedido pelo designer; calibrar com as rodadas de teste |
| [`test-log.md`](test-log.md) | doc | Registro das rodadas de teste: o que ficou fixo, o veredito do designer, o que o juiz achou e as lacunas | notas de trabalho |
| [`references/gold.json`](references/gold.json) | exemplo | Índice do conjunto de ouro: quais cards o pacote do explorador pode mostrar, e o caminho da folha de contato | cards escolhidos pelo designer |
| [`references/gold-sheet.png`](references/gold-sheet.png) | exemplo | Folha de contato dos cards de ouro; o explorador estuda a imagem e não copia. Gere de novo com `node scripts/gold-sheet.mjs` | gerada dos dois cards |
| [`references/pompeia-poster-card/`](references/pompeia-poster-card/index.html) | exemplo | Card "bom" salvo: opção 1 de `pb-test-2` ("Pôster inteiro"). Nota em `why.md` | escolhido pelo designer |
| [`references/pompeia-seletor-card/`](references/pompeia-seletor-card/index.html) | exemplo | Card "bom" salvo: opção 2 de `cmp-1-playbook` ("Seletor segmentado"), "melhor que a opção 1 guardada". Nota em `why.md` | escolhido pelo designer |
| [`tests/`](tests/) | testes | As rodadas de teste do playbook: `pb-test-0` (baseline do `/explore`) e `pb-test-1` a `pb-test-3` (só o playbook), cada uma com `brief.md`, `index.html` e o relatório do juiz | notas de trabalho |

O `/explore` (`.claude/commands/explore.md`) é este fluxo: os agentes leem o playbook, o pacote traz a folha de contato e as notas, o juiz roda e a crítica volta ao escritor (no máximo 2 rodadas). `/explore-playbook` faz o mesmo. O fluxo anterior é `/explore-legacy`.

Scripts e templates: nenhum ainda. Só entram aqui depois que o designer aprovar.
