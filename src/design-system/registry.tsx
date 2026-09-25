/**
 * ComponentRegistry — a `DesignSystemManifest` hydrated with React `render`
 * functions. This is what the canvas uses to turn a `CanvasNode` into real DOM.
 *
 * `hydrateRegistry(manifest)` pairs every component the active manifest declares
 * with a renderer:
 *   - the built-in ScreenFlow design system uses the hand-written renderers below
 *   - every other (imported) design system renders through `renderGeneric` — a
 *     token-driven structural placeholder — because we don't load external
 *     Storybook React modules
 *
 * Per-component Zod schemas and default props are compiled from the manifest
 * (`manifest-zod.ts`), so the registry always tracks the live design system.
 */

import {
  Children,
  Component,
  type ErrorInfo,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useLayoutEffect,
  useRef,
} from 'react'
import { z } from 'zod'
import { cx } from '@/lib/cx'
import type {
  DesignSystemManifest,
  ManifestComponent,
  ManifestTokens,
} from '@/shared/design-system/manifest'
import { compileManifestSchemas, compiledDefaultProps } from '@/shared/design-system/manifest-zod'
import { SCREENFLOW_MANIFEST_ID } from '@/shared/design-system/screenflow-manifest'
import type { LiveComponentMap } from './liveBundle'
import { CanvasButton, CanvasStack, CanvasText } from './canvasKit'
import {
  alertBugSchema,
  buttonSchema,
  closeButtonSchema,
  contentCardBodySchema,
  contentCardFooterSchema,
  contentCardHeaderSchema,
  contentCardSchema,
  interactivityCardSchema,
  interactivityMenuSchema,
  labelVideoSchema,
  mainMenuSchema,
  notificationSchema,
  roundedButtonSchema,
  stackSchema,
  tableCellSchema,
  textSchema,
  wideButtonSchema,
} from './catalog'
import { AlertBug } from '@/ui-kit/AlertBug'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { LabelVideo } from '@/ui-kit/LabelVideo'
import { MainMenu } from '@/ui-kit/MainMenu'
import { CloseButton } from '@/ui-kit/CloseButton'
import {
  ContentCard,
  ContentCardBody,
  ContentCardFooter,
  ContentCardHeader,
} from '@/ui-kit/ContentCard'
import { TableCell } from '@/ui-kit/TableCell'
import { Notification } from '@/ui-kit/Notification'
import { RoundedButton } from '@/ui-kit/RoundedButton'
import { WideButton } from '@/ui-kit/WideButton'

export type { Control, ComponentCategory } from './catalog'

export type RenderFn = (props: Record<string, unknown>, children: ReactNode) => ReactElement

export interface HydratedEntry {
  id: string
  label: string
  category: string
  summary: string
  acceptsChildren: boolean
  component: ManifestComponent
  /** Strict object schema compiled from the manifest. */
  schema: z.ZodObject<z.ZodRawShape>
  /** Per-prop schemas, for field-level validation / repair. */
  fieldSchemas: Record<string, z.ZodTypeAny>
  defaultProps: Record<string, unknown>
  render: RenderFn
  /** True when this renders through the generic placeholder. */
  generic: boolean
  /** True when this renders the design system's OWN React component (Phase 8B). */
  live: boolean
}

export interface HydratedRegistry {
  manifestId: string
  entries: Record<string, HydratedEntry>
  types: string[]
  /** How many entries render live components vs. the generic placeholder. */
  liveCount: number
  genericCount: number
  get: (type: string) => HydratedEntry | null
  has: (type: string) => boolean
}

// ===========================================================================
// Canvas kit — Stack, Text, Button (`canvasKit.tsx`). Called as plain functions,
// not mounted, so the element returned is the component's own root: the one
// NodeRenderer decorates with selection and `data-node-id`. They have no hooks.
// ===========================================================================

function renderStack(raw: Record<string, unknown>, children: ReactNode): ReactElement {
  return CanvasStack({ ...stackSchema.parse(raw), children })
}

