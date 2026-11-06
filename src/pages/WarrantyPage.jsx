import { useState } from 'react'
import AddWarrantyForm from '../components/AddWarrantyForm.jsx'

export default function WarrantyPage() {
  const [warranties, setWarranties] = useState([])

  return (
    <>
      <AddWarrantyForm onAdd={(w) => setWarranties((prev) => [w, ...prev])} />

      {warranties.length > 0 && (
        <section className="warranty-list">
          <h2>Added warranties ({warranties.length})</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Serial no.</th>
                  <th>Purchased</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {warranties.map((w) => (
                  <tr key={w.id}>
                    <td>{w.customerName}<br /><small>{w.email}</small></td>
                    <td>{w.productName}</td>
                    <td>{w.serialNumber}</td>
                    <td>{w.purchaseDate}</td>
                    <td>{w.expiryDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
