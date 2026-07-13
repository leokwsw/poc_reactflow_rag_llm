const publicBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1'

export const backendApiUrl = (path: string) => {
  const baseUrl = typeof window === 'undefined'
    ? process.env.BACKEND_API_URL || publicBaseUrl
    : publicBaseUrl
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

export async function backendFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(backendApiUrl(path), {
    ...init,
    cache: init.cache ?? 'no-store',
    headers: {
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null
    throw new Error(payload?.message || payload?.error || `Backend request failed (${response.status}).`)
  }
  return response.json() as Promise<T>
}
