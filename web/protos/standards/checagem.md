# Bloqueio e aviso na checagem

- **Bloqueio** (sai com erro; o CI também): lei quebrada, padrão sem `@deviation`, elemento cortado ou fora do quadro, fundo que cobre o quadro, `@reuse`/`@proposal` faltando, link para tela inexistente. Conserte ou declare com `@deviation`.
- **Aviso** (legibilidade: texto sobre texto ou espremido): aparece na saída e no comentário do PR, sem bloquear.
- Chromium que não sobe impede a medição; no CI isso é falha (`--require-render`). Local: `npm run browsers:install`.
