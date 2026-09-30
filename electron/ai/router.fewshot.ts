/**
 * The router classifier's few-shot examples. Kept apart from the phase 9G
 * evaluation set (`tests/eval/modes.golden.json`): a request that appears here
 * must never appear there, or the accuracy metric measures memorization.
 */

import type { ClassifierReply } from './router'

export const ROUTER_FEWSHOT: readonly { request: string; reply: ClassifierReply }[] = [
  {
    request: 'Home com uma notificação sobre a votação ao vivo',
    reply: {
      reasoning: 'Home com uma notificação é um modelo de camada que já existe, com componentes do catálogo. Nada sai do padrão.',
      mode: 'faithful',
      conflicts: [],
    },
  },
  {
    request: 'E se o rodapé do card de conteúdo viesse antes do cabeçalho?',
    reply: {
      reasoning: 'Pede para trocar a ordem das zonas do card de conteúdo. A ordem dos slots é um padrão, e o pedido pergunta "e se".',
      mode: 'exploratory',
      conflicts: [{ ruleId: 'layout.slots', why: 'o rodapé viria antes do cabeçalho, fora da ordem das zonas' }],
      faithfulAlternative: 'Card de conteúdo com cabeçalho, corpo e rodapé, na ordem do padrão.',
    },
  },
  {
    request: 'Use o vermelho #ff0000 no título da notificação',
    reply: {
      reasoning: 'Pede um hex cru. Só tokens podem ser usados, em qualquer modo.',
      mode: 'faithful',
      conflicts: [{ ruleId: 'tokens.only', why: '#ff0000 é um valor cru, não um token' }],
      faithfulAlternative: 'Notificação com o título na cor de destaque do design system.',
    },
  },
  {
    request: 'Quatro cards de interatividade lado a lado numa tela de nível 3',
    reply: {
      reasoning: 'O nível 3 mostra um único módulo; quatro cards lado a lado passam desse limite. O limite de módulos por nível é um padrão.',
      mode: 'exploratory',
      conflicts: [{ ruleId: 'level.module-limit', why: 'quatro módulos numa tela de nível 3, que mostra um só' }],
      faithfulAlternative: 'Uma tela de nível 3 com uma interatividade só, e o trilho de quatro cards no nível 2.',
    },
  },
  {
    request: 'Um botão largo escrito OK que abre as estatísticas',
    reply: {
      reasoning: 'O rótulo "OK" não diz o que o botão faz. É uma convenção: só gera uma nota.',
      mode: 'faithful',
      conflicts: [{ ruleId: 'copy.button-label', why: '"OK" não diz que o botão abre as estatísticas' }],
      faithfulAlternative: 'Um botão largo escrito "Ver estatísticas".',
    },
  },
  {
    request: 'Explore um layout com o menu principal no topo da tela',
    reply: {
      reasoning: 'Nenhum modelo de camada sombreia o topo para o menu principal; o menu fica na base. Pede para explorar.',
      mode: 'exploratory',
      conflicts: [{ ruleId: 'layers.overlay-model', why: 'nenhum modelo de camada põe o menu no topo' }],
      faithfulAlternative: 'Home com o menu principal na base da tela.',
    },
  },
]