function renderText(raw: Record<string, unknown>): ReactElement {
  return CanvasText(textSchema.parse(raw))
}

function renderButton(raw: Record<string, unknown>): ReactElement {
  return CanvasButton(buttonSchema.parse(raw))
}

// ===========================================================================
// DTV UI Kit — the real components, straight from `src/ui-kit`. No styling
// lives here: each renderer only parses the node's props and hands them over,
// so the canvas and Storybook draw the very same element.
// ===========================================================================

function renderMainMenu(raw: Record<string, unknown>): ReactElement {
  const { focusedItem, ...rest } = mainMenuSchema.parse(raw)
  return <MainMenu focusedItem={focusedItem === 'none' ? null : focusedItem} {...rest} />
}

function renderInteractivityMenu(raw: Record<string, unknown>, children: ReactNode): ReactElement {
  const p = interactivityMenuSchema.parse(raw)
  return (
    <InteractivityMenu heading={p.heading || undefined} align={p.align}>
      {children}
    </InteractivityMenu>
  )
}

function renderInteractivityButton(raw: Record<string, unknown>): ReactElement {
  const { advertisingLabel, ...p } = interactivityCardSchema.parse(raw)
  return <InteractivityButton {...p} advertising={advertisingLabel ? { label: advertisingLabel } : undefined} />
}

function renderLabelVideo(raw: Record<string, unknown>): ReactElement {
  return <LabelVideo {...labelVideoSchema.parse(raw)} />
}

function renderWideButton(raw: Record<string, unknown>): ReactElement {
  return <WideButton {...wideButtonSchema.parse(raw)} />
}

function renderRoundedButton(raw: Record<string, unknown>): ReactElement {
  return <RoundedButton {...roundedButtonSchema.parse(raw)} />
}

function renderCloseButton(raw: Record<string, unknown>): ReactElement {
  return <CloseButton {...closeButtonSchema.parse(raw)} />
}

function renderContentCard(raw: Record<string, unknown>, children: ReactNode): ReactElement {
  return <ContentCard {...contentCardSchema.parse(raw)}>{children}</ContentCard>
}

/** The catalog's flat header fields → the kit's match / stats / partner / ad shapes. */
function renderContentCardHeader(raw: Record<string, unknown>): ReactElement {
  const p = contentCardHeaderSchema.parse(raw)
  const stats = [p.stat1, p.stat2, p.stat3].filter(Boolean)
  return (
    <ContentCardHeader
      overline={p.overline}
      title={p.title}
      subtitle={p.subtitle}
      match={p.homeTeam && p.awayTeam ? { home: { name: p.homeTeam }, away: { name: p.awayTeam } } : undefined}
      stats={stats.length ? stats : undefined}
      partner={p.partnerName ? { name: p.partnerName, verified: p.partnerVerified } : undefined}
      ad={p.adLabel ? { label: p.adLabel } : undefined}
    />
  )
}

function renderContentCardBody(raw: Record<string, unknown>, children: ReactNode): ReactElement {
  return <ContentCardBody {...contentCardBodySchema.parse(raw)}>{children}</ContentCardBody>
}

function renderContentCardFooter(raw: Record<string, unknown>, children: ReactNode): ReactElement {
  return <ContentCardFooter {...contentCardFooterSchema.parse(raw)}>{children}</ContentCardFooter>
}

/** The flat row props the canvas edits, resolved to the row the type actually draws. */
function renderTableCell(raw: Record<string, unknown>): ReactElement {
  const p = tableCellSchema.parse(raw)
  if (p.cellType === 'scout') {
    const values: [string, string] | undefined = p.leftValue || p.rightValue ? [p.leftValue, p.rightValue] : undefined
    return <TableCell type="scout" label={p.label} values={values} divider={p.divider} />
  }
  if (p.cellType === 'athlete') {
    return (
      <TableCell
        type="athlete"
        number={p.lead || undefined}
        name={p.label}
        yellowCard={p.yellowCard}
        redCard={p.redCard}
        goals={p.goals || undefined}
        substitute={p.substitute || undefined}
        divider={p.divider}
      />
    )
  }
  const stats = [p.stat1, p.stat2, p.stat3].filter(Boolean)
  return (
    <TableCell
      position={p.lead || undefined}
      name={p.label}
      favorite={p.favorite}
      stats={stats.length ? stats : undefined}
      divider={p.divider}
    />
  )
}

