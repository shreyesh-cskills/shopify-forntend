const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

async function request(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error(`Can’t reach the API at ${BASE_URL}. Is the Nest server running?`)
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = data?.message
    throw new Error(Array.isArray(msg) ? msg.join('; ') : msg || `Request failed (${res.status})`)
  }
  return data
}

function resource(name) {
  return {
    list: () => request(`/${name}`),
    get: (id) => request(`/${name}/${id}`),
    create: (body) => request(`/${name}`, { method: 'POST', body }),
    update: (id, body) => request(`/${name}/${id}`, { method: 'PATCH', body }),
    remove: (id) => request(`/${name}/${id}`, { method: 'DELETE' }),
  }
}

export const productsApi = resource('products')
export const ordersApi = resource('orders')

export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

export const formatMoney = (n) =>
  Number(n).toLocaleString(undefined, { style: 'currency', currency: 'USD' })
