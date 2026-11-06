import { useState } from 'react'

const WARRANTY_PERIODS = [
  { value: '6', label: '6 months' },
  { value: '12', label: '1 year' },
  { value: '24', label: '2 years' },
  { value: '36', label: '3 years' },
  { value: '60', label: '5 years' },
]

const EMPTY_FORM = {
  customerName: '',
  email: '',
  phone: '',
  productName: '',
  serialNumber: '',
  orderNumber: '',
  purchaseDate: '',
  warrantyPeriod: '12',
  invoice: null,
  notes: '',
}

export function calculateExpiry(purchaseDate, months) {
  if (!purchaseDate) return ''
  const [y, m, d] = purchaseDate.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1 + Number(months), d))
  // Clamp month overflow (e.g. 31 Jan + 1 month -> 28/29 Feb)
  if (date.getUTCDate() !== d) date.setUTCDate(0)
  return date.toISOString().slice(0, 10)
}

function validate(form) {
  const errors = {}
  const today = new Date().toISOString().slice(0, 10)

  if (!form.customerName.trim()) errors.customerName = 'Customer name is required.'
  if (!form.email.trim()) errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.'
  if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone)) errors.phone = 'Enter a valid phone number.'
  if (!form.productName.trim()) errors.productName = 'Product name is required.'
  if (!form.serialNumber.trim()) errors.serialNumber = 'Serial number is required.'
  if (!form.purchaseDate) errors.purchaseDate = 'Purchase date is required.'
  else if (form.purchaseDate > today) errors.purchaseDate = 'Purchase date can’t be in the future.'
  if (form.invoice && form.invoice.size > 5 * 1024 * 1024) errors.invoice = 'Invoice must be 5 MB or smaller.'

  return errors
}

export default function AddWarrantyForm({ onAdd }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [fileInputKey, setFileInputKey] = useState(0)

  const expiryDate = calculateExpiry(form.purchaseDate, form.warrantyPeriod)

  function handleChange(e) {
    const { name, value, files } = e.target
    setForm((prev) => ({ ...prev, [name]: files ? files[0] ?? null : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    setSuccess('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    onAdd({
      ...form,
      id: crypto.randomUUID(),
      invoiceName: form.invoice?.name ?? '',
      expiryDate,
      createdAt: new Date().toISOString(),
    })
    setSuccess(`Warranty added for ${form.productName} (${form.serialNumber}).`)
    handleReset()
  }

  function handleReset() {
    setForm(EMPTY_FORM)
    setErrors({})
    setFileInputKey((k) => k + 1)
  }

  const field = (name) => ({
    id: name,
    name,
    value: form[name],
    onChange: handleChange,
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  })

  const error = (name) =>
    errors[name] && (
      <p className="field-error" id={`${name}-error`}>
        {errors[name]}
      </p>
    )

  return (
    <form className="warranty-form" onSubmit={handleSubmit} noValidate>
      <h1>Add Warranty</h1>

      {success && (
        <div className="alert-success" role="status">
          {success}
        </div>
      )}

      <fieldset>
        <legend>Customer details</legend>
        <div className="grid">
          <div className="field full">
            <label htmlFor="customerName">Customer name *</label>
            <input type="text" autoComplete="name" {...field('customerName')} />
            {error('customerName')}
          </div>
          <div className="field">
            <label htmlFor="email">Email *</label>
            <input type="email" autoComplete="email" {...field('email')} />
            {error('email')}
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input type="tel" autoComplete="tel" {...field('phone')} />
            {error('phone')}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Product details</legend>
        <div className="grid">
          <div className="field full">
            <label htmlFor="productName">Product name *</label>
            <input type="text" {...field('productName')} />
            {error('productName')}
          </div>
          <div className="field">
            <label htmlFor="serialNumber">Serial number *</label>
            <input type="text" {...field('serialNumber')} />
            {error('serialNumber')}
          </div>
          <div className="field">
            <label htmlFor="orderNumber">Order number</label>
            <input type="text" placeholder="e.g. #1001" {...field('orderNumber')} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Warranty</legend>
        <div className="grid">
          <div className="field">
            <label htmlFor="purchaseDate">Purchase date *</label>
            <input type="date" {...field('purchaseDate')} />
            {error('purchaseDate')}
          </div>
          <div className="field">
            <label htmlFor="warrantyPeriod">Warranty period</label>
            <select {...field('warrantyPeriod')}>
              {WARRANTY_PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field full">
            <span className="label">Expiry date</span>
            <p className="expiry">{expiryDate || 'Select a purchase date'}</p>
          </div>
          <div className="field full">
            <label htmlFor="invoice">Invoice / receipt</label>
            <input
              key={fileInputKey}
              type="file"
              id="invoice"
              name="invoice"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleChange}
              aria-invalid={errors.invoice ? 'true' : undefined}
              aria-describedby={errors.invoice ? 'invoice-error' : 'invoice-hint'}
            />
            <p className="hint" id="invoice-hint">PDF, JPG or PNG, up to 5 MB.</p>
            {error('invoice')}
          </div>
          <div className="field full">
            <label htmlFor="notes">Notes</label>
            <textarea rows="3" {...field('notes')} />
          </div>
        </div>
      </fieldset>

      <div className="actions">
        <button type="button" className="secondary" onClick={() => { handleReset(); setSuccess('') }}>
          Clear
        </button>
        <button type="submit">Add warranty</button>
      </div>
    </form>
  )
}