function renderNotification(raw: Record<string, unknown>): ReactElement {
  return <Notification {...notificationSchema.parse(raw)} />
}

function renderAlertBug(raw: Record<string, unknown>): ReactElement {
  return <AlertBug {...alertBugSchema.parse(raw)} />
}

// ===========================================================================
// Generic renderer — the fallback for any imported component with no code
// renderer. Structural only, but genuinely themed: every visual property comes
// from the active manifest's tokens via the `--sfs-*` custom properties scoped
// onto the canvas surface (see `cssVars.ts` / `Canvas.tsx`) — never a literal
// color or length, so this stays true to whichever design system is active
// without loading any external Storybook React module.
// ===========================================================================

const TOKEN_VAR_ALIAS: Record<keyof ManifestTokens, string> = {
  colors: 'color',
  spacing: 'space',
  typography: 'type',
  radius: 'radius',
  shadow: 'shadow',
  gradients: 'gradient',
}

function tokenVar(group: keyof ManifestTokens, name: string): string {
  return `var(--sfs-${TOKEN_VAR_ALIAS[group]}-${name})`
}

/**
 * If this component declares a prop drawing from `group` whose name matches
 * `nameHint`, and the node's value names a token the active manifest actually
 * has, resolve it to a CSS `var()`. This is how a component's own props (e.g.
 * a `background` prop set to `"surface"`) drive the placeholder's actual look
 * — and why a hallucinated or stale token name safely falls through instead
 * of resolving to a dangling, silently-blank `var()`.
 */
function resolvedTokenValue(
  component: ManifestComponent,
  props: Record<string, unknown>,
  tokens: ManifestTokens,
  group: keyof ManifestTokens,
  nameHint: RegExp,
): string | undefined {
  const prop = Object.values(component.props).find(
    (p) => p.tokenGroup === group && nameHint.test(p.name),
  )
  if (!prop) return undefined
  const value = props[prop.name]
  if (typeof value !== 'string' || !value) return undefined
  const dict = tokens[group]
  return dict && value in dict ? tokenVar(group, value) : undefined
}

