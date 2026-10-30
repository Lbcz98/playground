---
name: "source-command-explore-playbook"
description: "Igual ao /explore, mas os agentes leem o playbook de design (design-brain/toolbox) e um juiz independente avalia o resultado"
---

# source-command-explore-playbook

Use this skill when the user asks to run the migrated source command `explore-playbook`.

## Command Template

Siga `.Codex/commands/explore.md` do começo ao fim (entrevista, plano, agentes em paralelo, página ao vivo, variações), sem mudar nada do que ele manda, com **só estas três diferenças**. Fale em opções e telas, nunca em Git.

1. **Cada `proto-explorer` lê o playbook.** Em toda chamada a um `proto-explorer` (a exploração inteira, cada opção em paralelo, as variações e as edições), acrescente ao que o `/explore` manda dizer: "Antes de escrever, leia `design-brain/toolbox/playbook.md` e `design-brain/toolbox/judge.md` e siga o playbook: leis, princípios, anti-padrões e o formato de página do juiz. Onde o playbook e as suas instruções divergirem, siga as suas e anote a divergência na resposta." Não leia nem passe adiante `design-brain/toolbox/references/` (o card bom salvo é só do juiz).
2. **Juiz independente.** Depois do passo de juntar as partes e de a checagem de layout dar `ok` (passo 2c do `/explore`), chame **um** agente `general-purpose`, sem dizer nada do que os `proto-explorer` fizeram, com: "Você é o juiz do playbook. Leia `design-brain/toolbox/judge.md` e siga-o à risca, com as regras de `design-brain/toolbox/playbook.md`. Pasta da exploração: `docs/explorations/<slug>`. Você não muda nada na exploração; o único arquivo que escreve é `docs/explorations/<slug>/playbook-judge.md`. Responda em português: o caminho do relatório e uma linha por opção com o maior nível e o conjunto mais perto." O juiz avisa, nunca corrige: não reenvie o que ele achou aos `proto-explorer` por conta própria; mostre ao designer e espere o pedido dele.
3. **Relatório final.** Some ao relatório do `/explore` (passo 2d) o caminho do `playbook-judge.md` e as linhas do juiz, com o nível de cada opção. Deixe de fora: reafirmar o brief, elogio genérico e a lista do que passou.

O resto é o `/explore`: mesmos arquivos, mesmo servidor, mesma página. O playbook está em `design-brain/toolbox/` (`README.md` lista o que existe).
