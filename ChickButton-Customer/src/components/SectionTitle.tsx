import type { ReactNode } from 'react'

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="mb-8 flex items-end justify-between gap-4"><div><p className="eyebrow">{eyebrow}</p><h2 className="section-title">{title}</h2></div>{action}</div>
}
