Pedido: "crie 4 opções de uma interatividade de previsão do tempo"

- **Para quê e onde:** navegar a previsão por dias/horas na tela de clima da TV; o espectador percorre os itens com ←/→ e vê o detalhe de cada um.
- **Intenção:** claro e legível de relance. Evitar tela cheia de números e cara de app de clima de celular. `Suposição:` sem ícones decorativos soltos; símbolo de clima só quando serve ao dado.
- **Prioridade:** temperatura + condição do item em foco, em número âncora; chuva, vento e o resto em segundo plano.
- **Controle:** interativo. ←/→ move entre os itens (dias ou horas), Enter abre/alterna o detalhe, Voltar desfaz; ↑/↓ passam para a tela.
- **Estados:** foco, selecionado/aberto. `Suposição:` sem carregando, vazio ou erro.
- **Conteúdo:** São Paulo · 5 dias (Hoje, Qui, Sex, Sáb, Dom) · hoje 24°, parcialmente nublado, máx 27°/mín 18°, chuva 30%, vento 14 km/h. `Suposição:` dados fictícios, °C, km/h, %.
- **O que varia:** tese, referência principal e padrão de interação. Fica igual: os dados, o local e a superfície. 4 opções.
- Superfície: Content Card (painel alto da interatividade), a mesma nas quatro.

## Direções

1. **Tese:** o dia selecionado vira o herói e o detalhe dele aparece no próprio card.
   - Referência: trilho-de-dias-com-seletor (hierarquia: trilho de pílulas, seleção por inversão).
   - Interação: Trilho de passos. ←/→ move a seleção entre os 5 dias; Enter abre o detalhe do dia no lugar.
   - Peças: trilho de dias; temperatura âncora; condição; detalhe (chuva, vento).
2. **Tese:** o foco revela o detalhe na própria linha do dia, sem sair do card.
   - Referência: cartoes-contexto-evento-voz-clima-voo (posição: âncora gigante + linha que se abre).
   - Interação: Expandir no lugar. ←/→ move entre as peças (hoje, dias); Enter expande/recolhe.
   - Peças: "24°" âncora; condição; linha recolhida "Próximos dias ⌄"; detalhe do dia.
3. **Tese:** o mesmo dia em duas leituras, números ou curva por hora, com o resumo fixo.
   - Referência: semana-barras-e-radial (interação: duas visões, total fixo).
   - Interação: Alternar visão. ←/→ percorre as horas; Enter troca entre barras e lista de horas.
   - Peças: temperatura âncora fixa; gráfico por hora; legenda; marcador de agora.
4. **Tese:** a previsão é uma lista de conclusões ("Leve guarda-chuva") com o número como prova.
   - Referência: saude-anel-metricas-e-barras (hierarquia: título como conclusão, linha com valor).
   - Interação: Lista de métricas. ←/→ vai à métrica anterior/próxima (temperatura, chuva, vento); Enter abre o detalhe da linha.
   - Peças: título-conclusão; linha de temperatura; linha de chuva; linha de vento.

## Depois da aprovação
Slug `previsao-do-tempo-5`; copiar este plano para `docs/explorations/previsao-do-tempo-5/brief.md`; 4 `proto-explorer` em paralelo (modo parte) lendo DESIGN.md, playbook.md e judge.md; stitch; check-explore-layout até `ok`; juiz independente; servidor e página ao vivo.
