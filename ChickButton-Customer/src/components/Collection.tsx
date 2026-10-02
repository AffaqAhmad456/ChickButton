import { Link } from 'react-router'

export function Collection({
  title,
  subtitle,
  img,
  to,
}: {
  title: string
  subtitle: string
  img: string
  to: string
}) {
  return (
    <Link to={to} className="collection-card">
      <img src={img} alt={title} />
      <div>
        <p>{subtitle}</p>
        <h3>
          {title} <span>→</span>
        </h3>
      </div>
    </Link>
  )
}