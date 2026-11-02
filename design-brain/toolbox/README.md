# Toolbox do playbook

O que um agente desenha está em [`../rules/`](../rules/). [`../DESIGN.md`](../DESIGN.md) é o índice. [`playbook.md`](playbook.md) é o objetivo. [`judge.md`](judge.md) diz ao juiz para ler só o pacote de checagens. O processo (passos, papéis, hand-off) está em [`../rules/process.md`](../rules/process.md).

| Arquivo | Para que serve |
|---|---|
| [`../rules/`](../rules/) | A fonte única das regras, um tópico por arquivo |
| [`playbook.md`](playbook.md) | O objetivo do playbook, sem repetir as regras |
| [`../DESIGN.md`](../DESIGN.md) | Índice da linguagem visual |
| [`judge.md`](judge.md) | O juiz avisa e não edita; lê `pack/judge.md` |
| [`references/gold.json`](references/gold.json) | Quais cards de ouro o pacote pode mostrar |
| [`references/gold-sheet.png`](references/gold-sheet.png) | A folha de contato. O explorador estuda a imagem e não copia. `node scripts/gold-sheet.mjs` gera de novo |
| [`references/pompeia-poster-card/`](references/pompeia-poster-card/index.html) | Card bom, com `why.md` |
| [`references/pompeia-seletor-card/`](references/pompeia-seletor-card/index.html) | Card bom, o que o designer preferiu |
| [`archive/`](archive/) | Rodadas antigas, o diário e as notas de entrevista. Nenhum agente é mandado ler |

O `/explore` é `.claude/commands/explore.md`. `/explore-playbook` faz o mesmo. A crítica aplica um ajuste, uma vez, nas opções que o diretor escolhe. Os controles de ajuste nascem quando o designer pede.
