crie uma única exploração do Bug interativo: o alerta "CONTEÚDO INTERATIVO" que aparece no canto inferior direito da tela, antes de o usuário abrir a home. É a animação padrão do sistema; quero recriá-la para documentar no Storybook e torná-la parte do kit. Depois de criada, ajustar os tempos no /tune com o storyboard (interface-craft).

**Para quê e onde:** avisa o espectador, durante o vídeo, de que há conteúdo interativo; ele aperta Enter para ir à camada 1 (home). Canto inferior direito, sobre o vídeo.
**Intenção:** discreto mas reconhecível, fiel ao Bug da Globo. Evitar: aparência de loading (o giro do halo não pode parecer spinner), cores fora do Bug (azul, verde, amarelo e laranja do próprio Bug).
**Foco:** o Bug (esfera) é a peça única; o texto "CONTEÚDO INTERATIVO" e o halo o acompanham.
**Controle:** nesta rodada, só a animação. O Enter é a ação no surgimento do Bug (leva à camada 1), mas isso fica fora do escopo agora. Suposição: o Bug não recebe foco nem teclas nesta exploração.
**Estados:** entrada (0 → 100% em 800ms) e permanência (halo girando até o componente sair da tela). Suposição: sem estado de saída, sem carregando nem vazio.
**Conteúdo:** esfera do Bug da Globo, halo em gradiente cônico, texto branco em caixa alta em duas linhas ("CONTEÚDO" / "INTERATIVO"), seta de subida só na referência (não aparece na tela).
**O que varia:** nada. 1 opção só (decisão do designer). Fica igual: movimento, posição e dados da referência.
Superfície: nenhuma (elemento flutuante sobre o vídeo, não é Card nem Content Card; o brief diz isso ao agente)

**Movimento (do designer)**
- Início: Bug a 0% de opacidade; o texto, numa camada atrás do Bug, também a 0%; o halo a 0% e do mesmo tamanho do Bug.
- Em 800ms: o Bug entra em foco até 100%; o texto sobe e vai a 100%; o halo cresce até o tamanho final e chega a 100%.
- Depois: o halo faz uma animação de giro (gyro) contínua enquanto o componente estiver na tela.
- Posição: alinhado ao Bug da camada de gráficos do vídeo (marcas d'água e versões acesas), no canto inferior direito; ajuste fino de posição fica como dial no /tune.

**Opção 1: Bug interativo (única)**
- **Tese:** o Bug acende e o halo se abre ao redor dele, como o Bug do vídeo ganhando uma segunda camada; o texto sobe de trás do Bug.
- **Referência:** a imagem do designer (sequência de 800ms); sem referência do catálogo (o catálogo é de cards).
- **Interação:** nenhuma nesta rodada (animação de entrada + giro).
- **Peças:** Bug (esfera), texto em camada atrás, halo.

**Pendências**
- Assets: o designer vai enviar o Bug da Globo (esfera) e a fonte do texto. O agente só começa a opção depois de receber.
- Depois de aprovada a opção: abrir /tune nela, com dials de duração (800ms), atraso do texto, deslocamento da subida, tamanho final do halo, velocidade do giro e posição.

**Já existe no kit:** `src/ui-kit/AlertBug.tsx` (nó Figma 2033:4126) desenha o Bug (círculo, foco, estilos `interface` e `transmission`) e recebe a marca por `src`. A variante `Motion` do Figma foi deixada ao app. Esta exploração é essa camada de movimento (texto atrás, halo, entrada de 800ms, giro): estender o `AlertBug`, não criar outro componente.
