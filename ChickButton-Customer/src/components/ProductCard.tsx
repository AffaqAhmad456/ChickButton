import { Link } from 'react-router'
import type { Product } from '../types/product'
import { useStore } from '../store'
import { money } from '../utils/money'

export function ProductCard({ product }: { product: Product }) {
  const { add, liked, toggleLike } = useStore()
  const isLiked=liked.includes(product.id)

  return (
    <article className="product-card group">
      <div className="product-photo">
        <Link
  to={`/product/${product.id}`}
  className="absolute inset-0 z-[1]"
  aria-label={`View ${product.name}`}
>
          <img
            src={product.image}
            alt={product.name}
            className="primary-img"
          />
          <img
            src={product.image2}
            alt=""
            className="secondary-img"
          />
        </Link>

        {product.badge && (
          <span className={`badge ${product.badge === 'SALE' ? 'sale' : ''}`}>
            {product.badge}
          </span>
        )}

        <button
  onClick={() => toggleLike(product.id)}
  className={`heart ${isLiked ? 'liked' : ''}`}
  aria-pressed={isLiked}
  aria-label={
    isLiked
      ? `Remove ${product.name} from wishlist`
      : `Add ${product.name} to wishlist`
  }
>
  {isLiked ? '♥' : '♡'}
</button>

        <button
          onClick={() => add(product)}
          className="quick-add"
        >
          Quick add <span>+</span>
        </button>
      </div>

      <div className="pt-4">
        <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-400">
          Ages 3–8
        </p>

        <h3 className="mt-1 text-[15px] font-extrabold text-[#163d69]">
          <Link to={`/product/${product.id}`}>
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <strong className="text-[15px] text-[#163d69]">
            {money(product.price)}
          </strong>

          {product.old && (
            <span className="text-sm text-slate-400 line-through">
              {money(product.old)}
            </span>
          )}
        </div>

        <span
          className="mt-3 block h-3 w-3 rounded-full ring-2 ring-white shadow"
          style={{ backgroundColor: product.color }}
        />
      </div>
    </article>
  )
}