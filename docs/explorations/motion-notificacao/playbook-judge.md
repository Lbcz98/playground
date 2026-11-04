# Juiz: motion-notificacao

Fatos medidos:
- `check-explore-tokens.mjs`: ok — 1 advisory relevante às opções julgadas: `width: 252px` em `.o5-pill[data-stage="alive"]` e na expressão `left: calc(100% - card-inset - 252px)` (opção 5); os demais advisories (160 px, 260 px, 80 px, 72 px) pertencem a outras opções do arquivo.
- `check-explore-layout.mjs`: ok (informado pelo usuário; confirmado rodando com `--shots`)
- Screenshots: obtidas com `--shots "$TMPDIR/judge-shots-5-8" --keys ArrowRight,Enter`; lidas para repouso, ArrowRight e Enter.

---

## Opção 5: Desce e abre juntos

Mais perto de: **bom** — um único padrão de interação, dois cenários organizados (com foco / sem foco), respiro generoso, hierarquia legível (título bold, corpo regular), nenhuma cor inventada.

Padrão de interação: **notificação passiva** — chegada + expansão + recolhimento automáticos; sem navegação dentro do card.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Aviso | `.o5-pill[data-stage="alive"]` e `left: calc(...)` | Largura aberta deve derivar de tokens do kit | Calcular via `--dimension-size-semantic-notification-text-width` + `avatar` + espaçamentos, como a opção 8 faz com `--o8-open-w` | `width: 252px` e `- 252px` hardcoded; token check confirmou o advisory |
| Nota | `.o5-pill--focus.is-ring-on` (anel de foco) | Kit usa `gradient-semantic-focus-ring` com técnica de máscara | `var(--gradient-semantic-focus-ring)` | `box-shadow` com `--color-semantic-focus-inset` / `--color-semantic-focus-outline`; tokens do kit presentes, técnica diverge |
| Nota | `.o5-var-value` | `text-footnote-regular` em texto sem decisão | Permitido como nota em rótulos secundários sem decisão | Metadados do storyboard; aceitável |

---

## Opção 8: Pouso curto, saída inteira

Mais perto de: **bom** — padrão único (notificação passiva), gesto assimétrico intencional (chegada 320 ms / saída 640 ms) declarado na tese, respiro adequado, dois cenários organizados, largura aberta computada inteiramente de tokens do kit.

Padrão de interação: **notificação passiva** — chegada + expansão + recolhimento e saída via timer; `keydown Enter` reinicia o player do storyboard (controle de demonstração, não padrão da notificação).

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Nota | `.o8-scene-label` | `text-footnote-medium` em rótulo de cenário sem decisão | Permitido como nota em rótulos secundários sem decisão | Metadados do storyboard; aceitável |

---

## Resumo

Nenhuma opção apresenta Crítico. A opção 5 carrega um **Aviso** (largura aberta de 252 px hardcoded em vez de calculada de tokens do kit). A opção 8 está limpa de Aviso.
