import { Link } from 'react-router'

export function OrderSummary() {
  return <aside className="summary"><h2>Order summary</h2><div><span>Subtotal</span><strong>PKR 8,400</strong></div><div><span>Delivery</span><span>Calculated at checkout</span></div><div className="total"><span>Total</span><strong>PKR 8,400</strong></div><Link to="/checkout" className="button-primary mt-6 w-full">Proceed to checkout →</Link><p>Secure checkout · Manual order confirmation</p></aside>
}