function summariseProps(component: ManifestComponent, props: Record<string, unknown>): string {
  const parts: string[] = []
  for (const prop of Object.values(component.props)) {
    const value = props[prop.name]
    if (value === undefined || value === '' || value === false) continue
    parts.push(`${prop.name}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  }
  return parts.join('  ·  ')
}

function makeGenericRenderer(component: ManifestComponent, tokens: ManifestTokens): RenderFn {
  return function renderGeneric(props, children): ReactElement {
    const summary = summariseProps(component, props)

    // The box's own chrome — always resolves, because the canvas seeds the
    // built-in ScreenFlow token values underneath whatever the active
    // manifest overrides (see `Canvas.tsx`).
    const background =
      resolvedTokenValue(component, props, tokens, 'colors', /background|\bbg\b|\bfill\b|surface/i) ??
      tokenVar('colors', 'surface')
    const text =
      resolvedTokenValue(component, props, tokens, 'colors', /text|foreground|\bfg\b|\bink\b/i) ??
      tokenVar('colors', 'ink')
    const radius =
      resolvedTokenValue(component, props, tokens, 'radius', /./) ?? tokenVar('radius', 'md')
    const padding =
      resolvedTokenValue(component, props, tokens, 'spacing', /padding|inset/i) ??
      tokenVar('spacing', 'md')

    return (
      <div
        className="flex flex-col gap-3xs border border-l-4"
        style={{
          backgroundColor: background,
          color: text,
          borderColor: tokenVar('colors', 'line'),
          borderLeftColor: tokenVar('colors', 'brand'),
          borderRadius: radius,
          padding,
        }}
      >
        <span className="text-xs font-semibold" style={{ opacity: 0.7 }}>
          {component.name}
        </span>
        {summary ? <span className="text-sm">{summary}</span> : null}
        {component.acceptsChildren ? (
          <div
            className="flex flex-col"
            style={{ gap: tokenVar('spacing', 'sm'), paddingTop: tokenVar('spacing', 'xs') }}
          >
            {children}
          </div>
        ) : null}
      </div>
    )
  }
}

// ===========================================================================
// Live renderer — Phase 8B. Renders the design system's OWN React component
// (loaded via `liveBundle.ts`), wrapped in a real error boundary: one bundle
// component crashing must never take the rest of the canvas down with it.
// ===========================================================================

/**
 * `NodeRenderer` decorates whatever a registry entry's `render()` returns with
 * selection styling, a click handler and `data-node-id` via `cloneElement` on the
 * OUTERMOST element. For a live component that element is a `DecorationHost` (a
 * `display: contents` span), so the decoration reaches the canvas whatever props
 * the bundle's component accepts — success or crashed.
 */
interface Decoration {
  className?: string
  onClick?: (event: MouseEvent<HTMLElement>) => void
  /** Set by `NodeRenderer` so the canvas can map DOM back to the tree. */
  'data-node-id'?: string
}

function CrashedPlaceholder({
  component,
  message,
  className,
  onClick,
  'data-node-id': nodeId,
}: Decoration & { component: ManifestComponent; message: string }): ReactElement {
  return (
    <div
      data-node-id={nodeId}
      className={cx('flex flex-col gap-3xs border border-l-4 border-dashed', className)}
      onClick={onClick}
      style={{
        backgroundColor: tokenVar('colors', 'surface'),
        color: tokenVar('colors', 'ink'),
        borderColor: tokenVar('colors', 'line'),
        borderLeftColor: tokenVar('colors', 'danger'),
        borderRadius: tokenVar('radius', 'md'),
        padding: tokenVar('spacing', 'md'),
      }}
    >
      <span className="text-xs font-semibold" style={{ opacity: 0.7 }}>
        {component.name} — crashed
      </span>
      <span className="text-sm">{message}</span>
    </div>
  )
}

interface BoundaryProps extends Decoration {
  component: ManifestComponent
  children: ReactElement
}
interface BoundaryState {
  error: Error | null
}

class LiveComponentBoundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[registry] live component "${this.props.component.name}" crashed:`, error, info)
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <CrashedPlaceholder
          component={this.props.component}
          message={this.state.error.message}
          className={this.props.className}
          onClick={this.props.onClick}
          data-node-id={this.props['data-node-id']}
        />
      )
    }
    // The canvas decoration lives on the `DecorationHost` around this boundary
    // (see `makeLiveRenderer`): a bundle's components take only their own props.
    return this.props.children
  }
}

function makeLiveRenderer(
  component: ManifestComponent,
  LiveComponent: LiveComponentMap[string],
): RenderFn {
  // Child nodes when the Blueprint nests some; otherwise the component's own
  // `children` prop — the text a Storybook component takes as its children.
  return function renderLive(props, children): ReactElement {
    return (
      // Keyed on the props so fixing a bad value in the Property Inspector
      // remounts (and gives the component a fresh chance) rather than being
      // stuck showing a stale crash from before the edit.
      // A bundle's components drop props they don't declare, so the canvas
      // decoration (node id, click, selection ring) goes on a box-less host.
      <DecorationHost>
        <LiveComponentBoundary component={component} key={JSON.stringify(props)}>
          <LiveComponent {...props}>{component.acceptsChildren && Children.count(children) > 0 ? children : props.children}</LiveComponent>
        </LiveComponentBoundary>
      </DecorationHost>
    )
  }
}

// ===========================================================================
// Registry hydration
// ===========================================================================

