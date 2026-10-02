const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")

export async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data?.error || "Request failed"), { status: res.status, data })
  return data
}
