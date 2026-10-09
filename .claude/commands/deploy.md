---
description: Publica as telas da sua pasta em web/protos/<seu-nome>/ para revisão (branch, commit, PR e CI, sem você ver o Git)
argument-hint: "[o que mudou, em uma frase]"
allowed-tools: Bash(npm run deploy:*), Bash(npm run check:laws:*), Bash(git status:*), Bash(git diff:*), Bash(gh run view:*), Bash(gh pr view:*), Read, Edit, Agent
---

Publique o trabalho do designer. Ele não precisa conhecer Git: fale em telas e revisão, nunca em branch, commit ou rebase, a menos que algo falhe.

0. Chame o agente `proto-reviewer` com a pasta do designer. Veredito diferente de `PASS`: conserte o que ele lista (ou, se for um padrão que o designer quer quebrar, pergunte e declare com o pedido citado) e chame de novo. Só siga com `PASS`.
1. Rode `npm run deploy -- --message "$ARGUMENTS"` (sem `--message` se o argumento veio vazio).
2. Leia a saída e aja conforme o estágio:
   - **Sucesso e CI passou:** diga em uma frase que o pull request foi aberto (ou atualizado) e dê o link.
   - **`checks` falhou:** a saída é do `check:laws`. Corrija o TSX em `web/protos/<designer>/` (a mensagem diz a lei e onde; se for um padrão que o designer quer quebrar de propósito, o contrato é um comentário `@deviation <ruleId>: <por quê>` — pergunte antes de declarar), rode `npm run check:laws -- <arquivo>` até ficar limpo e repita o passo 1.
   - **`changes` falhou:** há alterações fora da pasta do designer, ou em mais de uma pasta. Liste os arquivos e pergunte o que fazer. Não os desfaça nem os esconda por conta própria.
   - **CI falhou:** abra o log com `gh run view --log-failed`, corrija na pasta do designer e repita o passo 1 (ele atualiza o mesmo pull request).
   - **`setup` falhou:** diga o que falta (por exemplo `gh auth login`) e pare.
3. Avisos de legibilidade não bloqueiam a publicação; os comentários `@reuse` e `@proposal` fazem parte do contrato e aparecem no comentário do pull request.
4. Nunca use `--force`, nunca publique em `main` e nunca altere arquivos fora de `web/protos/<designer>/` para fazer a checagem passar.
