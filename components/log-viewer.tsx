"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { InstanceId } from "@/lib/types"

const MAX_LINES = 500

interface LogViewerProps {
  instanceId: InstanceId
  instanceName: string
  onClose: () => void
}

export function LogViewer({
  instanceId,
  instanceName,
  onClose,
}: LogViewerProps) {
  const [lines, setLines] = useState<string[]>([])
  const [connected, setConnected] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/instances/${instanceId}/logs`
    )

    eventSource.onopen = () => setConnected(true)

    eventSource.onmessage = (event) => {
      setLines((prev) => {
        const next = [...prev, event.data]
        return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next
      })
    }

    eventSource.onerror = () => {
      setConnected(false)
      // EventSource auto-reconnects
    }

    return () => {
      eventSource.close()
    }
  }, [instanceId])

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [lines, autoScroll])

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 50
    setAutoScroll(atBottom)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">
            Logs — {instanceName}
          </CardTitle>
          <Badge
            variant="outline"
            className={
              connected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
            }
          >
            {connected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLines([])}
          >
            Clear
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80 rounded-md border bg-black/80 p-4">
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto"
            onScroll={handleScroll}
          >
            <pre className="font-mono text-xs leading-5 text-green-400/90 whitespace-pre-wrap break-all">
              {lines.length === 0 ? (
                <span className="text-muted-foreground">
                  Waiting for logs...
                </span>
              ) : (
                lines.join("\n")
              )}
            </pre>
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
