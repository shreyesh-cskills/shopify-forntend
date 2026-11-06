import { useEffect, useState } from 'react'
import { formatMoney, productsApi } from '../api/client.js'

const EMPTY = { name: '', sku: '', description: '', price: '', stock: '0' }

function validate(f) {
  const e = {}
  if (!f.name.trim()) e.name = 'Name is required.'
  if (!f.sku.trim()) e.sku = 'SKU is required.'
  if (f.price === '' || Number(f.price) < 0 || !/^\d+(\.\d{1,2})?$/.test(f.price))
    e.price = 'Enter a price like 19.99.'
  if (!/^\d+$/.test(f.stock)) e.stock = 'Stock must be a whole number.'
  return e
}

export default function ProductsPage() {
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
      setProducts(await productsApi.list())
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

  function handleChange(e) {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }))
  }

  function startEdit(p) {
    setEditingId(p.id)
    setForm({
      name: p.name,
      sku: p.sku,
      description: p.description ?? '',
      price: String(p.price),
      stock: String(p.stock),
    })
    setErrors({})
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function reset() {
    setEditingId(null)
    setForm(EMPTY)
    setErrors({})
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return

    const body = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      stock: Number(form.stock),
    }
    setSaving(true)
    try {
      if (editingId) await productsApi.update(editingId, body)
      else await productsApi.create(body)
      setNotice(editingId ? 'Product updated.' : 'Product created.')
      setApiError('')
      reset()
      await load()
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Delete “${p.name}”?`)) return
    try {
      await productsApi.remove(p.id)
      if (editingId === p.id) reset()
      setNotice('Product deleted.')
      setApiError('')
      await load()
    } catch (err) {
      setApiError(err.message)
    }
  }

  const field = (name, label, props = {}) => (
    <div className={`field${props.full ? ' full' : ''}`}>
      <label htmlFor={`p-${name}`}>{label}</label>
      <input
        id={`p-${name}`}
        name={name}
        value={form[name]}
        onChange={handleChange}
        aria-invalid={!!errors[name]}
        {...props.input}
      />
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  )

  return (
    <>
      <form className="card" onSubmit={handleSubmit} noValidate>
        <h1>{editingId ? `Edit product #${editingId}` : 'Add product'}</h1>
        {notice && <div className="alert-success">{notice}</div>}
        {apiError && <div className="alert-error">{apiError}</div>}

        <div className="grid">
          {field('name', 'Name *')}
          {field('sku', 'SKU *')}
          {field('price', 'Price *', { input: { inputMode: 'decimal', placeholder: '0.00' } })}
          {field('stock', 'Stock *', { input: { inputMode: 'numeric' } })}
          <div className="field full">
            <label htmlFor="p-description">Description</label>
            <textarea
              id="p-description"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="actions">
          {editingId && (
            <button type="button" className="secondary" onClick={reset}>
              Cancel
            </button>
          )}
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </form>

      <section className="card list">
        <h2>Products ({products.length})</h2>
        {loading ? (
          <p className="hint">Loading…</p>
        ) : products.length === 0 ? (
          <p className="hint">No products yet. Add one above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th className="num">Price</th>
                  <th className="num">Stock</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.name}
                      {p.description && (
                        <>
                          <br />
                          <small>{p.description}</small>
                        </>
                      )}
                    </td>
                    <td>{p.sku}</td>
                    <td className="num">{formatMoney(p.price)}</td>
                    <td className="num">{p.stock}</td>
                    <td className="row-actions">
                      <button type="button" className="secondary small" onClick={() => startEdit(p)}>
                        Edit
                      </button>
                      <button type="button" className="danger small" onClick={() => handleDelete(p)}>
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
