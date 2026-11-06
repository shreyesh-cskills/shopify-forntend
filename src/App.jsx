import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import ProductsPage from './pages/ProductsPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import WarrantyPage from './pages/WarrantyPage.jsx'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <header className="topbar">
        <nav className="container nav">
          <span className="brand">Shop Admin</span>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/warranty">Warranty</NavLink>
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/warranty" element={<WarrantyPage />} />
          <Route path="*" element={<p className="hint">Page not found.</p>} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
