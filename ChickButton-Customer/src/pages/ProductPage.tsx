import { useState } from 'react'
import { useParams } from 'react-router'
import { Layout } from '../components/Layout'
import { ProductCard } from '../components/ProductCard'
import { SectionTitle } from '../components/SectionTitle'
import { products } from '../data/products'
import { useStore } from '../store'
import { money } from '../utils/money'

export function ProductPage() {
  const { id } = useParams()
  const p = products.find((product) => product.id === Number(id)) ?? products[0]
  const { add } = useStore()
  const [size, setSize] = useState('4–5Y')
  const [qty, setQty] = useState(1)
  return <Layout><main className="page-pad py-8"><p className="crumb">Home / Dresses / {p.name}</p><div className="product-detail"><div className="gallery"><div className="thumbs"><img src={p.image} alt=""/><img src={p.image2} alt=""/></div><img className="main-product" src={p.image} alt={p.name}/></div><section><p className="eyebrow">Party wear · Ages 3–8</p><h1 className="page-title mt-2">{p.name}</h1><div className="mt-4 flex items-center gap-3"><strong className="text-2xl text-[#123e70]">{money(p.price)}</strong>{p.old !== undefined && <><span className="text-slate-400 line-through">{money(p.old)}</span><span className="badge sale">14% off</span></>}</div><p className="mt-6 leading-7 text-slate-600">A twirl-ready cotton dress with hand-finished embroidery and a soft, easy fit. The kind she reaches for before you can say “special occasion”.</p><div className="choice"><span>Colour — <b>Rose Garden</b></span><div className="mt-3 flex gap-2"><i className="swatch bg-rose-300 ring-2 ring-[#123e70]"/><i className="swatch bg-sky-200"/></div></div><div className="choice"><div className="flex justify-between"><span>Size</span><a href="#" className="text-link">Size guide</a></div><div className="mt-3 flex flex-wrap gap-2">{['2–3Y','3–4Y','4–5Y','5–6Y','6–7Y'].map((s) => <button onClick={() => setSize(s)} className={`size-button ${size === s ? 'selected' : ''}`} key={s}>{s}</button>)}</div></div><div className="mt-7 flex gap-3"><div className="quantity"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><b>{qty}</b><button onClick={() => setQty(qty + 1)}>+</button></div><button onClick={() => add(p)} className="button-primary flex-1">Add to cart · {money(p.price * qty)}</button><button className="icon-button border border-slate-200">♡</button></div><button className="mt-3 w-full rounded-full border border-[#123e70] py-3.5 text-sm font-extrabold text-[#123e70]">Buy now</button><div className="mt-7 divide-y divide-slate-200 border-y border-slate-200">{['Details & materials','Care instructions','Delivery & returns'].map((x) => <details key={x}><summary className="py-4 font-bold">{x}<span>+</span></summary></details>)}</div></section></div><div className="mt-24"><SectionTitle eyebrow="You may also like" title="More to love"/><div className="product-grid">{products.slice(1).map((product) => <ProductCard key={product.id} product={product}/>)}</div></div></main></Layout>
}
