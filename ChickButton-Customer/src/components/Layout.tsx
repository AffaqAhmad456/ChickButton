import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import logo from '../assets/chickbutton-logo.png'
import { useStore } from '../store'
import { Brand } from './Brand'

const Icon = ({ children, className = '' }: { children: ReactNode; className?: string }) => <span className={`inline-flex h-5 w-5 items-center justify-center ${className}`}>{children}</span>

function Header() {
  const { cart } = useStore()
  const [open, setOpen] = useState(false)
  return <>
    <div className="bg-[#123e70] px-4 py-2 text-center text-[11px] font-bold tracking-[.14em] text-white">FREE DELIVERY ON ORDERS OVER PKR 4,000 <span className="ml-4 text-[#ffd34e]">•</span> EASY 7-DAY EXCHANGE</div>
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1380px] items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-7 text-sm font-bold text-slate-700 lg:flex"><Link to="/">Home</Link><Link to="/shop">Shop</Link><Link to="/categories">Categories</Link><Link to="/shop?new=1">New Arrivals</Link><Link className="text-rose-500" to="/shop?sale=1">Sale</Link></nav>
        <div className="flex items-center gap-1 sm:gap-2"><button className="icon-button hidden sm:inline-flex" aria-label="Search">⌕</button><Link className="icon-button hidden sm:inline-flex" to="/wishlist" aria-label="Wishlist">♡</Link><Link className="icon-button hidden sm:inline-flex" to="/account" aria-label="Account">♙</Link><Link className="icon-button relative" to="/cart" aria-label="Cart"><Icon>🛍</Icon>{cart > 0 && <span className="cart-badge">{cart}</span>}</Link>
        <button
  onClick={() => setOpen(!open)}
  className="icon-button lg:hidden"
  aria-label={open ? 'Close menu' : 'Open menu'}
  aria-expanded={open}
  aria-controls="mobile-navigation"
>
  ☰
</button>
        </div>
      </div>
      {open && <nav id="mobile-navigation" className="border-t border-slate-100 bg-white px-5 py-4 lg:hidden"><div className="grid grid-cols-2 gap-3 text-sm font-bold"><Link to="/shop">Shop all</Link><Link to="/categories">Categories</Link><Link to="/shop?new=1">New arrivals</Link><Link to="/shop?sale=1" className="text-rose-500">Sale</Link></div></nav>}
    </header>
  </>
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  const routes: Record<string, string> = {
    'New Arrivals': '/shop?new=1',
    Categories: '/categories',
    Sale: '/shop?sale=1',
    'Shop All': '/shop',
  }
  return <div><h3 className="mb-4 text-sm font-extrabold text-[#ffd34e]">{title}</h3><ul className="space-y-3 text-sm text-blue-100">{links.map((link) => <li key={link}>{routes[link] ? <Link to={routes[link]}>{link}</Link> : <a href="#">{link}</a>}</li>)}</ul></div>
}

function Footer() {
  return <footer className="mt-20 bg-[#0e315b] px-5 pb-8 pt-16 text-white"><div className="mx-auto grid max-w-[1280px] gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]"><div><div className="flex items-center gap-2"><img src={logo} className="h-12 w-16 rounded-xl object-cover mix-blend-screen" alt="ChickButton" /><strong className="text-xl">ChickButton</strong></div><p className="mt-5 max-w-xs text-sm leading-6 text-blue-100">Thoughtfully chosen clothes for every little chapter. Made for motion, magic, and muddy knees.</p><div className="mt-6 flex gap-3 text-lg"><span>◎</span><span>◉</span><span>◌</span></div></div><FooterColumn title="Shop" links={['New Arrivals', 'Categories', 'Sale', 'Shop All']} /><FooterColumn title="Help" links={['Size Guide', 'Shipping', 'Returns', 'Contact']} /><FooterColumn title="Company" links={['Our Story', 'Privacy Policy', 'Terms & Conditions', 'Careers']} /></div><div className="mx-auto mt-14 flex max-w-[1280px] flex-wrap justify-between gap-3 border-t border-white/15 pt-6 text-xs text-blue-200"><span>© 2026 ChickButton. Little styles, big smiles.</span><span>Made with care in Pakistan</span></div></footer>
}

export function Layout({ children }: { children: ReactNode }) {
  const { toast } = useStore()
  return <><Header />{children}<Footer />{toast && <div className="toast">✓ &nbsp;{toast}</div>}</>
}
