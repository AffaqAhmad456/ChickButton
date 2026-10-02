import { Layout } from '../components/Layout'
import { Field } from '../components/Field'
import { OrderSummary } from '../components/OrderSummary'

export function Checkout() {
  return (
    <Layout>
      <main className="page-pad py-10">
        <p className="crumb">Cart / Checkout</p>
        <h1 className="page-title">One step closer.</h1>
        <div className="checkout-layout mt-8">
          <form onSubmit={(e) => e.preventDefault()} className="checkout-form">
            <h2>Contact information</h2>
            <div className="form-grid">
              <Field label="Full name" placeholder="Your full name" />
              <Field label="Phone number" placeholder="03XX XXXXXXX" />
            </div>
            <h2 className="mt-8">Shipping address</h2>
            <Field label="Address" placeholder="House / street / landmark" />
            <div className="form-grid">
              <Field label="Area" placeholder="Your area" />
              <Field label="City" placeholder="Your city" />
              <Field label="Province" placeholder="Punjab" />
              <Field label="Postal code" placeholder="Optional" />
            </div>
            <div className="mt-6 rounded-2xl bg-[#fff8dc] p-4 text-sm text-[#735b14]">
              Your order is confirmed when placed. Payment is collected on delivery.
            </div>
            <button className="button-primary mt-6 w-full">Place order →</button>
          </form>
          <OrderSummary />
        </div>
      </main>
    </Layout>
  )
}
