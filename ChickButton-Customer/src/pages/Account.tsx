import { Link } from 'react-router'
import { Layout } from '../components/Layout'

export function Account() {
  const links = [{ label: 'Overview', to: '/account' }, { label: 'My orders' }, { label: 'Wishlist', to: '/wishlist' }, { label: 'Profile' }, { label: 'Addresses' }]
  return <Layout><main className="page-pad py-10"><div className="account-layout"><aside className="account-nav"><strong>Hello, Ayesha</strong>{links.map(({ label, to }, i) => to ? <Link className={i===0?'active':''} key={label} to={to}>{label}</Link> : <a key={label} href="#">{label}</a>)}<a href="#">Log out</a></aside><section><p className="eyebrow">Your account</p><h1 className="page-title">Good to see you.</h1><div className="stat-grid mt-8">{[['02','Active orders'],['07','Wishlist items'],['14','Happy deliveries']].map(([n,l])=><div className="stat" key={l}><strong>{n}</strong><span>{l}</span></div>)}</div><h2 className="mt-10 text-2xl font-black text-[#123e70]">Recent orders</h2><div className="order-row"><span>#CB-20718</span><span>12 Sep 2026</span><b>PKR 8,400</b><em>Processing</em></div></section></div></main></Layout>
}
