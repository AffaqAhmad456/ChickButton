import { Collection } from '../components/Collection'
import { Layout } from '../components/Layout'

export function Categories() {
  return (
    <Layout>
      <main className="page-pad py-10">
        <p className="eyebrow">Find their thing</p>

        <h1 className="page-title">
          Shop all the ways<br />they play.
        </h1>
        <h2 className="sr-only">Shop by category</h2>

        <div className="category-page-grid mt-10">
          {[
            [
              'Formal Wear',
              'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=85',
              '/shop',
            ],
            [
              'Party Wear',
              'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=900&q=85',
              '/shop',
            ],
            [
              'Casual Wear',
              'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=85',
              '/shop',
            ],
            [
              'Traditional Wear',
              'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=900&q=85',
              '/shop',
            ],
            [
              'Sleepwear',
              'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=900&q=85',
              '/shop',
            ],
            [
              'Little Wonders Toys',
              'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=900&q=85',
              '/shop',
            ],
            [
              'New Arrivals',
              'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=900&q=85',
              '/shop?new=1',
            ],
          ].map(([title, img, to]) => (
            <Collection
              key={title}
              title={title}
              subtitle="Explore the edit"
              img={img}
              to={to}
            />
          ))}
        </div>
      </main>
    </Layout>
  )
}