export interface HealthResult {
  status: "ok" | "loading" | "error" | "unreachable"
}

export async function checkHealth(port: number): Promise<HealthResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const res = await fetch(`http://localhost:${port}/health`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (res.ok) {
      const data = await res.json()
      if (data.status === "ok") return { status: "ok" }
      if (data.status === "loading model" || data.status === "no slot available")
        return { status: "loading" }
      return { status: "error" }
    }

    if (res.status === 503) return { status: "loading" }
    return { status: "error" }
  } catch {
    return { status: "unreachable" }
  }
}