/**
 * The DTV kit components take only their own props, so the canvas' decoration
 * (`data-node-id`, the click handler) would be dropped on them — a node could be
 * neither selected nor, in Play, clicked. This host carries it instead: a span
 * with `display: contents`, so it has no box and the layout is exactly the kit's.
 */
export function DecorationHost({
  children,
  onClick,
  ...rest
}: {
  children?: ReactNode
  onClick?: (event: MouseEvent) => void
  'data-node-id'?: string
  /** Edit mode's chrome: `selected` rings the kit's own root, `editable` rings it on hover. */
  'data-selected'?: boolean
  'data-editable'?: boolean
  className?: string
}): ReactElement {
  const host = useRef<HTMLSpanElement>(null)
  const selected = rest['data-selected'] === true
  const editable = rest['data-editable'] === true

  // The host has no box, so the ring goes on the kit's own root element.
  useLayoutEffect(() => {
    const el = host.current?.firstElementChild
    if (!el) return
    el.classList.toggle('ring', selected)
    el.classList.toggle('ring-brand', selected)
    el.classList.toggle('hover:ring', editable && !selected)
    el.classList.toggle('hover:ring-brand-subtle', editable && !selected)
  }, [selected, editable])

  return (
    <span ref={host} data-node-id={rest['data-node-id']} onClick={onClick} style={{ display: 'contents' }}>
      {children}
    </span>
  )
}

const hosted =
  (render: RenderFn): RenderFn =>
  (props, children) => <DecorationHost>{render(props, children)}</DecorationHost>

/** Hand-written renderers for the built-in ScreenFlow design system. */
export const SCREENFLOW_RENDERERS: Record<string, RenderFn> = {
  Stack: renderStack,
  Text: renderText,
  Button: renderButton,
  MainMenu: hosted(renderMainMenu),
  InteractivityMenu: hosted(renderInteractivityMenu),
  InteractivityButton: hosted(renderInteractivityButton),
  LabelVideo: renderLabelVideo,
  WideButton: hosted(renderWideButton),
  RoundedButton: hosted(renderRoundedButton),
  CloseButton: hosted(renderCloseButton),
  ContentCard: hosted(renderContentCard),
  ContentCardHeader: hosted(renderContentCardHeader),
  ContentCardBody: hosted(renderContentCardBody),
  ContentCardFooter: hosted(renderContentCardFooter),
  TableCell: hosted(renderTableCell),
  Notification: hosted(renderNotification),
  AlertBug: hosted(renderAlertBug),
}

export function hydrateRegistry(
  manifest: DesignSystemManifest,
  live?: LiveComponentMap,
): HydratedRegistry {
  const schemas = compileManifestSchemas(manifest)
  const useCode = manifest.id === SCREENFLOW_MANIFEST_ID
  const entries: Record<string, HydratedEntry> = {}
  let liveCount = 0

  for (const component of Object.values(manifest.components)) {
    const schema = schemas[component.id]
    const codeRender = useCode ? SCREENFLOW_RENDERERS[component.id] : undefined
    const liveComponent = !useCode ? live?.[component.id] : undefined
    if (liveComponent) liveCount++

    entries[component.id] = {
      id: component.id,
      label: component.name,
      category: component.category ?? 'component',
      summary: component.description,
      acceptsChildren: component.acceptsChildren,
      component,
      schema,
      fieldSchemas: schema.shape as Record<string, z.ZodTypeAny>,
      defaultProps: compiledDefaultProps(component, schema),
      render:
        codeRender ??
        (liveComponent ? makeLiveRenderer(component, liveComponent) : makeGenericRenderer(component, manifest.tokens)),
      generic: !codeRender && !liveComponent,
      live: !!liveComponent,
    }
  }

  const types = Object.keys(entries)
  const genericCount = Object.values(entries).filter((e) => e.generic).length
  return {
    manifestId: manifest.id,
    entries,
    types,
    liveCount,
    genericCount,
    get: (type) => entries[type] ?? null,
    has: (type) => type in entries,
  }
}
