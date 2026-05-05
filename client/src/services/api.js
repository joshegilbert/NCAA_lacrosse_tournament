const base =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api')

function getToken() {
  return localStorage.getItem('token')
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const t = getToken()
  if (t) headers.Authorization = `Bearer ${t}`
  const res = await fetch(`${base}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || 'Request failed')
    err.status = res.status
    err.details = data.details
    throw err
  }
  return data
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}
