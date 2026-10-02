import { Link } from 'react-router'
import { Layout } from '../components/Layout'
import { ProductCard } from '../components/ProductCard'
import { products } from '../data/products'
import { useStore } from '../store'

export function Wishlist() {
  const { liked } = useStore()
  return <Layout><main className="page-pad py-10"><p className="eyebrow">Saved for later</p><h1 className="page-title">Your little wish list.</h1>{liked.length ? <div className="product-grid mt-8">{products.filter(p=>liked.includes(p.id)).map(p=><ProductCard product={p} key={p.id}/>)}</div> : <div className="empty-state"><span>♡</span><h2>Your wishlist is waiting.</h2><p>Save the pieces that make your heart skip a beat.</p><Link to="/shop" className="button-primary">Find something lovely →</Link></div>}</main></Layout>
}
