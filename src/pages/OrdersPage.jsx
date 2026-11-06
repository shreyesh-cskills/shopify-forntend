import { useEffect, useState } from 'react'
import { formatMoney, ordersApi, ORDER_STATUSES, productsApi } from '../api/client.js'

const newLine = () => ({ key: crypto.randomUUID(), productId: '', quantity: '1' })
const EMPTY = () => ({ customerName: '', customerEmail: '', status: 'pending', items: [newLine()] })

function validate(f) {
  const e = {}
  if (!f.customerName.trim()) e.customerName = 'Customer name is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.customerEmail)) e.customerEmail = 'Enter a valid email.'
  if (f.items.some((i) => !i.productId)) e.items = 'Choose a product for every line.'
  else if (f.items.some((i) => !/^[1-9]\d*$/.test(i.quantity)))
    e.items = 'Quantities must be whole numbers of 1 or more.'
  return e
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const [o, p] = await Promise.all([ordersApi.list(), productsApi.list()])
      setOrders(o)
      setProducts(p)
      setApiError('')
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const productById = new Map(products.map((p) => [p.id, p]))
  const editingOrder = orders.find((o) => o.id === editingId)
  // Price shown for a line: captured price if editing an existing line, else current price.
  const linePrice = (line) => {
    const id = Number(line.productId)
    const existing = editingOrder?.items.find((i) => i.productId === id)
    return existing ? existing.unitPrice : (productById.get(id)?.price ?? 0)
  }
  const estimatedTotal = form.items.reduce((t, l) => t + linePrice(l) * (Number(l.quantity) || 0), 0)

  function setField(name, value) {
    setForm((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }))
  }

  function setLine(key, patch) {
    setForm((p) => ({ ...p, items: p.items.map((l) => (l.key === key ? { ...l, ...patch } : l)) }))
    if (errors.items) setErrors((p) => ({ ...p, items: undefined }))
  }

  function startEdit(o) {
    setEditingId(o.id)
    setForm({
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      status: o.status,
      items: o.items.map((i) => ({
        key: crypto.randomUUID(),
        productId: String(i.productId),
        quantity: String(i.quantity),
      })),
    })
    setErrors({})
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function reset() {
    setEditingId(null)
    setForm(EMPTY())
    setErrors({})
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return

    const body = {
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim(),
      status: form.status,
      items: form.items.map((l) => ({ productId: Number(l.productId), quantity: Number(l.quantity) })),
    }
    setSaving(true)
    try {
      if (editingId) await ordersApi.update(editingId, body)
      else await ordersApi.create(body)
      setNotice(editingId ? 'Order updated.' : 'Order created.')
      setApiError('')
      reset()
      await load()
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(o) {
    if (!window.confirm(`Delete order #${o.id}? Reserved stock will be returned.`)) return
    try {
      await ordersApi.remove(o.id)
      if (editingId === o.id) reset()
      setNotice('Order deleted.')
      setApiError('')
      await load()
    } catch (err) {
      setApiError(err.message)
    }
  }

  async function changeStatus(o, status) {
    try {
      await ordersApi.update(o.id, { status })
      setApiError('')
      await load()
    } catch (err) {
      setApiError(err.message)
    }
  }

  return (
    <>
      <form className="card" onSubmit={handleSubmit} noValidate>
        <h1>{editingId ? `Edit order #${editingId}` : 'Create order'}</h1>
        {notice && <div className="alert-success">{notice}</div>}
        {apiError && <div className="alert-error">{apiError}</div>}

        <fieldset>
          <legend>Customer</legend>
          <div className="grid">
            <div className="field">
              <label htmlFor="o-name">Name *</label>
              <input
                id="o-name"
                value={form.customerName}
                onChange={(e) => setField('customerName', e.target.value)}
                aria-invalid={!!errors.customerName}
              />
              {errors.customerName && <p className="field-error">{errors.customerName}</p>}
            </div>
            <div className="field">
              <label htmlFor="o-email">Email *</label>
              <input
                id="o-email"
                type="email"
                value={form.customerEmail}
                onChange={(e) => setField('customerEmail', e.target.value)}
                aria-invalid={!!errors.customerEmail}
              />
              {errors.customerEmail && <p className="field-error">{errors.customerEmail}</p>}
            </div>
            <div className="field">
              <label htmlFor="o-status">Status</label>
              <select id="o-status" value={form.status} onChange={(e) => setField('status', e.target.value)}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Items</legend>
          {products.length === 0 && !loading && (
            <p className="hint">Add some products first on the Products page.</p>
          )}
          {form.items.map((line, idx) => {
            const product = productById.get(Number(line.productId))
            return (
              <div className="line" key={line.key}>
                <select
                  aria-label={`Product for line ${idx + 1}`}
                  value={line.productId}
                  onChange={(e) => setLine(line.key, { productId: e.target.value })}
                >
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — {formatMoney(p.price)} · {p.stock} in stock
                    </option>
                  ))}
                </select>
                <input
                  aria-label={`Quantity for line ${idx + 1}`}
                  className="qty"
                  inputMode="numeric"
                  value={line.quantity}
                  onChange={(e) => setLine(line.key, { quantity: e.target.value })}
                />
                <span className="line-total">
                  {product ? formatMoney(linePrice(line) * (Number(line.quantity) || 0)) : '—'}
                </span>
                <button
                  type="button"
                  className="secondary small"
                  disabled={form.items.length === 1}
                  onClick={() => setForm((p) => ({ ...p, items: p.items.filter((l) => l.key !== line.key) }))}
                  aria-label={`Remove line ${idx + 1}`}
                >
                  ✕
                </button>
              </div>
            )
          })}
          {errors.items && <p className="field-error">{errors.items}</p>}
          <div className="line-footer">
            <button
              type="button"
              className="secondary small"
              onClick={() => setForm((p) => ({ ...p, items: [...p.items, newLine()] }))}
            >
              + Add line
            </button>
            <strong>Total: {formatMoney(estimatedTotal)}</strong>
          </div>
        </fieldset>

        <div className="actions">
          {editingId && (
            <button type="button" className="secondary" onClick={reset}>
              Cancel
            </button>
          )}
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create order'}
          </button>
        </div>
      </form>

      <section className="card list">
        <h2>Orders ({orders.length})</h2>
        {loading ? (
          <p className="hint">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="hint">No orders yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th className="num">Total</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      {o.id}
                      <br />
                      <small>{new Date(o.createdAt).toLocaleDateString()}</small>
                    </td>
                    <td>
                      {o.customerName}
                      <br />
                      <small>{o.customerEmail}</small>
                    </td>
                    <td>
                      {o.items.map((i) => (
                        <div key={i.id}>
                          {i.quantity} × {i.product?.name ?? `#${i.productId}`}
                        </div>
                      ))}
                    </td>
                    <td className="num">{formatMoney(o.total)}</td>
                    <td>
                      <select
                        aria-label={`Status of order ${o.id}`}
                        className={`status status-${o.status}`}
                        value={o.status}
                        onChange={(e) => changeStatus(o, e.target.value)}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="row-actions">
                      <button type="button" className="secondary small" onClick={() => startEdit(o)}>
                        Edit
                      </button>
                      <button type="button" className="danger small" onClick={() => handleDelete(o)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
