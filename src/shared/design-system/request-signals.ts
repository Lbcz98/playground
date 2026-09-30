/**
 * What a request's words say before any model reads it (phase 9C): which of the
 * design system's components it names, which UI parts it names that the system
 * doesn't have, and whether it asks to explore. The router's deterministic
 * signals and the planner prompt's `appliesTo` filter both read this.
 *
 * A heuristic, not a parser: aliases are matched as whole words on normalized
 * text (lowercase, no accents), longest first, so "botão de fechar" is the close
 * button and not also a plain button, and "menu suspenso" is a dropdown and not
 * the main menu. A mention the heuristic misses only means a component rule is
 * left out of the planner prompt; the validator still enforces every rule.
 */

import type { DesignSystemManifest } from './manifest'
import { SCREENFLOW_MANIFEST_ID } from './screenflow-manifest'

export interface RequestSignals {
  /** Ids of the manifest components the request names. */
  components: string[]
  /** UI parts the request names that the design system has no component for. */
  unknown: string[]
  /** The words that ask to leave the patterns ("explore", "e se", "fora do padrão"). */
  exploration: string[]
}

/**
 * Portuguese names for the built-in DTV components. Code, not manifest data: an
 * imported system is matched by its component ids and names only.
 */
const PT_ALIASES: Record<string, readonly string[]> = {
  Button: ['botao', 'botoes'],
  WideButton: ['botao largo', 'botoes largos', 'botao de acao', 'botao assistir'],
  RoundedButton: ['botao redondo', 'botoes redondos', 'botao de voltar', 'botao voltar'],
  CloseButton: ['botao de fechar', 'botao fechar', 'botao x'],
  MainMenu: ['menu principal', 'menu', 'botao de programa', 'botao do programa'],
  InteractivityMenu: ['trilho', 'trilhos', 'rail'],
  InteractivityButton: [
    'interatividade',
    'interatividades',
    'card de interatividade',
    'cards de interatividade',
    'botao de interatividade',
    'botoes de interatividade',
  ],
  ContentCard: ['card de conteudo', 'cards de conteudo', 'cartao de conteudo'],
  ContentCardHeader: ['cabecalho do card', 'cabecalho'],
  ContentCardBody: ['corpo do card'],
  ContentCardFooter: ['rodape do card', 'rodape'],
  TableCell: ['tabela', 'tabelas', 'linha da tabela', 'escalacao'],
  Notification: ['notificacao', 'notificacoes', 'aviso', 'avisos'],
  AlertBug: ['alerta', 'alertas', 'bug de alerta'],
  LabelVideo: ['selo ao vivo', 'selo de ao vivo', 'selo replay', 'etiqueta ao vivo'],
  Text: ['texto', 'textos'],
}

/** Common UI parts, by the name the router reports them under. Matched only when no component claims the words. */
const UI_PARTS: Record<string, readonly string[]> = {
  carousel: ['carrossel', 'carrosseis', 'carousel'],
  modal: ['modal', 'modais', 'popup', 'pop up'],
  dropdown: ['dropdown', 'menu suspenso'],
  sidebar: ['sidebar', 'barra lateral'],
  tabs: ['abas', 'aba', 'tabs'],
  slider: ['slider', 'controle deslizante'],
  tooltip: ['tooltip'],
  accordion: ['accordion', 'acordeao', 'sanfona'],
  toggle: ['toggle', 'switch', 'interruptor'],
  checkbox: ['checkbox', 'caixa de selecao'],
  'text input': ['campo de texto', 'input', 'formulario'],
  chart: ['grafico', 'graficos', 'chart'],
  'progress bar': ['barra de progresso', 'progress bar'],
  avatar: ['avatar'],
}

/** "e se" counts only where a sentence starts ("E se o menu…?"), not in "e se possível". */
const EXPLORATION = [
  /\bexplor(e|ar|a|ando|atorio|atoria)\b/,
  /(^|[.!?]\s*)e se\b/,
  /\bfora do(s)? padr(ao|oes)\b/,
  /\bquebr(e|ar|ando) o padrao\b/,
  /\bexperimental\b/,
  /\bwhat if\b/,
]

const stripAccents = (text: string): string => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** Words only: lowercase, no accents, no punctuation, one space between words. */
const words = (text: string): string => stripAccents(text).replace(/[^a-z0-9]+/g, ' ').trim()

const camelWords = (id: string): string => words(id.replace(/([a-z0-9])([A-Z])/g, '$1 $2'))

export function readRequest(prompt: string, manifest: DesignSystemManifest): RequestSignals {
  type Alias = { text: string; component?: string; part?: string }
  const aliases: Alias[] = []
  const builtIn = manifest.id === SCREENFLOW_MANIFEST_ID
  for (const component of Object.values(manifest.components)) {
    const own = [camelWords(component.id), words(component.name), ...((builtIn && PT_ALIASES[component.id]) || [])]
    for (const text of new Set([...own, ...own.map((a) => `${a}s`)])) if (text) aliases.push({ text, component: component.id })
  }
  for (const [part, forms] of Object.entries(UI_PARTS)) for (const text of forms) aliases.push({ text, part })
  // Longest first; on a tie the design system's own component wins.
  aliases.sort((a, b) => b.text.length - a.text.length || Number(!!a.part) - Number(!!b.part))

  let text = ` ${words(prompt)} `
  const components = new Set<string>()
  const unknown = new Set<string>()
  for (const alias of aliases) {
    const needle = ` ${alias.text} `
    if (!text.includes(needle)) continue
    text = text.split(needle).join(' # ')
    if (alias.component) components.add(alias.component)
    else if (alias.part) unknown.add(alias.part)
  }

  const plain = stripAccents(prompt)
  const exploration = EXPLORATION.map((re) => plain.match(re)?.[0].replace(/^[.!?\s]+/, '').trim()).filter(
    (m): m is string => !!m,
  )
  return { components: [...components], unknown: [...unknown], exploration }
}
