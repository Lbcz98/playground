# Uso de tokens por papel

Cada papel de uma exploração pode deixar uma linha em `docs/explorations/<slug>/usage.jsonl`. O script não chama o modelo: ele só lê o JSON que o `claude -p --output-format json` já devolveu.

```bash
claude -p --output-format json "<pedido do papel>" > /tmp/run.json
node scripts/explore-usage.mjs docs/explorations/<slug> proto-explorer /tmp/run.json
```

Papéis: `proto-explorer`, `proto-art-director`, `proto-playbook-judge`, `proto-judge`, `proto-tuner`.

A linha guarda `input`, `output`, `cache_read` e `cache_write`. Um campo ausente conta como zero. Na próxima rodada BBB, some as linhas de cada papel e compare com a rodada anterior: o explorador não deve mais abrir `DESIGN.md`, `playbook.md` e `judge.md` inteiros, e a crítica roda uma vez, nas opções que o diretor listou em `Aplicar:`.
