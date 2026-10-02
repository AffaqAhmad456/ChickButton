import { useState } from 'react'
import { Layout } from '../components/Layout'
import { OrderSummary } from '../components/OrderSummary'
import { products } from '../data/products'
import { useStore } from '../store'
import { money } from '../utils/money'

export function Cart() {
  const { cart, add } = useStore()
  const [quantity, setQuantity] = useState(cart)
  return <Layout><main className="page-pad py-10"><p className="eyebrow">Your bag</p><h1 className="page-title">Ready when you are.</h1><div className="cart-layout mt-8"><section className="space-y-4"><div className="cart-item"><img src={products[0].image} alt="Sunday Garden Dress"/><div className="flex-1"><h3>Sunday Garden Dress</h3><p>Rose Garden · 4–5Y</p><strong>{money(products[0].price)}</strong></div><div className="quantity"><button onClick={() => setQuantity(Math.max(1,quantity-1))}>−</button><b>{quantity}</b><button onClick={() => setQuantity(quantity+1)}>+</button></div><button aria-label="Remove" className="text-slate-400">×</button></div><div className="cart-item"><img src={products[1].image} alt="Cloud Pocket Set"/><div className="flex-1"><h3>Cloud Pocket Set</h3><p>Sky Blue · 3–4Y</p><strong>{money(products[1].price)}</strong></div><div className="quantity"><button>−</button><b>1</b><button onClick={() => add(products[1])}>+</button></div><button aria-label="Remove" className="text-slate-400">×</button></div></section><OrderSummary /></div></main></Layout>
}
