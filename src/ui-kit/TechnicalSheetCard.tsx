import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { RestingBorder, textClass } from '@/primitives'
import { allocateLines, defaultLines, type TechnicalSheetField } from './technicalSheetLines'
import './ui-kit.css'

export type TechnicalSheetCategory = 'Série' | 'Filme' | 'Novela' | 'Variedades'
type NamesField = string | readonly string[] | null

interface TechnicalSheetCardProps {
  category: TechnicalSheetCategory
  directorsNames?: NamesField
  artDirectorsNames?: NamesField
  screenwritersNames?: NamesField
  authorsNames?: NamesField
  castNames?: NamesField
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function names(value: NamesField | undefined): string | null {
  if (Array.isArray(value)) {
    const present = value.map((name) => name.trim()).filter(Boolean)
    return present.length > 0 ? present.join(', ') : null
  }
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

const px = (value: string): number => Number.parseFloat(value) || 0

/**
 * Lines per field for the card's current size, or null when the card has no paired card to
 * size against (alone in a row it is only as tall as its own content, so there is no budget).
 *
 * The card stretches to the row, so with its list hidden its height is the paired card's.
 * Each field is then measured unclamped, at the current width.
 */
function measureLines(article: HTMLElement, list: HTMLElement): number[] | null {
  const fields = Array.from(list.children) as HTMLElement[]
  const title = article.querySelector<HTMLElement>('.sfs-technical-sheet-card-title')
  if (!title) return null

  const listDisplay = list.style.display
  list.style.display = 'none'
  const rowHeight = article.clientHeight
  list.style.display = listDisplay

  const card = getComputedStyle(article)
  const available = rowHeight - px(card.paddingTop) - px(card.paddingBottom) - title.offsetHeight - px(card.rowGap)
  const fieldGap = px(getComputedStyle(list).rowGap)

  let lineHeight = 0
  const measures = fields.map((field) => {
    const style = field.style.cssText
    field.style.cssText = 'display:block;overflow:visible;-webkit-line-clamp:unset'
    lineHeight = px(getComputedStyle(field).lineHeight)
    const need = lineHeight > 0 ? field.scrollHeight / lineHeight : 1
    field.style.cssText = style
    return { label: field.dataset.field as TechnicalSheetField, need }
  })
  if (lineHeight <= 0 || available < lineHeight) return null

  return allocateLines(measures, (visible) => Math.floor((available - Math.max(0, visible - 1) * fieldGap) / lineHeight))
}

const sameLines = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((n, i) => n === b[i])

export function TechnicalSheetCard({
  category,
  directorsNames,
  artDirectorsNames,
  screenwritersNames,
  authorsNames,
  castNames,
}: TechnicalSheetCardProps) {
  const rows = [
    { label: 'Direção', value: names(directorsNames) },
    { label: 'Direção artística', value: names(artDirectorsNames) },
    { label: 'Elenco', value: names(castNames) },
    { label: 'Roteiro', value: category === 'Série' || category === 'Filme' ? names(screenwritersNames) : null },
    { label: 'Autor', value: category === 'Novela' ? names(authorsNames) : null },
  ].filter((row): row is { label: TechnicalSheetField; value: string } => Boolean(row.value))

  const articleRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLDListElement>(null)
  const [lines, setLines] = useState<number[]>(() => rows.map(({ label }) => defaultLines(label)))
  const content = rows.map(({ label, value }) => `${label}:${value}`).join('\n')

  useIsomorphicLayoutEffect(() => {
    const article = articleRef.current
    const list = listRef.current
    if (!article || !list) return undefined

    const update = () => {
      const next = measureLines(article, list) ?? rows.map(({ label }) => defaultLines(label))
      setLines((current) => (sameLines(current, next) ? current : next))
    }
    update()

    // Runs on the next frame, not inside the observer callback; it only changes anything
    // when the lines change, so it cannot loop.
    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    const parent = article.parentElement
    if (observer) {
      observer.observe(article)
      if (parent) {
        observer.observe(parent)
        Array.from(parent.children).forEach((sibling) => {
          if (sibling !== article) observer.observe(sibling)
        })
      }
    }
    document.fonts?.addEventListener('loadingdone', schedule)
    void document.fonts?.ready.then(schedule)

    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      document.fonts?.removeEventListener('loadingdone', schedule)
    }
    // `content` stands in for `rows`: re-measure whenever a label or a value changes.
  }, [content])

  if (rows.length === 0) {
    return null
  }

  return (
    <article className="sfs-technical-sheet-card" ref={articleRef}>
      <RestingBorder shape="content-card" width="card" />
      <h2 className={`${textClass('body-lg-bold')} sfs-technical-sheet-card-title`}>Ficha Técnica</h2>
      <dl className="sfs-technical-sheet-card-list" ref={listRef}>
        {rows.map(({ label, value }, index) => (
          <div
            className="sfs-technical-sheet-card-row"
            data-field={label}
            data-lines={lines[index] ?? defaultLines(label)}
            key={label}
          >
            <dt className={textClass('body-md-bold')}>{label}:</dt>
            <dd className={textClass('body-md-medium')}>{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
