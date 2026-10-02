import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Product } from './types/product'

type Store = {
  cart: number
  add: (product?: Product) => void
  liked: number[]
  toggleLike: (id: number) => void
  toast: string
}

const StoreContext = createContext<Store | null>(null)

export const useStore = () => {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used within StoreProvider')
  return store
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState(2)
  const [liked, setLiked] = useState<number[]>([])
  const [toast, setToast] = useState('')
  const add = (product?: Product) => {
    setCart((n) => n + 1)
    setToast(`${product?.name ?? 'Item'} added to your cart`)
    window.setTimeout(() => setToast(''), 2600)
  }
  const toggleLike = (id: number) => setLiked((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  return <StoreContext.Provider value={{ cart, add, liked, toggleLike, toast }}>{children}</StoreContext.Provider>
}
