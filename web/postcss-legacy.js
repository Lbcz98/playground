/**
 * PostCSS, for the TV build only (`npm run build:tv`, Chrome 68 / Safari 16). Each fix is a declaration written in
 * front of the original, which stays last, so an engine that reads the original keeps it:
 *
 * - Logical box properties get their physical sides: `inset` needs Chrome 87, `padding-inline` / `margin-inline`
 *   and the `-block` pair Chrome 87, the `-start` / `-end` longhands Chrome 69. The kit is left-to-right, so both
 *   say the same thing.
 * - A gradient stop with two positions (`linear-gradient(black 0 0)`, the masks' solid fill) needs Chrome 72; it
 *   is written as two stops of the same colour.
 */
const SIDES = {
  inset: ['top', 'right', 'bottom', 'left'],
  'inset-inline': ['left', 'right'],
  'inset-block': ['top', 'bottom'],
  'inset-inline-start': ['left'],
  'inset-inline-end': ['right'],
  'inset-block-start': ['top'],
  'inset-block-end': ['bottom'],
}
for (const box of ['padding', 'margin']) {
  SIDES[`${box}-inline`] = [`${box}-left`, `${box}-right`]
  SIDES[`${box}-block`] = [`${box}-top`, `${box}-bottom`]
  SIDES[`${box}-inline-start`] = [`${box}-left`]
  SIDES[`${box}-inline-end`] = [`${box}-right`]
  SIDES[`${box}-block-start`] = [`${box}-top`]
  SIDES[`${box}-block-end`] = [`${box}-bottom`]
}

/** Splits a value on the spaces between its parts, keeping `calc(a - b)` and the like whole. */
function parts(value) {
  const out = []
  let depth = 0
  let current = ''
  for (const ch of value.trim()) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (/\s/.test(ch) && depth === 0) {
      if (current) out.push(current)
      current = ''
    } else current += ch
  }
  if (current) out.push(current)
  return out
}

/** The value each side gets: one to four parts, read like `margin` (`inset`) or `a b` (a logical pair). */
function perSide(sides, values) {
  if (sides.length === 4) {
    const [top, right = top, bottom = top, left = right] = values
    return [top, right, bottom, left]
  }
  if (sides.length === 2) return [values[0], values[1] ?? values[0]]
  return [values.join(' ')]
}

/** Splits on the commas between arguments, keeping nested functions whole. */
function args(value) {
  const out = []
  let depth = 0
  let current = ''
  for (const ch of value) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      out.push(current)
      current = ''
    } else current += ch
  }
  out.push(current)
  return out
}

const POSITION = /^(-?(\d*\.)?\d+(%|[a-z]+)?|calc\(.*\))$/i
const GRADIENT = /((?:-webkit-)?(?:repeating-)?(?:linear|radial)-gradient)\(/gi

/** `linear-gradient(c 0 0)` → `linear-gradient(c 0, c 0)`; null when the value has no two-position stop. */
function singlePositionStops(value) {
  let changed = false
  let out = ''
  let last = 0
  for (const match of value.matchAll(GRADIENT)) {
    const open = match.index + match[0].length
    let depth = 1
    let close = open
    while (close < value.length && depth > 0) {
      if (value[close] === '(') depth++
      if (value[close] === ')') depth--
      close++
    }
    const inner = value.slice(open, close - 1)
    const stops = args(inner).map((stop) => {
      const p = parts(stop)
      if (p.length !== 3 || !POSITION.test(p[1]) || !POSITION.test(p[2])) return stop
      changed = true
      return ` ${p[0]} ${p[1]}, ${p[0]} ${p[2]}`
    })
    out += value.slice(last, open) + stops.join(',').trim() + ')'
    last = close
  }
  return changed ? out + value.slice(last) : null
}

/** No two-position stops: the gradient fallbacks go in a block only such an engine reads (the minifier would drop a
 *  same-property declaration written just before the original, as overridden). */
const NO_TWO_POSITION_STOPS = 'not (background-image: linear-gradient(black 0 0))'

module.exports = () => {
  const fallbackRules = new WeakMap()
  return {
    postcssPlugin: 'postcss-legacy',
    Declaration(decl, { AtRule }) {
      if (decl.value.includes('gradient(')) {
        const fallback = singlePositionStops(decl.value)
        const rule = decl.parent
        const inKeyframes = rule.parent && rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name)
        if (fallback && rule.type === 'rule' && !inKeyframes) {
          if (!fallbackRules.has(rule)) {
            const block = new AtRule({ name: 'supports', params: NO_TWO_POSITION_STOPS })
            const copy = rule.clone({ nodes: [] })
            block.append(copy)
            rule.after(block)
            fallbackRules.set(rule, copy)
          }
          fallbackRules.get(rule).append(decl.clone({ value: fallback }))
        } else if (fallback) decl.cloneBefore({ value: fallback })
      }
      physicalSides(decl)
    },
  }
}
module.exports.postcss = true

/** The physical sides of a logical box declaration, written in front of it. */
function physicalSides(decl) {
  const sides = SIDES[decl.prop.toLowerCase()]
  if (!sides) return
  const values = parts(decl.value)
  // More parts than sides is not a valid value; one var() might hold several, which no split can see.
  if (values.length > sides.length) return
  const physical = perSide(sides, values)
  sides.forEach((prop, i) => decl.cloneBefore({ prop, value: physical[i] }))
}
