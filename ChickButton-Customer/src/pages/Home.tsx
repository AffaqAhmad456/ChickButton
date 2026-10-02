  import {useState} from 'react'
  import { Link } from 'react-router'
  import { Collection } from '../components/Collection'
  import { Layout } from '../components/Layout'
  import { ProductCard } from '../components/ProductCard'
  import { SectionTitle } from '../components/SectionTitle'
  import { products } from '../data/products'

  export function Home() {
    const [newsletterSubmitted, setNewsletterSubmitted] = useState(false)
    return <Layout><main>
      <section className="hero-grid overflow-hidden bg-[#e7f3f8]"><div className="relative z-10 flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-16 xl:pl-[max(6vw,5rem)]"><p className="eyebrow">Made for little moments</p><h1 className="hero-title">Little styles.<br/><em>Big smiles.</em></h1><p className="mt-6 max-w-md text-base leading-7 text-slate-600">Beautifully comfortable pieces for childhood's brightest days — designed to play, twirl and grow with them.</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/shop?new=1" className="button-primary">Shop new arrivals <span>→</span></Link><Link to="/categories" className="button-secondary">Explore collections</Link></div><div className="mt-12 flex gap-7 text-sm"><div><strong className="block text-lg text-[#123e70]">4.9/5</strong><span className="text-slate-500">Loved by parents</span></div><div className="border-l border-[#b7d7e6] pl-7"><strong className="block text-lg text-[#123e70]">7 days</strong><span className="text-slate-500">Easy exchanges</span></div></div></div><div className="hero-image relative min-h-[420px] overflow-hidden"><img src="https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=1300&q=88" alt="Child in a sunny yellow outfit"/><span className="float-sticker top-[15%] left-[10%]">✦</span><span className="float-sticker bottom-[16%] right-[14%] bg-[#f6bd31] text-[#123e70]">♥</span><div className="hero-label"><span>New season</span><strong>Spring / Summer ’26</strong></div></div></section>
      <section className="page-pad pt-20"><SectionTitle eyebrow="Dress the occasion" title="Made for their big little days" action={<Link className="text-link" to="/categories">All collections →</Link>}/><div className="collection-grid">
        <Collection
    title="Formal Wear"
    subtitle="Small looks, big entrances"
    img="https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=800&q=85"
    to="/shop"
  />

  <Collection
    title="Party Wear"
    subtitle="Ready for the confetti"
    img="https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=800&q=85"
    to="/shop"
  />

  <Collection
    title="Casual Wear"
    subtitle="For every adventure"
    img="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=85"
    to="/shop"
  />
        </div></section>
      <section className="page-pad pt-24"><SectionTitle eyebrow="Just landed" title="Fresh favourites" action={<Link className="text-link" to="/shop?new=1">View all new arrivals →</Link>}/><div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id} />)}</div></section>
      <section className="page-pad pt-24"><div className="age-strip"><div><p className="eyebrow text-[#f8cc43]">Shop by age</p><h2 className="text-4xl font-black tracking-tight text-white">The perfect fit<br/>for right now.</h2></div><div className="age-links">{['0–2 Years', '3–5 Years', '6–8 Years', '9–12 Years'].map((age) => <Link to="/shop" key={age}>{age}<span>↗</span></Link>)}</div></div></section>
      <section className="page-pad pt-24"><div className="sale-banner"><div className="relative z-10 max-w-lg"><p className="eyebrow text-[#ffd34e]">The sunny edit</p><h2 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">Up to 30% off<br/>selected styles.</h2><p className="mt-5 text-blue-100">A little extra joy for the everyday wardrobe.</p><Link to="/shop?sale=1" className="mt-8 inline-flex rounded-full bg-[#ffd34e] px-6 py-3 text-sm font-extrabold text-[#123e70]">Shop the sale →</Link></div><img src="https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=1000&q=85" alt="Happy child wearing colourful clothing"/></div></section>
      <section className="page-pad pt-24"><SectionTitle eyebrow="Why ChickButton" title="Thoughtful from thread to doorstep"/><div className="benefit-grid">{[['✦','Premium quality','Pieces made to be passed down.'],['☁','Comfort first','Soft fabrics for busy little bodies.'],['⌁','Easy ordering','Simple shopping, happy days.'],['♡','Carefully chosen','A small edit of the very best.']].map(([icon,title,copy]) => <div className="benefit" key={title}><span>{icon}</span><h3>{title}</h3><p>{copy}</p></div>)}</div></section>
      <section className="page-pad pt-24"><div className="testimonial"><span className="quote-mark">“</span><div><div className="text-[#e8a90c]">★★★★★</div><blockquote>Every piece feels special, but they're actually comfortable enough for a full day of being five.</blockquote><p><strong>Hania K.</strong> <span>— Mum of two, Lahore</span></p></div><img src="https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?auto=format&fit=crop&w=300&q=80" alt="Parent smiling"/></div></section>
      <section className="page-pad pt-24"><div className="newsletter"><div><p className="eyebrow text-[#e3a40a]">A little note from us</p><h2 className="section-title">Good things are<br/>on their way.</h2></div>
      <form
  onSubmit={(e) => {
    e.preventDefault()

    if (!e.currentTarget.reportValidity()) {
      return
    }

    setNewsletterSubmitted(true)
    e.currentTarget.reset()
  }}
  className="subscribe"
>
  <input
    type="email"
    placeholder="Your email address"
    aria-label="Email address"
    required
    onChange={() => setNewsletterSubmitted(false)}
  />

  <button type="submit" className="button-primary">
    {newsletterSubmitted ? 'Thanks! ✓' : 'Keep me posted →'}
  </button>

  <span className="sr-only" role="status" aria-live="polite">
    {newsletterSubmitted ? 'Newsletter signup received.' : ''}
  </span>
</form>
      </div></section>
    </main></Layout>
  }
