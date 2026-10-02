import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Layout } from '../components/Layout'
import { ProductCard } from '../components/ProductCard'
import { products } from '../data/products'

type SortOption = 'featured' | 'price-low'

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sort, setSort] = useState<SortOption>('featured')

  const filter =
    searchParams.get('sale') === '1'
      ? 'Sale'
      : searchParams.get('new') === '1'
        ? 'New'
        : 'All'

  const setFilter = (nextFilter: 'All' | 'New' | 'Sale') => {
    setSearchParams(
      nextFilter === 'All'
        ? {}
        : { [nextFilter.toLowerCase()]: '1' }
    )
  }

  const filteredProducts =
    filter === 'All'
      ? products
      : products.filter((product) =>
          filter === 'Sale'
            ? !!product.old
            : product.badge === filter.toUpperCase()
        )

  const shown =
    sort === 'price-low'
      ? [...filteredProducts].sort((a, b) => a.price - b.price)
      : filteredProducts

  return (
    <Layout>
      <main className="page-pad py-10">
        <p className="crumb">Home / Shop</p>

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title">The everyday edit</h1>

            <p className="mt-2 text-slate-500">
              {shown.length} {shown.length === 1 ? 'piece' : 'pieces'} made for motion and magic.
            </p>
          </div>

          <select
            className="select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            aria-label="Sort Products"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-low">Price: Low to high</option>
            <option value="newest" disabled>
              Newest first
            </option>
          </select>
        </div>

        <div className="shop-layout">
          <aside className="filter-panel">
            <strong>Filter by</strong>

            {['Category', 'Age', 'Size', 'Colour', 'Price', 'Availability'].map(
              (f) => (
                <details key={f} open={f === 'Category'}>
                  <summary>
                    {f}
                    <span>⌄</span>
                  </summary>

                  {f === 'Category' && (
                    <div className="filter-list">
                      {[
                        'Formal Wear',
                        'Party Wear',
                        'Casual Wear',
                        'Traditional Wear',
                        'Sleepwear',
                        'New Arrivals',
                      ].map((x) => (
                        <label key={x}>
                          <input type="checkbox" /> {x}
                        </label>
                      ))}
                    </div>
                  )}

                  {f === 'Colour' && (
                    <div className="flex gap-2 py-4">
                      <i className="swatch bg-rose-300" />
                      <i className="swatch bg-sky-300" />
                      <i className="swatch bg-yellow-300" />
                      <i className="swatch bg-emerald-300" />
                    </div>
                  )}
                </details>
              )
            )}
          </aside>

          <section>
            <div className="mb-6 flex gap-2">
              <button
                onClick={() => setFilter('All')}
                className={`chip ${filter === 'All' ? 'active' : ''}`}
                aria-pressed={filter==='All'}
              >
                All styles
              </button>

              <button
                onClick={() => setFilter('New')}
                className={`chip ${filter === 'New' ? 'active' : ''}`}
                aria-pressed={filter==='New'}
              >
                New in
              </button>

              <button
                onClick={() => setFilter('Sale')}
                className={`chip ${filter === 'Sale' ? 'active' : ''}`}
                aria-pressed = {filter==='Sale'}
              >
                On sale
              </button>
            </div>

            {shown.length > 0 ? (
              <div className="product-grid">
                {shown.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h2>No styles found</h2>
                <p>Try another filter to see more products.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </Layout>
  )
}