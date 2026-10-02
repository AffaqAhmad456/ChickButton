import { Link } from 'react-router'
import logo from '../assets/chickbutton-logo.png'

export function Brand() {
  return <Link to="/" className="flex items-center gap-2.5" aria-label="ChickButton home"><img src={logo} className="h-12 w-16 rounded-xl object-cover object-center mix-blend-multiply" alt="ChickButton" /><span className="hidden text-xl font-black tracking-tight text-[#123e70] sm:block">Chick<span className="text-[#eaa913]">Button</span></span></Link>
}
