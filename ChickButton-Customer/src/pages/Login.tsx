import { Link } from 'react-router'
import { Brand } from '../components/Brand'
import { Field } from '../components/Field'

export function Login() {
  return <main className="min-h-screen bg-[#e7f3f8] p-5"><div className="auth-card"><Brand /><p className="eyebrow mt-10">Welcome back</p><h1 className="page-title">Hello again.</h1><form className="mt-7 space-y-4"><Field label="Email or phone" placeholder="you@email.com"/><Field label="Password" placeholder="••••••••"/><div className="flex justify-between text-sm"><label><input type="checkbox"/> Remember me</label><a className="text-link" href="#">Forgot password?</a></div><Link to="/account" className="button-primary w-full">Log in →</Link><p className="text-center text-sm text-slate-500">New here? <a className="font-bold text-[#123e70]" href="#">Create an account</a></p></form></div></main>
}
