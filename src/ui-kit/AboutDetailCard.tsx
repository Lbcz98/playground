import { RestingBorder, textClass, token, vars } from '@/primitives'
import './ui-kit.css'

export type ContentRating = 'L' | '6' | '10' | '12' | '14' | '16' | '18'

/** The tag's fill for each rating, as the age-rating colours of the Brazilian classification. */
const RATING_FILL = {
  L: '--color-semantic-functional-rating-free',
  '6': '--color-semantic-functional-rating-6',
  '10': '--color-semantic-functional-rating-10',
  '12': '--color-semantic-functional-rating-12',
  '14': '--color-semantic-functional-rating-14',
  '16': '--color-semantic-functional-rating-16',
  '18': '--color-semantic-functional-rating-18',
} as const satisfies Record<ContentRating, string>

interface AboutDetailCardProps {
  logo: { src: string; alt: string }
  title: string
  description: string
  rating: ContentRating
  year?: string
  category?: string
  genres?: readonly string[]
  country?: string
}

export function AboutDetailCard({
  logo,
  title,
  description,
  rating,
  year,
  category,
  genres = [],
  country,
}: AboutDetailCardProps) {
  const metadata = [year, category, genres.length > 0 ? genres.join(', ') : undefined, country].filter(
    (value): value is string => Boolean(value),
  )

  return (
    <article className="sfs-about-detail-card">
      <RestingBorder shape="content-card" width="card" />
      <header className="sfs-about-detail-card-header">
        <span className="sfs-about-detail-card-logo-frame">
          <img className="sfs-about-detail-card-logo" src={logo.src} alt={logo.alt} />
        </span>
        <h2 className={`${textClass('heading-5-bold')} sfs-about-detail-card-title`}>{title}</h2>
      </header>
      <p className={`${textClass('body-md-medium')} sfs-about-detail-card-description`}>{description}</p>
      <div className="sfs-about-detail-card-details">
        <span
          className={`${textClass('body-sm-bold')} sfs-about-detail-card-rating`}
          data-rating={rating}
          style={vars({ '--_rating-background': token(RATING_FILL[rating]) })}
        >
          {rating}
        </span>
        {metadata.length > 0 ? (
          <ul className={`${textClass('body-sm-medium')} sfs-about-detail-card-metadata`} aria-label="Detalhes do programa">
            {metadata.map((value) => (
              <li key={value}>{value}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  )
}
