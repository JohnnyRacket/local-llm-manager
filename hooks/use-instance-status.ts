"use client"

import { useState, useEffect, useCallback } from "react"
import type { InstanceStatus } from "@/lib/types"

export function useInstanceStatus(intervalMs = 3000) {
  const [instances, setInstances] = useState<InstanceStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/instances")
      if (!res.ok) throw new Error("Failed to fetch status")
      const data = await res.json()
      setInstances(data.instances)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, intervalMs)
    return () => clearInterval(id)
  }, [refresh, intervalMs])

  return { instances, isLoading, error, refresh }
}
