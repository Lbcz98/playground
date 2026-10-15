# Referências de design

Cada imagem de `Cards/` e `Composition/` foi estudada com as skills de UI e virou uma **nota de anatomia** em `analises/`. As notas são a fonte: o catálogo (tags, padrão, resumo) sai das três primeiras linhas de cada uma. **Os agentes não leem este arquivo, nem as notas inteiras, nem `interacoes.md` inteiro.** Consultam com o script, que devolve só o que se pede:

```bash
node scripts/explore-ref.mjs --list [filtro]        # uma linha por referência (nome | padrão | tags | resumo); o filtro é uma palavra
node scripts/explore-ref.mjs <nome> [seções…]       # só essas seções; sem seções: cerne e receita
node scripts/explore-ref.mjs --teclas               # as teclas dentro do card
node scripts/explore-ref.mjs --padroes [nome]       # a tabela de padrões de interação, ou só uma linha
```

Seções de uma nota: `cerne` `pecas` `tipografia` `posicao` `cor` `hierarquia` `interacao` `minucias` `porque` `receita` `falhas`, ou `tudo`.

A ideia não é copiar. É entender a estrutura para construir com os tokens do kit e com o controle remoto: proporções, hierarquia e lógica da cor valem; as cores, as medidas e a aparência da imagem não.

## Como adicionar uma referência

1. Coloque a imagem em `Cards/` (o cartão como o espectador o vê) ou `Composition/` (a organização interna, o que fica onde), com nome descritivo.
2. Peça ao agente `proto-reference-analyst` para escrever a nota em `analises/<nome>.md`. Ela entra no catálogo sozinha.
3. Mantenha entre 10 e 20 referências.

## Para manter as notas baratas de ler

- As três primeiras linhas da nota (`Tags`, `Padrão`, `Resumo`) são o que o agente vê ao escolher: uma ideia por tag, o resumo em uma frase.
- Os títulos das seções não mudam (o script os usa como chave) e cada seção traz só o que o título promete, sem repetir o que está em outra.
- `interacoes.md` mantém "Teclas dentro do card" e "Padrões" como as duas seções, e cada padrão em uma linha da tabela.
